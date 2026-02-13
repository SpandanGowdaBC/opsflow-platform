const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDemoData() {
    try {
        console.log("🎯 Seeding demo data for OpsFlow...");

        // Get the business
        const business = await prisma.business.findFirst();
        if (!business) {
            console.log("❌ No business found. Run seed_cloud_init.js first!");
            return;
        }

        console.log(`✅ Found business: ${business.name}`);

        // Create Leads
        const leads = await prisma.lead.createMany({
            data: [
                {
                    firstName: "Sarah",
                    lastName: "Johnson",
                    email: "sarah.j@email.com",
                    phone: "+1-555-0101",
                    source: "Website",
                    status: "NEW",
                    businessId: business.id
                },
                {
                    firstName: "Michael",
                    lastName: "Chen",
                    email: "m.chen@email.com",
                    phone: "+1-555-0102",
                    source: "Referral",
                    status: "CONTACTED",
                    businessId: business.id
                },
                {
                    firstName: "Emily",
                    lastName: "Rodriguez",
                    email: "emily.r@email.com",
                    phone: "+1-555-0103",
                    source: "Social Media",
                    status: "QUALIFIED",
                    businessId: business.id
                },
                {
                    firstName: "David",
                    lastName: "Kim",
                    email: "david.kim@email.com",
                    phone: "+1-555-0104",
                    source: "Google Ads",
                    status: "NEW",
                    businessId: business.id
                },
                {
                    firstName: "Jessica",
                    lastName: "Martinez",
                    email: "j.martinez@email.com",
                    phone: "+1-555-0105",
                    source: "Walk-in",
                    status: "CONVERTED",
                    businessId: business.id
                }
            ]
        });

        console.log(`✅ Created ${leads.count} leads`);

        // Create Bookings
        const now = new Date();
        const bookings = await prisma.booking.createMany({
            data: [
                {
                    customerName: "Sarah Johnson",
                    customerEmail: "sarah.j@email.com",
                    customerPhone: "+1-555-0101",
                    service: "Wellness Consultation",
                    date: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
                    time: "10:00 AM",
                    status: "CONFIRMED",
                    businessId: business.id
                },
                {
                    customerName: "Michael Chen",
                    customerEmail: "m.chen@email.com",
                    customerPhone: "+1-555-0102",
                    service: "Recovery Session",
                    date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
                    time: "2:00 PM",
                    status: "CONFIRMED",
                    businessId: business.id
                },
                {
                    customerName: "Emily Rodriguez",
                    customerEmail: "emily.r@email.com",
                    customerPhone: "+1-555-0103",
                    service: "Therapy Session",
                    date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
                    time: "11:00 AM",
                    status: "PENDING",
                    businessId: business.id
                },
                {
                    customerName: "David Kim",
                    customerEmail: "david.kim@email.com",
                    customerPhone: "+1-555-0104",
                    service: "Wellness Consultation",
                    date: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
                    time: "9:00 AM",
                    status: "COMPLETED",
                    businessId: business.id
                }
            ]
        });

        console.log(`✅ Created ${bookings.count} bookings`);

        // Create Inventory Items
        const inventory = await prisma.inventory.createMany({
            data: [
                {
                    name: "Wellness Kit",
                    category: "Supplies",
                    quantity: 45,
                    unit: "units",
                    reorderLevel: 20,
                    businessId: business.id
                },
                {
                    name: "Recovery Bands",
                    category: "Equipment",
                    quantity: 12,
                    unit: "sets",
                    reorderLevel: 10,
                    businessId: business.id
                },
                {
                    name: "Therapy Mats",
                    category: "Equipment",
                    quantity: 8,
                    unit: "units",
                    reorderLevel: 5,
                    businessId: business.id
                },
                {
                    name: "Sanitizer Bottles",
                    category: "Supplies",
                    quantity: 67,
                    unit: "bottles",
                    reorderLevel: 30,
                    businessId: business.id
                },
                {
                    name: "Towels",
                    category: "Supplies",
                    quantity: 3,
                    unit: "sets",
                    reorderLevel: 15,
                    businessId: business.id
                }
            ]
        });

        console.log(`✅ Created ${inventory.count} inventory items`);

        // Create Tasks
        const tasks = await prisma.task.createMany({
            data: [
                {
                    title: "Follow up with Sarah Johnson",
                    description: "Discuss wellness program options",
                    priority: "HIGH",
                    status: "PENDING",
                    dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                    businessId: business.id
                },
                {
                    title: "Restock Recovery Bands",
                    description: "Order from supplier - running low",
                    priority: "MEDIUM",
                    status: "PENDING",
                    dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
                    businessId: business.id
                },
                {
                    title: "Prepare monthly report",
                    description: "Compile analytics and insights",
                    priority: "LOW",
                    status: "IN_PROGRESS",
                    dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                    businessId: business.id
                },
                {
                    title: "Update website content",
                    description: "Add new service offerings",
                    priority: "MEDIUM",
                    status: "PENDING",
                    dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
                    businessId: business.id
                }
            ]
        });

        console.log(`✅ Created ${tasks.count} tasks`);

        console.log("\n🎉 Demo data seeding complete!");
        console.log("📊 Summary:");
        console.log(`   - ${leads.count} leads`);
        console.log(`   - ${bookings.count} bookings`);
        console.log(`   - ${inventory.count} inventory items`);
        console.log(`   - ${tasks.count} tasks`);

    } catch (error) {
        console.error('❌ SEEDING FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedDemoData();
