const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get all leads for the business
router.get('/', verifyToken, async (req, res) => {
    try {
        const businessId = req.businessId;
        const { status } = req.query;

        let where = { businessId };
        if (status) {
            where.status = status;
        }

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignedTo: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// 2. Update lead status
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const businessId = req.businessId;

        const lead = await prisma.lead.update({
            where: { id, businessId },
            data: { status }
        });

        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update lead status' });
    }
});

module.exports = router;
