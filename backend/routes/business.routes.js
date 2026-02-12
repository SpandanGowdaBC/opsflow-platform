const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireOwner } = require('../middleware/auth.middleware');
const prisma = new PrismaClient();

// Get business details
router.get('/', verifyToken, async (req, res) => {
    try {
        const business = await prisma.business.findUnique({
            where: { id: req.businessId },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        permissions: true,
                        isActive: true,
                        lastLoginAt: true
                    }
                },
                services: true,
                _count: {
                    select: {
                        leads: true,
                        bookings: true,
                        forms: true,
                        inventoryItems: true
                    }
                }
            }
        });

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        res.json(business);
    } catch (error) {
        console.error('Get business error:', error);
        res.status(500).json({ error: 'Failed to fetch business details' });
    }
});

// Update business profile (Owner only)
router.put('/profile', verifyToken, requireOwner,
    [
        body('name').optional().trim().notEmpty(),
        body('industry').optional(),
        body('phone').optional(),
        body('timezone').optional()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, industry, phone, timezone, operatingHours, email, emailConfig, smsConfig, onboardingComplete } = req.body;

            const business = await prisma.business.update({
                where: { id: req.businessId },
                data: {
                    ...(name && { name }),
                    ...(industry && { industry }),
                    ...(phone && { phone }),
                    ...(timezone && { timezone }),
                    ...(email && { email }),
                    ...(emailConfig !== undefined && { emailConfig }),
                    ...(smsConfig !== undefined && { smsConfig }),
                    ...(onboardingComplete !== undefined && { onboardingComplete }),
                    ...(operatingHours && { operatingHours })
                }
            });

            res.json({ message: 'Business profile updated', business });
        } catch (error) {
            console.error('Update business error:', error);
            res.status(500).json({ error: 'Failed to update business profile' });
        }
    }
);

// Complete onboarding (Owner only)
router.post('/onboarding/complete', verifyToken, requireOwner,
    [
        body('emailConfig').optional(),
        body('smsConfig').optional(),
        body('operatingHours').optional()
    ],
    async (req, res) => {
        try {
            const { emailConfig, smsConfig, whatsappConfig, operatingHours } = req.body;

            const business = await prisma.business.update({
                where: { id: req.businessId },
                data: {
                    onboardingComplete: true,
                    ...(emailConfig && { emailConfig }),
                    ...(smsConfig && { smsConfig }),
                    ...(whatsappConfig && { whatsappConfig }),
                    ...(operatingHours && { operatingHours })
                }
            });

            // Emit real-time event
            const io = req.app.get('io');
            io.to(`business-${req.businessId}`).emit('onboarding-completed', {
                businessId: req.businessId,
                timestamp: new Date()
            });

            res.json({
                message: 'Onboarding completed successfully',
                business
            });
        } catch (error) {
            console.error('Complete onboarding error:', error);
            res.status(500).json({ error: 'Failed to complete onboarding' });
        }
    }
);

// Check onboarding status
router.get('/onboarding/status', verifyToken, async (req, res) => {
    try {
        const business = await prisma.business.findUnique({
            where: { id: req.businessId },
            select: {
                onboardingComplete: true,
                emailConfig: true,
                smsConfig: true,
                whatsappConfig: true,
                operatingHours: true,
                _count: {
                    select: {
                        services: true,
                        users: true
                    }
                }
            }
        });

        const status = {
            complete: business.onboardingComplete,
            steps: {
                profile: true, // Always true after registration
                services: business._count.services > 0,
                communication: !!(business.emailConfig || business.smsConfig),
                staff: business._count.users > 1, // More than just owner
                hours: !!business.operatingHours
            }
        };

        res.json(status);
    } catch (error) {
        console.error('Check onboarding status error:', error);
        res.status(500).json({ error: 'Failed to check onboarding status' });
    }
});

// Invite staff member (Owner only)
router.post('/invite-staff', verifyToken, requireOwner,
    [
        body('email').isEmail().normalizeEmail(),
        body('firstName').trim().notEmpty(),
        body('lastName').trim().notEmpty()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, firstName, lastName } = req.body;

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Generate temporary password (in production, send invitation link instead)
            const tempPassword = Math.random().toString(36).slice(-10);
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            // Create staff user
            const staff = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role: 'STAFF',
                    businessId: req.businessId,
                    isActive: true
                }
            });

            // TODO: Send invitation email with temporary password
            // For demo purposes, we'll return it in the response
            const { password: _, ...staffWithoutPassword } = staff;

            res.status(201).json({
                message: 'Staff member invited successfully',
                staff: staffWithoutPassword,
                tempPassword // Only for demo - remove in production
            });

        } catch (error) {
            console.error('Invite staff error:', error);
            res.status(500).json({ error: 'Failed to invite staff member' });
        }
    }
);

// Update staff member details
router.patch('/staff/:id', verifyToken, requireOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, role, permissions } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                firstName,
                lastName,
                role,
                permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions)
            }
        });

        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ error: 'Failed to update staff member' });
    }
});

// Deactivate/Activate staff member
router.patch('/staff/:id/toggle-status', verifyToken, requireOwner, async (req, res) => {
    try {
        const { id } = req.params;

        // Don't allow deactivating self
        if (id === req.userId) {
            return res.status(400).json({ error: 'Cannot deactivate your own account' });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'Staff member not found' });

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive }
        });

        res.json({ message: `Staff member ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`, isActive: updatedUser.isActive });
    } catch (error) {
        console.error('Toggle staff status error:', error);
        res.status(500).json({ error: 'Failed to toggle staff status' });
    }
});

// Get public booking page URL
router.get('/booking-link', verifyToken, async (req, res) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const bookingUrl = `${frontendUrl}/book/${req.businessId}`;

        res.json({ bookingUrl });
    } catch (error) {
        console.error('Get booking link error:', error);
        res.status(500).json({ error: 'Failed to generate booking link' });
    }
});

module.exports = router;
