const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const communicationService = require('./communication.service');

class AutomationService {
    // Event: New Contact -> Welcome Message
    async handleNewContact(businessId, contact) {
        console.log(`[Automation] New Contact Event: ${contact.email}`);

        // Check if welcome message already sent to avoid duplicates (idempotency)
        // Also check if automation is paused (e.g. returning customer in active convo)
        const conversation = await prisma.conversation.findUnique({ where: { id: contact.conversationId } });

        if (conversation && conversation.isAutomationPaused) {
            console.log(`[Automation] Skipped welcome for ${contact.email} (Automation Paused)`);
            return;
        }

        const existing = await prisma.message.findFirst({
            where: {
                conversationId: contact.conversationId,
                direction: 'OUTBOUND',
                body: { contains: 'Thanks for reaching out' }
            }
        });

        if (!existing) {
            const body = `Hi ${contact.firstName}, thanks for reaching out to us! We've received your inquiry and a team member will get back to you shortly.`;
            await prisma.message.create({
                data: {
                    businessId,
                    conversationId: contact.conversationId,
                    direction: 'OUTBOUND',
                    channel: 'EMAIL',
                    body,
                    sent: true,
                    read: true
                }
            });
            console.log(`[Automation] Welcome message logged for ${contact.email}`);

            // Send Integration: Email
            await communicationService.sendEmail(contact.email, "Welcome to OpsFlow", body);
        }
    }

    // Event: Booking Created -> Confirmation & Forms
    async handleBookingCreated(booking) {
        console.log(`[Automation] Booking Created Event: ${booking.id}`);

        // 1. Send Confirmation
        // Get conversation
        const conversation = await prisma.conversation.findFirst({
            where: {
                businessId: booking.businessId,
                OR: [{ contactEmail: booking.customerEmail }, { contactPhone: booking.customerPhone }]
            }
        });

        if (conversation && !conversation.isAutomationPaused) {
            const confirmBody = `Booking Confirmed! Hi ${booking.customerName}, your appointment is scheduled for ${new Date(booking.startTime).toLocaleString()}.`;

            await prisma.message.create({
                data: {
                    businessId: booking.businessId,
                    conversationId: conversation.id,
                    direction: 'OUTBOUND',
                    channel: 'EMAIL',
                    body: confirmBody,
                    sent: true,
                    read: true
                }
            });
            console.log(`[Automation] Confirmation logged for ${booking.customerEmail}`);
            await communicationService.sendEmail(booking.customerEmail, "Booking Confirmation", confirmBody);

            // 2. Trigger Forms if needed
            const form = await prisma.form.findFirst({
                where: { businessId: booking.businessId, isActive: true }
            });

            if (form) {
                // Check if already assigned
                const existingSubmission = await prisma.formSubmission.findFirst({
                    where: { bookingId: booking.id }
                });

                if (!existingSubmission) {
                    const submission = await prisma.formSubmission.create({
                        data: {
                            formId: form.id,
                            bookingId: booking.id,
                            customerName: booking.customerName,
                            customerEmail: booking.customerEmail,
                            status: 'PENDING',
                            data: '{}'
                        }
                    });

                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                    const formBody = `Important: Please complete this intake form before your appointment: ${frontendUrl}/f/${submission.id}`;
                    await prisma.message.create({
                        data: {
                            businessId: booking.businessId,
                            conversationId: conversation.id,
                            direction: 'OUTBOUND',
                            channel: 'EMAIL',
                            body: formBody,
                            sent: true,
                            read: true
                        }
                    });
                    console.log(`[Automation] Form request logged for ${booking.customerEmail}`);
                    await communicationService.sendEmail(booking.customerEmail, "Action Required: Intake Form", formBody);
                }
            }
        } else {
            console.log(`[Automation] Skipped for ${booking.customerEmail} (Automation Paused or No Conversation)`);
        }
    }

