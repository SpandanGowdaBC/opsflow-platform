const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get all bookings for the business
router.get('/', verifyToken, async (req, res) => {
    try {
        const businessId = req.businessId;
        const { status, timeframe } = req.query;

        let where = { businessId };

        if (status) {
            where.status = status;
        }

        if (timeframe === 'upcoming') {
            const now = new Date();
            now.setHours(now.getHours() - 1); // 1-hour grace period so "just started" bookings stay visible
            where.startTime = { gte: now };
        } else if (timeframe === 'past') {
            const now = new Date();
            now.setHours(now.getHours() - 1);
            where.startTime = { lt: now };
        } else if (timeframe === 'today') { // New timeframe for today's bookings
            // Using a wider window to handle timezone offsets and ensure new bookings are immediately visible
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            todayStart.setDate(todayStart.getDate() - 1); // Expand to include yesterday's tail
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            todayEnd.setDate(todayEnd.getDate() + 1); // Expand to include tomorrow's start

            where.startTime = {
                gte: todayStart,
                lte: todayEnd
            };
        }

        const bookings = await prisma.booking.findMany({
            where,
            include: {
                service: { select: { name: true, price: true, duration: true } },
                assignedTo: { select: { firstName: true, lastName: true } }
            },
            orderBy: { startTime: timeframe === 'past' ? 'desc' : 'asc' }
        });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// 2. Mark booking status (Completed, No-Show, Cancelled)
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const businessId = req.businessId;

        // Validation
        const validStatuses = ['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const booking = await prisma.booking.update({
            where: { id, businessId },
            data: { status }
        });

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update booking status' });
    }
});

// 3. Assign booking to staff
router.patch('/:id/assign', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { staffId } = req.body;
        const businessId = req.businessId;

        const booking = await prisma.booking.update({
            where: { id, businessId },
            data: { assignedToId: staffId }
        });

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to assign booking' });
    }
});

module.exports = router;
