const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Register new business (creates owner account + business)
router.post('/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('firstName').trim().notEmpty(),
        body('lastName').trim().notEmpty(),
        body('businessName').trim().notEmpty()
    ],
    async (req, res) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, firstName, lastName, businessName, industry } = req.body;

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create business and owner in a transaction
            const result = await prisma.$transaction(async (tx) => {
                // Create business
                const business = await tx.business.create({
                    data: {
                        name: businessName,
                        industry: industry || null,
                        email: email,
                        onboardingComplete: false
                    }
                });

                // Create owner user
                const user = await tx.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        firstName,
                        lastName,
                        role: 'OWNER',
                        businessId: business.id,
                        isActive: true
                    }
                });

                return { user, business };
            });

            // Generate token
            const token = generateToken(result.user.id);

            // Return user and token (exclude password)
            const { password: _, ...userWithoutPassword } = result.user;

            res.status(201).json({
                message: 'Registration successful',
                token,
                user: userWithoutPassword,
                business: result.business
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

// Login
router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req, res) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Find user
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    business: true
                }
            });

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({ error: 'Account is inactive' });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() }
            });

            // Generate token
            const token = generateToken(user.id);

            // Return user and token (exclude password)
            const { password: _, ...userWithoutPassword } = user;

            res.json({
                message: 'Login successful',
                token,
                user: userWithoutPassword,
                business: user.business
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

// Get current user (requires authentication)
router.get('/me', async (req, res) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                business: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return user (exclude password)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            user: userWithoutPassword,
            business: user.business
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
