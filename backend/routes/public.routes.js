const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get Business Public Profile & Services
router.get('/business/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            include: {
                services: {
                    where: { isActive: true },
                    select: { id: true, name: true, description: true, duration: true, price: true }
                }
            }
        });

        if (!business) return res.status(404).json({ error: 'Business not found' });
        res.json(business);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch business profile' });
    }
});

// 2. Get Public Form Submission
router.get('/form-submission/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const submission = await prisma.formSubmission.findUnique({
            where: { id },
            include: {
                form: {
                    select: { name: true, description: true, fields: true, business: { select: { name: true, logo: true } } }
                }
            }
        });

        if (!submission) return res.status(404).json({ error: 'Form not found' });
        res.json(submission);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch form' });
    }
});

// 3. Submit Public Form
router.post('/form-submission/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data } = req.body;

        const submission = await prisma.formSubmission.update({
            where: { id },
            data: {
                data: JSON.stringify(data),
                status: 'COMPLETED',
                completedAt: new Date()
            },
            include: {
                form: { select: { businessId: true } }
            }
        });

        // Add to activity feed/notifications? 
        // For now, just mark completed.

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit form' });
    }
});

const automationService = require('../services/automation.service');

// 2. Flow A: Contact Form Submission
router.post('/contact/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { firstName, lastName, email, phone, message, serviceInterest } = req.body;

        // 1. Create the Lead
        const lead = await prisma.lead.create({
            data: {
                businessId,
                firstName,
                lastName,
                email,
                phone,
                message,
                serviceInterest,
                status: 'NEW',
                source: 'WEB_FORM'
            }
        });

        // 2. Find or Create Conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                businessId,
                OR: [
                    { contactEmail: email },
                    { contactPhone: phone }
                ]
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    businessId,
                    contactName: `${firstName} ${lastName}`,
                    contactEmail: email,
                    contactPhone: phone
                }
            });
        }

        // 3. Create the inbound message
        await prisma.message.create({
            data: {
                businessId,
                conversationId: conversation.id,
                direction: 'INBOUND',
                channel: 'WEB',
                body: `New Inquiry: ${message}`,
                recipientEmail: email,
                recipientName: `${firstName} ${lastName}`
            }
        });

        // 4. Trigger Automation: New Contact (Background)
        automationService.handleNewContact(businessId, {
            conversationId: conversation.id,
            firstName,
            email
        }).catch(err => console.error('Automation Background Error:', err));

        res.json({ success: true, leadId: lead.id });
    } catch (error) {
        console.error('Public contact error:', error);
        res.status(500).json({ error: 'Failed to submit inquiry' });
    }
});

// 3. Flow B: Quick Booking
router.post('/book/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { serviceId, customerName, customerEmail, customerPhone, startTime, notes } = req.body;

        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) return res.status(404).json({ error: 'Service not found' });

        const endT = new Date(new Date(startTime).getTime() + service.duration * 60000);

        // 1. Create Booking
        const booking = await prisma.booking.create({
            data: {
                businessId,
                serviceId,
                customerName,
                customerEmail,
                customerPhone,
                startTime: new Date(startTime),
                endTime: endT,
                notes,
                status: 'CONFIRMED' // Auto-confirm for demo
            }
        });

        // 2. Find or Create Conversation (Ensure it exists for automation)
        let conversation = await prisma.conversation.findFirst({
            where: {
                businessId,
                OR: [{ contactEmail: customerEmail }, { contactPhone: customerPhone }]
            }
        });

        if (!conversation) {
            await prisma.conversation.create({
                data: {
                    businessId,
                    contactName: customerName,
                    contactEmail: customerEmail,
                    contactPhone: customerPhone
                }
            });
        }

        // 3. Trigger Automation: Booking Created (Background)
        automationService.handleBookingCreated(booking).catch(err => console.error('Automation Background Error:', err));

        res.json({ success: true, bookingId: booking.id });
    } catch (error) {
        console.error('Public booking error:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

module.exports = router;
