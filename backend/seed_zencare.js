const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function seedZenCare() {
    try {
        // 1. Find the current business (last created)
        const business = await prisma.business.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (!business) {
            console.error('No business found. Please register an account first!');
            return;
        }

        const businessId = business.id;
        const bizName = "ZenCare Wellness & Recovery";

        console.log(`🚀 Seeding ZenCare data for: ${business.name}...`);

        // 2. Clear existing demo-style data in the CORRECT order
        console.log("🧹 Cleaning old data...");
        await prisma.booking.deleteMany({ where: { businessId } });
        await prisma.serviceInventory.deleteMany({
            where: {
                service: { businessId }
            }
        });
        await prisma.service.deleteMany({ where: { businessId } });
        await prisma.inventoryItem.deleteMany({ where: { businessId } });
        await prisma.lead.deleteMany({ where: { businessId } });
        await prisma.message.deleteMany({ where: { businessId } });
        await prisma.conversation.deleteMany({ where: { businessId } });
        await prisma.automation.deleteMany({ where: { businessId } });
        await prisma.formSubmission.deleteMany({
            where: {
                form: { businessId }
            }
        });
        await prisma.form.deleteMany({ where: { businessId } });

        // Remove other staff but KEEP the owner
        await prisma.user.deleteMany({
            where: {
                businessId,
                role: 'STAFF'
            }
        });

        // 3. Create 6 Premium Services
        const services = [
            { name: 'Elite Post-Op Recovery', description: 'Intensive home care following major surgery.', duration: 120, price: 350.00 },
            { name: 'Concierge Wellness Audit', description: 'Comprehensive health and lifestyle assessment.', duration: 90, price: 199.00 },
            { name: 'Chronic Care Monitoring', description: 'Daily remote monitoring and weekly nurse visits.', duration: 60, price: 450.00 },
            { name: 'Mobile Bio-Screening', description: 'Advanced biometric data collection at your home.', duration: 45, price: 125.00 },
            { name: 'Recovery Plan Design', description: 'Custom architectural health plan for long-term care.', duration: 90, price: 250.00 },
            { name: 'Urgent Care Dispatch', description: 'Fast-response medical staff for non-emergency crises.', duration: 60, price: 500.00 }
        ];

        let firstServiceId;
        for (const s of services) {
            const created = await prisma.service.create({ data: { ...s, businessId } });
            if (!firstServiceId) firstServiceId = created.id;
        }

        // 4. Create 4 Staff Members with UNIQUE emails
        const hashed = await bcrypt.hash('password123', 10);
        const slug = business.name.replace(/\s+/g, '').toLowerCase();
        const staff = [
            { firstName: 'Alex', lastName: 'Jordan', email: `alex.j@${slug}.com` },
            { firstName: 'Sarah', lastName: 'Vance', email: `sarah.v@${slug}.com` },
            { firstName: 'Michael', lastName: 'Chen', email: `m.chen@${slug}.com` },
            { firstName: 'Emma', lastName: 'Stone', email: `e.stone@${slug}.com` }
        ];

        for (const s of staff) {
            // Check if exists first to be safe
            const existingMember = await prisma.user.findUnique({ where: { email: s.email } });
            if (!existingMember) {
                await prisma.user.create({
                    data: {
                        ...s,
                        businessId,
                        password: hashed,
                        role: 'STAFF',
                        permissions: '["leads", "bookings", "inventory", "messages"]'
                    }
                });
            }
        }

        // 5. Create 6 Inventory Items (3 low stock)
        const inventory = [
            { name: 'ZenPulse Bio-Sensors', currentStock: 2, minStock: 10, unit: 'kits', vendorEmail: 'orders@zenpulse.com' },
            { name: 'Sterile PPE MasterPacks', currentStock: 5, minStock: 15, unit: 'packs', vendorEmail: 'supplies@medisafe.net' },
            { name: 'Recover-Max Solutions', currentStock: 1, minStock: 5, unit: 'liters', vendorEmail: 'labs@recovermax.org' },
            { name: 'Vitality Monitors', currentStock: 12, minStock: 5, unit: 'pcs', vendorEmail: 'tech@vitals.com' },
            { name: 'Smart Bandages (Box)', currentStock: 20, minStock: 10, unit: 'boxes', vendorEmail: 'orders@smartfix.com' },
            { name: 'Emergency Power Bricks', currentStock: 8, minStock: 2, unit: 'units', vendorEmail: 'power@voltx.com' }
        ];

        for (const i of inventory) {
            await prisma.inventoryItem.create({ data: { ...i, businessId } });
        }

        // 6. Create 6 Leads
        const leads = [
            { firstName: 'Eleanor', lastName: 'Vance', email: 'e.vance@gmail.com', status: 'NEW', serviceInterest: 'Post-Op Recovery' },
            { firstName: 'Robert', lastName: 'Miller', email: 'rob.m@outlook.com', status: 'CONTACTED', serviceInterest: 'Wellness Audit' },
            { firstName: 'Catherine', lastName: 'Hale', email: 'chale@techmail.com', status: 'QUALIFIED', serviceInterest: 'Chronic Care' },
            { firstName: 'Julian', lastName: 'Dixon', email: 'julian.d@fastmail.com', status: 'NEW', serviceInterest: 'Urgent Care' },
            { firstName: 'Mia', lastName: 'Wong', email: 'mia.w@webmail.com', status: 'NEW', serviceInterest: 'Recovery Plan' },
            { firstName: 'George', lastName: 'Banks', email: 'gbanks@company.com', status: 'CONTACTED', serviceInterest: 'Bio-Screening' }
        ];

        for (const l of leads) {
            await prisma.lead.create({ data: { ...l, businessId } });
        }

        // 7. Create 6 Spicy Conversations
        const conversations = [
            {
                contactName: 'Sarah Miller',
                body: "Hi ZenCare, I saw your post-op recovery packages. I’m having surgery next Tuesday and would love to know if you have any specialist nurses available for home visits?"
            },
            {
                contactName: 'Eleanor Vance',
                body: "Hi ZenCare, I'm looking for post-op care for my father. He's being discharged on Friday. Do you have any concierge nurses available for a 48-hour intensive shift?"
            },
            {
                contactName: 'Robert Miller',
                body: "Saw your wellness audit package. Can this be done remotely or do you need to visit the site? Also, do you offer any family discounts?"
            },
            {
                contactName: 'Catherine Hale',
                body: "The biosensors we received aren't syncing with the app. Can Alex come by to check them today? It's kind of urgent for my monitoring."
            },
            {
                contactName: 'Julian Dixon',
                body: "Emergency! My aunt just fell, she's okay but shaken up. I need an urgent care dispatch for an assessment right now. How fast can you get here?"
            },
            {
                contactName: 'Mia Wong',
                body: "I'm a new customer. I heard you have a first-timer discount code? I'd like to book the Recovery Plan Design for my recovery next month."
            }
        ];

        for (const c of conversations) {
            await prisma.conversation.create({
                data: {
                    businessId,
                    contactName: c.contactName,
                    messages: {
                        create: [{
                            businessId,
                            direction: 'INBOUND',
                            channel: 'EMAIL',
                            body: c.body,
                            read: false
                        }]
                    }
                }
            });
        }

        // 8. Create a high-volume schedule for today
        await prisma.booking.createMany({
            data: [
                { businessId, serviceId: firstServiceId, customerName: 'George Banks', customerEmail: 'gbanks@company.com', startTime: new Date(Date.now() + 1 * 60 * 60 * 1000), endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), status: 'CONFIRMED' },
                { businessId, serviceId: firstServiceId, customerName: 'Catherine Hale', customerEmail: 'chale@techmail.com', startTime: new Date(Date.now() + 3 * 60 * 60 * 1000), endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), status: 'CONFIRMED' },
                { businessId, serviceId: firstServiceId, customerName: 'Marcus Thorne', customerEmail: 'm.thorne@ex.com', startTime: new Date(Date.now() + 5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), status: 'PENDING' },
                { businessId, serviceId: firstServiceId, customerName: 'Alice Wong', customerEmail: 'alice.w@care.com', startTime: new Date(Date.now() + 6.5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 7.5 * 60 * 60 * 1000), status: 'CONFIRMED' },
                { businessId, serviceId: firstServiceId, customerName: 'Steve Rogers', customerEmail: 'cap@avengers.com', startTime: new Date(Date.now() + 8 * 60 * 60 * 1000), endTime: new Date(Date.now() + 9 * 60 * 60 * 1000), status: 'CONFIRMED' },
                { businessId, serviceId: firstServiceId, customerName: 'Natasha Romanov', customerEmail: 'widow@shied.gov', startTime: new Date(Date.now() + 10 * 60 * 60 * 1000), endTime: new Date(Date.now() + 11 * 60 * 60 * 1000), status: 'PENDING' },

                // Tomorrow
                { businessId, serviceId: firstServiceId, customerName: 'Emma Stone', customerEmail: 'stone.e@ex.com', startTime: new Date(Date.now() + 25 * 60 * 60 * 1000), endTime: new Date(Date.now() + 26 * 60 * 60 * 1000), status: 'CONFIRMED' },

                // Historicals
                { businessId, serviceId: firstServiceId, customerName: 'Julian Dixon', customerEmail: 'julian.d@ex.com', startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), endTime: new Date(Date.now() - 23 * 60 * 60 * 1000), status: 'COMPLETED' },
                { businessId, serviceId: firstServiceId, customerName: 'Eleanor Vance', customerEmail: 'evance@ex.com', startTime: new Date(Date.now() - 48 * 60 * 60 * 1000), endTime: new Date(Date.now() - 47 * 60 * 60 * 1000), status: 'COMPLETED' },
                { businessId, serviceId: firstServiceId, customerName: 'No Show Case 1', customerEmail: 'noshow.1@ex.com', startTime: new Date(Date.now() - 5 * 60 * 60 * 1000), endTime: new Date(Date.now() - 4 * 60 * 60 * 1000), status: 'NO_SHOW' },
                { businessId, serviceId: firstServiceId, customerName: 'Success Streak A', customerEmail: 'streak.a@ex.com', startTime: new Date(Date.now() - 12 * 60 * 60 * 1000), endTime: new Date(Date.now() - 11 * 60 * 60 * 1000), status: 'COMPLETED' }
            ]
        });

        // 9. Mark Onboarding as Complete
        await prisma.business.update({
            where: { id: businessId },
            data: { onboardingComplete: true }
        });

        console.log('✅ ZENCARE ARCHITECTURE DEPLOYED. App is now a "Living" business.');

    } catch (error) {
        console.error('❌ SEEDING FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedZenCare();
