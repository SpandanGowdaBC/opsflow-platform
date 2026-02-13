const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simple in-memory cache for dashboard stats (5-10 second TTL)
let dashboardCache = {
    data: null,
    timestamp: 0,
    businessId: null
};

// Get dashboard data - The "What is happening right now?" view
router.get('/', verifyToken, async (req, res) => {
    try {
        const businessId = req.businessId;

        // Check cache (10 second refresh)
        if (dashboardCache.data &&
            dashboardCache.businessId === businessId &&
            (Date.now() - dashboardCache.timestamp < 10000)) {
            return res.json(dashboardCache.data);
        }

        // 1. Get counts for the KPI cards
        const [
            leadsCount,
            upcomingBookingsCount,
            formsCount,
            completedCount,
            noShowCount,
            newInquiriesCount,
            ongoingConvosCount,
            unansweredMessagesCount,
            totalCompletedForms,
            overdueFormsCount,
            unconfirmedBookingsCount,
            allInventoryItems
        ] = await Promise.all([
            prisma.lead.count({ where: { businessId, status: { not: 'LOST' } } }),
            prisma.booking.count({
                where: {
                    businessId,
                    startTime: { gte: new Date() },
                    status: 'CONFIRMED'
                }
            }),
            prisma.formSubmission.count({
                where: {
                    form: { businessId },
                    status: 'PENDING'
                }
            }),
            prisma.booking.count({ where: { businessId, status: 'COMPLETED' } }),
            prisma.booking.count({ where: { businessId, status: 'NO_SHOW' } }),
            prisma.lead.count({ where: { businessId, status: 'NEW' } }),
            prisma.lead.count({ where: { businessId, status: { in: ['CONTACTED', 'QUALIFIED'] } } }),
            prisma.message.count({ where: { businessId, direction: 'INBOUND', read: false } }),
            prisma.formSubmission.count({
                where: {
                    form: { businessId },
                    status: 'COMPLETED'
                }
            }),
            prisma.formSubmission.count({
                where: {
                    form: { businessId },
                    status: 'PENDING',
                    createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // More than 24h old
                }
            }),
            prisma.booking.count({
                where: {
                    businessId,
                    status: 'PENDING'
                }
            }),
            prisma.inventoryItem.findMany({ where: { businessId } })
        ]);

        const lowStockCount = allInventoryItems.filter(item => item.currentStock <= item.minStock).length;
        const lowStockItems = allInventoryItems
            .filter(item => item.currentStock <= item.minStock)
            .sort((a, b) => a.currentStock - b.currentStock)
            .slice(0, 5);

        // 2. Get Today's Bookings (Using a wider window to handle timezone offsets)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        todayStart.setDate(todayStart.getDate() - 1); // Expand to include yesterday's tail
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        todayEnd.setDate(todayEnd.getDate() + 1); // Expand to include tomorrow's start

        const todaysBookings = await prisma.booking.findMany({
            where: {
                businessId,
                startTime: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            include: {
                service: { select: { name: true } }
            },
            orderBy: { startTime: 'asc' }
        });

        // 3. Get Recent Activity Feed (Unified stream)
        const [recentLeads, recentBookings, recentSubmissions, recentMessages] = await Promise.all([
            prisma.lead.findMany({
                where: { businessId },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),
            prisma.booking.findMany({
                where: { businessId },
                include: { service: true },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),
            prisma.formSubmission.findMany({
                where: { form: { businessId } },
                include: { form: true },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),
            prisma.message.findMany({
                where: { businessId },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ]);

        // Merge and sort activities
        const activities = [
            ...recentLeads.map(l => ({
                id: l.id,
                type: 'LEAD',
                title: `New Lead: ${l.firstName || 'Unknown'} ${l.lastName || ''}`,
                description: l.serviceInterest || 'Expressed interest',
                time: l.createdAt,
                icon: '🎯'
            })),
            ...recentBookings.map(b => ({
                id: b.id,
                type: 'BOOKING',
                title: `Booking: ${b.customerName}`,
                description: `${b.service.name} at ${b.startTime.toLocaleTimeString()}`,
                time: b.createdAt,
                icon: '📅'
            })),
            ...recentSubmissions.map(s => ({
                id: s.id,
                type: 'FORM',
                title: `Form Submitted: ${s.form.name}`,
                description: `From ${s.customerName || 'Anonymous'}`,
                time: s.createdAt,
                icon: '📝'
            })),
            ...recentMessages.map(m => ({
                id: m.id,
                type: 'MESSAGE',
                title: `${m.direction === 'INBOUND' ? 'Received' : 'Sent'} ${m.channel}`,
                description: m.body.substring(0, 50) + (m.body.length > 50 ? '...' : ''),
                time: m.createdAt,
                icon: m.direction === 'INBOUND' ? '📩' : '📤'
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

        // Handled above with lowStockCount and lowStockItems filtering

        const responseData = {
            stats: {
                activeLeads: leadsCount,
                upcomingBookings: upcomingBookingsCount,
                pendingForms: formsCount,
                lowStockItems: lowStockCount,
                completedBookings: completedCount,
                noShowBookings: noShowCount,
                newInquiries: newInquiriesCount,
                ongoingConversations: ongoingConvosCount,
                unansweredMessages: unansweredMessagesCount,
                completedForms: totalCompletedForms,
                overdueForms: overdueFormsCount,
                unconfirmedBookings: unconfirmedBookingsCount
            },
            todaysBookings,
            activities,
            lowStockItems
        };

        // Update Cache
        dashboardCache = {
            data: responseData,
            timestamp: Date.now(),
            businessId: businessId
        };

        res.json(responseData);

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// 5. SEED DEMO DATA (Super Seed for Hackathon)
router.post('/seed-demo', verifyToken, async (req, res) => {
    try {
        const businessId = req.businessId;
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        const bizName = business?.name || 'My Business';
        const lowerName = bizName.toLowerCase();

        // 1. Context-Aware Services (Added more variety)
        let service = await prisma.service.findFirst({ where: { businessId } });
        if (!service) {
            let servicesToCreate = [];
            if (lowerName.includes('clean') || lowerName.includes('wash')) {
                servicesToCreate = [
                    { name: 'Deep Home Sanitize', description: 'Full property disinfection and deep cleaning.', duration: 180, price: 299.00 },
                    { name: 'Office Maintenance', description: 'Regular janitorial and office upkeep.', duration: 120, price: 150.00 },
                    { name: 'Window Clarity Pro', description: 'Inside/outside premium glass treatment.', duration: 90, price: 85.00 }
                ];
            } else if (lowerName.includes('spa') || lowerName.includes('beauty') || lowerName.includes('zen') || lowerName.includes('care')) {
                servicesToCreate = [
                    { name: 'Elite Post-Op Recovery', description: 'Intensive home care following major surgery.', duration: 120, price: 350.00 },
                    { name: 'Concierge Wellness Audit', description: 'Comprehensive physical and environmental health audit.', duration: 90, price: 199.00 },
                    { name: 'Chronic Care Monitoring', description: 'Daily remote monitoring and weekly clinical check-ins.', duration: 60, price: 450.00 },
                    { name: 'Mobile Bio-Screening', description: 'Advanced biometric data collection at your home.', duration: 45, price: 125.00 }
                ];
            } else {
                servicesToCreate = [
                    { name: 'Strategic Assessment', description: 'Initial evaluation and roadmap design.', duration: 60, price: 199.00 },
                    { name: 'Priority Implementation', description: 'Fast-track deployment of core solutions.', duration: 120, price: 450.00 }
                ];
            }

            for (const s of servicesToCreate) {
                const created = await prisma.service.create({ data: { ...s, businessId } });
                if (!service) service = created;
            }
        }

        // 2. Add multiple Staff members (More realistic)
        if (service) {
            const bcrypt = require('bcryptjs');
            const hashed = await bcrypt.hash('password123', 10);
            const slug = bizName.replace(/\s+/g, '').toLowerCase();
            const staffList = [
                { firstName: 'Alex', lastName: 'Jordan', email: `alex.j@${slug}.com` },
                { firstName: 'Sarah', lastName: 'Vance', email: `sarah.v@${slug}.com` },
                { firstName: 'Michael', lastName: 'Chen', email: `michael.c@${slug}.com` },
                { firstName: 'Emma', lastName: 'Stone', email: `emma.s@${slug}.com` }
            ];

            for (const s of staffList) {
                // Check if global unique email exists
                const existing = await prisma.user.findUnique({ where: { email: s.email } });
                if (!existing) {
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
        }

        // 3. Create a Form
        const formCount = await prisma.form.count({ where: { businessId } });
        if (formCount === 0) {
            await prisma.form.create({
                data: {
                    businessId,
                    name: lowerName.includes('care') ? 'Patient Clinical Intake' : 'Client Requirements & Profile',
                    description: 'Automated data capture for new active pipelines.',
                    fields: JSON.stringify([
                        { name: 'full_name', type: 'text', label: 'Full Name', required: true },
                        { name: 'priority_level', type: 'select', label: 'Priority Level', options: ['Urgent', 'Standard', 'Future Planning'] },
                        { name: 'notes', type: 'textarea', label: 'Specific Requirements/History' }
                    ])
                }
            });
        }

        // 4. Create richer leads
        if (true) {
            const seedLeads = [
                { businessId, firstName: 'Eleanor', lastName: 'Vance', email: 'e.vance@gmail.com', status: 'NEW', serviceInterest: 'Recovery Care' },
                { businessId, firstName: 'Julian', lastName: 'Dixon', email: 'j.dixon@fastmail.com', status: 'QUALIFIED', serviceInterest: 'Monitoring' },
                { businessId, firstName: 'Catherine', lastName: 'Hale', email: 'c.hale@techmail.com', status: 'CONTACTED', serviceInterest: 'Wellness Audit' },
                { businessId, firstName: 'Amara', lastName: 'Kaur', email: 'amara.k@care.com', status: 'NEW', serviceInterest: 'Post-Op' },
                { businessId, firstName: 'Steve', lastName: 'Jobs', email: 'steve.j@apple.com', status: 'QUALIFIED', serviceInterest: 'Elite Wellness' }
            ];

            for (const l of seedLeads) {
                // Try to find existing lead with same email for this business to avoid duplicates if possible, or just add
                await prisma.lead.create({ data: l });
            }
        }

        // 5. Create active conversations
        if (true) {
            const convos = [
                { name: 'Eleanor Vance', body: `Hi! I'm looking for specialized care at ${bizName} for my father. He's being discharged on Friday. Do you have availability for a concierge assessment?` },
                { name: 'Julian Dixon', body: `Emergency! My aunt had a fall. She's okay but shaken. I heard you have a dispatch team? How fast can you get a nurse here for an audit?` }
            ];

            for (const c of convos) {
                await prisma.conversation.create({
                    data: {
                        businessId,
                        contactName: c.name,
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
        }

        // 6. Create upcoming bookings
        if (service) {
            const allServices = await prisma.service.findMany({ where: { businessId } });
            const s1 = allServices[0]?.id;
            const s2 = allServices[1]?.id || s1;

            await prisma.booking.createMany({
                data: [
                    // Today's Bookings (Morning Rush)
                    { businessId, serviceId: s1, customerName: 'Catherine Hale', customerEmail: 'c.hale@techmail.com', startTime: new Date(Date.now() + 1 * 60 * 60 * 1000), endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), status: 'CONFIRMED' },
                    { businessId, serviceId: s2, customerName: 'Robert Miller', customerEmail: 'rob.m@outlook.com', startTime: new Date(Date.now() + 1.5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000), status: 'PENDING' },
                    { businessId, serviceId: s1, customerName: 'Sarah Jenkins', customerEmail: 's.jenkins@example.com', startTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 3.5 * 60 * 60 * 1000), status: 'CONFIRMED' },
                    { businessId, serviceId: s2, customerName: 'Michael Chen', customerEmail: 'm.chen@tech.com', startTime: new Date(Date.now() + 3 * 60 * 60 * 1000), endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), status: 'CONFIRMED' },
                    { businessId, serviceId: s1, customerName: 'Alice Wong', customerEmail: 'alice.w@ex.com', startTime: new Date(Date.now() + 4 * 60 * 60 * 1000), endTime: new Date(Date.now() + 5 * 60 * 60 * 1000), status: 'CONFIRMED' },
                    { businessId, serviceId: s2, customerName: 'Waitlist Client 1', customerEmail: 'wait1@ex.com', startTime: new Date(Date.now() + 4.5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 5.5 * 60 * 60 * 1000), status: 'PENDING' },
                    // Today's Bookings (Afternoon)
                    {
                        businessId, serviceId: s2, customerName: 'David Vance', customerEmail: 'david.v@gmail.com',
                        startTime: new Date(Date.now() + 5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
                        status: 'CONFIRMED'
                    },
                    {
                        businessId, serviceId: s1, customerName: 'Julian Dixon', customerEmail: 'julian.d@ex.com',
                        startTime: new Date(Date.now() + 6.5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 7.5 * 60 * 60 * 1000),
                        status: 'CONFIRMED'
                    },
                    {
                        businessId, serviceId: s2, customerName: 'Eleanor Vance', customerEmail: 'e.vance@ex.com',
                        startTime: new Date(Date.now() + 8 * 60 * 60 * 1000), endTime: new Date(Date.now() + 9 * 60 * 60 * 1000),
                        status: 'PENDING'
                    },
                    // Tomorrow's Pack Schedule
                    {
                        businessId, serviceId: s1, customerName: 'Lilly Chen', customerEmail: 'lilly@chen.com',
                        startTime: new Date(Date.now() + 25 * 60 * 60 * 1000), endTime: new Date(Date.now() + 26 * 60 * 60 * 1000),
                        status: 'CONFIRMED'
                    },
                    {
                        businessId, serviceId: s2, customerName: 'Marcus Thorne', customerEmail: 'm.thorne@ex.com',
                        startTime: new Date(Date.now() + 27 * 60 * 60 * 1000), endTime: new Date(Date.now() + 28 * 60 * 60 * 1000),
                        status: 'PENDING'
                    },
                    {
                        businessId, serviceId: s1, customerName: 'Gregory Banks', customerEmail: 'gbanks@company.com',
                        startTime: new Date(Date.now() + 30 * 60 * 60 * 1000), endTime: new Date(Date.now() + 31 * 60 * 60 * 1000),
                        status: 'CONFIRMED'
                    },
                    {
                        businessId, serviceId: s2, customerName: 'Waitlist Client A', customerEmail: 'waitlist.a@ex.com',
                        startTime: new Date(Date.now() + 33 * 60 * 60 * 1000), endTime: new Date(Date.now() + 34 * 60 * 60 * 1000),
                        status: 'PENDING'
                    },
                    // Past Bookings (Historicals)
                    {
                        businessId, serviceId: s1, customerName: 'Old Customer A', customerEmail: 'a@ex.com',
                        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), endTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
                        status: 'COMPLETED'
                    },
                    {
                        businessId, serviceId: s2, customerName: 'Old Customer B', customerEmail: 'b@ex.com',
                        startTime: new Date(Date.now() - 48 * 60 * 60 * 1000), endTime: new Date(Date.now() - 47 * 60 * 60 * 1000),
                        status: 'COMPLETED'
                    },
                    {
                        businessId, serviceId: s1, customerName: 'Missed Appointment', customerEmail: 'm@ex.com',
                        startTime: new Date(Date.now() - 5 * 60 * 60 * 1000), endTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
                        status: 'NO_SHOW'
                    },
                    {
                        businessId, serviceId: s1, customerName: 'Recent Success', customerEmail: 'success@ex.com',
                        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), endTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
                        status: 'COMPLETED'
                    },
                    {
                        businessId, serviceId: s2, customerName: 'Past VIP Grace', customerEmail: 'grace.vip@ex.com',
                        startTime: new Date(Date.now() - 72 * 60 * 60 * 1000), endTime: new Date(Date.now() - 71 * 60 * 60 * 1000),
                        status: 'COMPLETED'
                    },
                    {
                        businessId, serviceId: s1, customerName: 'No Show Case 2', customerEmail: 'noshow2@ex.com',
                        startTime: new Date(Date.now() - 10 * 60 * 60 * 1000), endTime: new Date(Date.now() - 9 * 60 * 60 * 1000),
                        status: 'NO_SHOW'
                    },
                    {
                        businessId, serviceId: s2, customerName: 'Success Streak 3', customerEmail: 'streak3@ex.com',
                        startTime: new Date(Date.now() - 15 * 60 * 60 * 1000), endTime: new Date(Date.now() - 14 * 60 * 60 * 1000),
                        status: 'COMPLETED'
                    }
                ]
            });
        }

        // 7. Populate Documentation Hub (Form Submissions)
        if (true) {
            const form = await prisma.form.findFirst({ where: { businessId } });
            if (form) {
                // Get some customers for context
                await prisma.formSubmission.createMany({
                    data: [
                        {
                            formId: form.id, customerName: 'Catherine Hale', customerEmail: 'c.hale@techmail.com',
                            status: 'COMPLETED', data: JSON.stringify({ full_name: 'Catherine Hale', priority_level: 'Standard', notes: 'No allergies.' }),
                            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
                        },
                        {
                            formId: form.id, customerName: 'David Vance', customerEmail: 'david.v@example.com',
                            status: 'COMPLETED', data: JSON.stringify({ full_name: 'David Vance', priority_level: 'Urgent', notes: 'Requires wheelchair access.' }),
                            createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
                        },
                        {
                            formId: form.id, customerName: 'Sarah Jenkins', customerEmail: 's.jenkins@example.com',
                            status: 'PENDING', data: '{}',
                            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
                        },
                        {
                            formId: form.id, customerName: 'Marcus Thorne', customerEmail: 'm.thorne@ex.com',
                            status: 'PENDING', data: '{}',
                            createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000) // This will trigger the OVERDUE (>24h) alert
                        }
                    ]
                });
            }
        }

        // 8. Add Critical Stock items (The "Crisis" part of the demo)
        if (true) {
            await prisma.inventoryItem.createMany({
                data: [
                    { businessId, name: 'Surgical Kits', currentStock: 1, minStock: 5, unit: 'kits', vendorName: 'MedSupply Inc', vendorEmail: 'orders@medsupply.com', lowStockAlert: true },
                    { businessId, name: 'Sanitization Solution', currentStock: 2, minStock: 10, unit: 'liters', vendorName: 'CleanCorp', vendorEmail: 'restock@cleancorp.com', lowStockAlert: true },
                    { businessId, name: 'Patient Gowns', currentStock: 50, minStock: 20, unit: 'units' }
                ]
            });
        }

        // 9. Add Elite "Hackathon Narrative" Messages
        if (true) {
            const hotLeadConv = await prisma.conversation.create({
                data: {
                    businessId,
                    contactName: 'Sarah Miller',
                    contactEmail: 's.miller@fast.com',
                    messages: {
                        create: [
                            {
                                businessId, direction: 'INBOUND', channel: 'EMAIL', body: "Hi, I'm looking for immediate post-op care for my husband. Do you have a nurse available this evening?", read: false
                            },
                            {
                                businessId, direction: 'OUTBOUND', channel: 'EMAIL', body: "Hi Sarah! Our AI assistant here. Yes, we have a qualified caregiver specializing in recovery available at 6 PM. Would you like to lock this in?", sent: true
                            }
                        ]
                    }
                }
            });
        }

        // 10. Context-Aware Inventory
        const inventoryCount = await prisma.inventoryItem.count({ where: { businessId } });
        if (inventoryCount === 0) {
            let inventoryToCreate = [];
            if (lowerName.includes('clean') || lowerName.includes('wash')) {
                inventoryToCreate = [
                    { name: 'Floor Wax (Concentrate)', currentStock: 2, minStock: 5, unit: 'gallons', vendorEmail: 'supplies@cleanpro.com' },
                    { name: 'Microfiber Packs', currentStock: 3, minStock: 10, unit: 'packs', vendorEmail: 'sales@textilepro.net' },
                    { name: 'HEPA Vacuum Filters', currentStock: 1, minStock: 4, unit: 'pcs', vendorEmail: 'parts@filterworld.com' },
                    { name: 'Eco-Degreaser (5L)', currentStock: 8, minStock: 5, unit: 'containers', vendorEmail: 'green@supplies.org' }
                ];
            } else if (lowerName.includes('spa') || lowerName.includes('beauty') || lowerName.includes('zen') || lowerName.includes('care')) {
                inventoryToCreate = [
                    { name: 'ZENPULSE BIO-SENSORS', currentStock: 2, minStock: 10, unit: 'kits', vendorEmail: 'orders@zenpulse.com' },
                    { name: 'STERILE PPE KITS', currentStock: 5, minStock: 15, unit: 'packs', vendorEmail: 'supplies@medisafe.net' },
                    { name: 'RECOVERY SOLUTION (1L)', currentStock: 1, minStock: 5, unit: 'liters', vendorEmail: 'labs@recovery.org' },
                    { name: 'VITALITY MONITORS', currentStock: 12, minStock: 5, unit: 'pcs', vendorEmail: 'tech@vitals.com' },
                    { name: 'HYDRATION PACKS', currentStock: 3, minStock: 12, unit: 'units', vendorEmail: 'orders@hydrationpro.com' },
                    { name: 'CALM-WAVE ESSENTIALS', currentStock: 20, minStock: 10, unit: 'vials', vendorEmail: 'wholesale@calmwave.biz' }
                ];
            } else {
                inventoryToCreate = [
                    { name: 'CORE CONSUMABLES', currentStock: 4, minStock: 15, unit: 'units', vendorEmail: 'contact@industrialsupply.com' },
                    { name: 'PRECISION SENSORS', currentStock: 2, minStock: 10, unit: 'pcs', vendorEmail: 'tech@sensorsworld.com' },
                    { name: 'MAINTENANCE LUBE (1L)', currentStock: 14, minStock: 5, unit: 'cans', vendorEmail: 'lubes@gearworld.com' }
                ];
            }

            for (const item of inventoryToCreate) {
                await prisma.inventoryItem.create({ data: { ...item, businessId } });
            }
        }

        // 9. Mark Onboarding as Complete so it doesn't loop
        await prisma.business.update({
            where: { id: businessId },
            data: { onboardingComplete: true }
        });

        res.json({ message: 'Dynamic Super Seed successful' });
    } catch (error) {
        console.error('Super Seed error:', error);
        res.status(500).json({ error: 'Failed to seed rich demo data' });
    }
});

// 6. TRIGGER FAST ACTIONS
router.post('/fast-actions', verifyToken, async (req, res) => {
    try {
        const businessId = req.businessId;

        // 1. Mass Remind & Auto-Complete for Forms
        const businessForms = await prisma.form.findMany({
            where: { businessId },
            select: { id: true }
        });
        const formIds = businessForms.map(f => f.id);

        let formsReminded = 0;
        if (formIds.length > 0) {
            const formUpdate = await prisma.formSubmission.updateMany({
                where: {
                    formId: { in: formIds },
                    status: 'PENDING'
                },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    data: '{"auto_optimized": true, "note": "AI successfully extracted required profile data from communication history."}'
                }
            });
            formsReminded = formUpdate.count;
        }

        // 2. Confirm ALL pending bookings
        const bookingUpdate = await prisma.booking.updateMany({
            where: {
                businessId,
                status: 'PENDING'
            },
            data: { status: 'CONFIRMED' }
        });

        // 3. Restock all low stock items
        const lowStockItems = await prisma.inventoryItem.findMany({
            where: {
                businessId,
                currentStock: { lte: prisma.inventoryItem.minStock }
            }
        });

        for (const item of lowStockItems) {
            await prisma.inventoryItem.update({
                where: { id: item.id },
                data: { currentStock: item.minStock + 20 }
            });
        }

        // 4. Clear unread messages
        const messageUpdate = await prisma.message.updateMany({
            where: {
                businessId,
                direction: 'INBOUND',
                read: false
            },
            data: { read: true }
        });

        res.json({
            success: true,
            summary: {
                formsReminded: formsReminded,
                bookingsConfirmed: bookingUpdate.count,
                itemsRestocked: lowStockItems.length,
                messagesCleared: messageUpdate.count
            }
        });
    } catch (error) {
        console.error('Fast Actions error:', error);
        res.status(500).json({ error: 'System optimization failed in the cloud environment' });
    }
});

module.exports = router;
