const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function seedNewBusiness() {
    try {
        console.log("🚀 Creating initial business and owner for cloud deployment...");

        const hashed = await bcrypt.hash('password123', 10);

        // 1. Create Business (Using the correct @unique email field)
        const business = await prisma.business.create({
            data: {
                name: "ZenCare Wellness & Recovery",
                email: "contact@zencare.com",
                industry: "Healthcare",
                onboardingComplete: true
            }
        });

        // 2. Create Owner
        await prisma.user.create({
            data: {
                email: "admin@zencare.com",
                password: hashed,
                firstName: "Spandan",
                lastName: "Gowda",
                role: "OWNER",
                businessId: business.id
            }
        });

        console.log(`✅ Default account created!`);
        console.log(`📧 Email: admin@zencare.com`);
        console.log(`🔑 Password: password123`);

    } catch (error) {
        console.error('❌ SEEDING FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedNewBusiness();
