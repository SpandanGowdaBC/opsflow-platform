const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const automationService = require('../services/automation.service');

// 1. Get Inventory
router.get('/', verifyToken, async (req, res) => {
    try {
        const businessId = req.businessId;
        const inventory = await prisma.inventoryItem.findMany({
            where: { businessId },
            orderBy: { currentStock: 'asc' }
        });
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// 2. Add New Item
router.post('/', verifyToken, async (req, res) => {
    try {
        const businessId = req.businessId;
        const { name, minStock, currentStock, unit, vendorName, vendorEmail } = req.body;

        const item = await prisma.inventoryItem.create({
            data: {
                businessId,
                name,
                minStock: parseInt(minStock),
                currentStock: parseInt(currentStock),
                unit,
                vendorName,
                vendorEmail
            }
        });

        // Check if created with low stock
        if (item.currentStock <= item.minStock) {
            await automationService.handleLowStock(item);
        }

        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// 3. Update Stock (The main trigger for alerts)
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { change } = req.body; // +5 or -2
        const businessId = req.businessId;

        const item = await prisma.inventoryItem.findUnique({ where: { id, businessId } });
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const newStock = item.currentStock + parseInt(change);

        const updatedItem = await prisma.inventoryItem.update({
            where: { id },
            data: { currentStock: newStock }
        });

        // Trigger Alert Logic
        // Check if now low (regardless of previous state, but throttled by service)
        if (updatedItem.currentStock <= updatedItem.minStock) {
            await automationService.handleLowStock(updatedItem);
        }

        res.json(updatedItem);
    } catch (error) {
        console.error('Inventory update error:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

module.exports = router;
