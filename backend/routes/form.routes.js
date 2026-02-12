const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get all form submissions for the business
router.get('/submissions', verifyToken, async (req, res) => {
    try {
        const businessId = req.businessId;
        const { status } = req.query;

        let where = { form: { businessId } };
        if (status) {
            where.status = status;
        }

        const submissions = await prisma.formSubmission.findMany({
            where,
            include: {
                form: { select: { name: true } },
                booking: { select: { id: true, startTime: true, customerName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// 2. Get specific submission data
router.get('/submissions/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.businessId;

        const submission = await prisma.formSubmission.findUnique({
            where: { id },
            include: {
                form: { select: { name: true, fields: true } },
                booking: true
            }
        });

        if (!submission || submission.form.businessId !== businessId) {
            // Error handling for cross-business access
        }

        res.json(submission);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;
