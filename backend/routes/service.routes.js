const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get all services for a business
router.get('/', verifyToken, async (req, res) => {
    try {
        const businessId = req.businessId;
        const services = await prisma.service.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// 2. Create a new service (Content Creation)
router.post('/', verifyToken, async (req, res) => {
    try {
        const businessId = req.businessId;
        const { name, description, duration, price } = req.body;

        const service = await prisma.service.create({
            data: {
                businessId,
                name,
                description,
                duration: parseInt(duration),
                price: parseFloat(price),
                isActive: true
            }
        });

        res.json(service);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// 3. Update a service
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, duration, price, isActive } = req.body;
        const businessId = req.businessId;

        const service = await prisma.service.update({
            where: { id, businessId },
            data: {
                name,
                description,
                duration: duration ? parseInt(duration) : undefined,
                price: price ? parseFloat(price) : undefined,
                isActive
            }
        });

        res.json(service);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update service' });
    }
});

module.exports = router;
