const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generic Webhook Receiver for external integrations (e.g., Stripe, Twilio Status, etc.)
router.post('/receiver', async (req, res) => {
    try {
        const payload = req.body;
        const source = req.headers['x-webhook-source'] || 'unknown';

        console.log(`[Webhook] Received data from ${source}`);

        // Simple logic for Demo: Log webhook events to business inbox if they are critical
        if (payload.type === 'CRITICAL_ALERT') {
            const business = await prisma.business.findFirst(); // For demo, use first business
            if (business) {
                const conversation = await prisma.conversation.upsert({
                    where: { id: 'webhook-system-convo' },
                    update: { lastMessageAt: new Date() },
                    create: {
                        id: 'webhook-system-convo',
                        businessId: business.id,
                        contactName: 'External Webhook System',
                        contactEmail: 'webhooks@opsflow.ai'
                    }
                });

                await prisma.message.create({
                    data: {
                        businessId: business.id,
                        conversationId: conversation.id,
                        direction: 'INBOUND',
                        channel: 'WEBHOOK',
                        body: `External Alert Received: ${payload.message || 'Generic Message'}`,
                        read: false
                    }
                });
            }
        }

        res.status(200).json({ status: 'received', timestamp: new Date() });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

module.exports = router;