    // Event: Scheduled Check (Cron)
    async checkReminders() {
        console.log('[Automation] Checking for reminders...');
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowEnd = new Date(tomorrow.getTime() + 15 * 60 * 1000); // 15 min window

        // 1. Booking Reminders (24h before)
        const upcomingBookings = await prisma.booking.findMany({
            where: {
                startTime: {
                    gte: tomorrow,
                    lt: tomorrowEnd
                },
                status: 'CONFIRMED'
            }
        });

        for (const booking of upcomingBookings) {
            // Check if reminder already sent (logically, we could check messages, but for hackathon simple check)
            // Ideally we'd have a 'reminded' flag or check message history. 
            // We'll check message history for "Reminder:" in body in last 24h
            const conversation = await prisma.conversation.findFirst({
                where: {
                    businessId: booking.businessId,
                    OR: [{ contactEmail: booking.customerEmail }, { contactPhone: booking.customerPhone }]
                }
            });

            if (conversation && !conversation.isAutomationPaused) {
                const alreadyReminded = await prisma.message.findFirst({
                    where: {
                        conversationId: conversation.id,
                        body: { contains: 'Reminder: Your appointment is tomorrow' },
                        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
                    }
                });

                if (!alreadyReminded) {
                    const smsBody = `Reminder: Your appointment with OpsFlow is tomorrow at ${new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. See you then!`;

                    await prisma.message.create({
                        data: {
                            businessId: booking.businessId,
                            conversationId: conversation.id,
                            direction: 'OUTBOUND',
                            channel: 'SMS', // SMS is better for reminders
                            body: smsBody,
                            sent: true,
                            read: true
                        }
                    });
                    console.log(`[Automation] Reminder logged for ${booking.customerName}`);

                    // Send Integration: SMS
                    if (booking.customerPhone) {
                        await communicationService.sendSMS(booking.customerPhone, smsBody);
                    }
                }
            }
        }

        // 2. Pending Form Reminders (24h after creation if still pending)
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayEnd = new Date(yesterday.getTime() + 15 * 60 * 1000);

        const overdueForms = await prisma.formSubmission.findMany({
            where: {
                status: 'PENDING',
                createdAt: {
                    gte: yesterday,
                    lt: yesterdayEnd
                }
            },
            include: { booking: true }
        });

        for (const submission of overdueForms) {
            const conversation = await prisma.conversation.findFirst({
                where: {
                    OR: [{ contactEmail: submission.customerEmail }]
                }
            });

            if (conversation && !conversation.isAutomationPaused) {
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                const reminderBody = `Action Required: We noticed you haven't completed your intake form yet. Please fill it out here: ${frontendUrl}/f/${submission.id}`;

                await prisma.message.create({
                    data: {
                        businessId: conversation.businessId,
                        conversationId: conversation.id,
                        direction: 'OUTBOUND',
                        channel: 'EMAIL',
                        body: reminderBody,
                        sent: true,
                        read: true
                    }
                });
                console.log(`[Automation] Form reminder logged for ${submission.customerEmail}`);
                await communicationService.sendEmail(submission.customerEmail, "Reminder: Complete Intake Form", reminderBody);
            }
        }
    }
    // Event: Inventory Threshold Breach
    async handleLowStock(item) {
        console.log(`[Automation] Low Stock Alert: ${item.name} (${item.currentStock}/${item.minStock})`);

        // 1. Find or Create "System Notifications" Conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                businessId: item.businessId,
                contactEmail: 'system@opsflow.ai'
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    businessId: item.businessId,
                    contactName: 'System Notifications',
                    contactEmail: 'system@opsflow.ai', // Special system email
                    contactPhone: '000-000-0000',
                    isAutomationPaused: true // Prevent loops
                }
            });
        }

        // 2. Send Alert Message to Inbox
        // Check if alert already sent recently (e.g. last 24h) to avoid spam
        const lastAlert = await prisma.message.findFirst({
            where: {
                conversationId: conversation.id,
                body: { contains: `Low Stock Alert: ${item.name}` },
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        });

        if (!lastAlert) {
            const alertBody = `🚨 Low Stock Alert: ${item.name} has dropped to ${item.currentStock} ${item.unit}. Please restock immediately.`;
            await prisma.message.create({
                data: {
                    businessId: item.businessId,
                    conversationId: conversation.id,
                    direction: 'INBOUND', // Appears as incoming message
                    channel: 'EMAIL', // Or 'SYSTEM' if enum allows, stick to EMAIL for safety
                    body: alertBody,
                    read: false // Mark unread so it grabs attention
                }
            });
            console.log(`[Automation] Inventory alert logged for ${item.name}`);

            // Integration: Vendor Restock Email (Pointed out as "Crucial" in guidelines)
            if (item.vendorEmail) {
                const vendorBody = `
                    <h2>Restock Request</h2>
                    <p>Hello ${item.vendorName || 'Vendor'},</p>
                    <p>This is an automated notification from OpsFlow. Our stock for <strong>${item.name}</strong> has dropped below the minimum threshold.</p>
                    <p><strong>Current Stock:</strong> ${item.currentStock} ${item.unit}</p>
                    <p><strong>Threshold:</strong> ${item.minStock} ${item.unit}</p>
                    <p>Please prepare a restock shipment or contact us for an official Purchase Order.</p>
                    <br/>
                    <p>Regards,<br/>Inventory Management System</p>
                `;
                await communicationService.sendEmail(item.vendorEmail, `ACTION REQUIRED: Restock Request for ${item.name}`, vendorBody);
                console.log(`[Automation] Vendor restock request sent to ${item.vendorEmail}`);
            }
        }
    }
}

module.exports = new AutomationService();
