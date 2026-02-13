const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get all conversations (The Inbox List)
router.get('/conversations', verifyToken, async (req, res) => {
    try {
        const businessId = req.businessId;

        const conversations = await prisma.conversation.findMany({
            where: { businessId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });

        res.json(conversations);
    } catch (error) {
        console.error('Fetch conversations error:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// 2. Get messages for a specific conversation
router.get('/conversations/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.businessId;

        // Mark as read when opening
        await prisma.message.updateMany({
            where: {
                conversationId: id,
                businessId,
                direction: 'INBOUND',
                read: false
            },
            data: { read: true }
        });

        const messages = await prisma.message.findMany({
            where: {
                conversationId: id,
                businessId
            },
            orderBy: { createdAt: 'asc' },
            include: {
                sentBy: {
                    select: { firstName: true, lastName: true }
                }
            }
        });

        res.json(messages);
    } catch (error) {
        console.error('Fetch messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// 3. Send Message (Staff Reply)
router.post('/reply', verifyToken, async (req, res) => {
    try {
        const { conversationId, body, channel = 'EMAIL' } = req.body;
        const businessId = req.businessId;
        const userId = req.user.id;

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation || conversation.businessId !== businessId) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // 1. Create the message
        const message = await prisma.message.create({
            data: {
                businessId,
                conversationId,
                sentById: userId,
                body,
                channel,
                direction: 'OUTBOUND',
                sent: true,
                recipientEmail: conversation.contactEmail,
                recipientPhone: conversation.contactPhone,
                recipientName: conversation.contactName
            }
        });

        // 2. Update conversation status & PAUSE AUTOMATION
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: new Date(),
                isAutomationPaused: true // Staff replied, automation stops
            }
        });

        // TODO: Actually trigger external API (SendGrid/Twilio) here

        res.json(message);
    } catch (error) {
        console.error('Send reply error:', error);
        res.status(500).json({ error: 'Failed to send reply' });
    }
});

// 4. Toggle Automation Pause manually
router.post('/conversations/:id/toggle-automation', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { paused } = req.body;
        const businessId = req.businessId;

        const updated = await prisma.conversation.update({
            where: { id, businessId },
            data: { isAutomationPaused: paused }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle automation' });
    }
});

// 5. Get or Create Conversation (Deep Link from Lead/Booking)
router.post('/find-or-create', verifyToken, async (req, res) => {
    try {
        const { email, name, phone } = req.body;
        const businessId = req.businessId;

        if (!email) {
            return res.status(400).json({ error: 'Email is required to link conversation' });
        }

        // 1. Try to find existing
        let conversation = await prisma.conversation.findFirst({
            where: {
                businessId,
                contactEmail: email
            }
        });

        // 2. Create if not exists
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    businessId,
                    contactEmail: email,
                    contactName: name,
                    contactPhone: phone,
                    lastMessageAt: new Date()
                }
            });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Find or create conversation error:', error);
        res.status(500).json({ error: 'System communication failure' });
    }
});

// Generate AI Draft Reply
const aiService = require('../services/ai.service');
router.post('/conversations/:id/ai-draft', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { prompt } = req.body;

        const lastMessage = await prisma.message.findFirst({
            where: { conversationId: id, direction: 'INBOUND' },
            orderBy: { createdAt: 'desc' }
        });

        if (!lastMessage && !prompt) {
            return res.json({ draft: "Hi! How can I help you today?" });
        }

        const draft = await aiService.generateDraftReply([], lastMessage?.body || 'New Conversation', prompt);
        res.json({ draft });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate AI draft' });
    }
});

module.exports = router;
