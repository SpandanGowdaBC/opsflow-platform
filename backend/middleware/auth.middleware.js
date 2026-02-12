const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                business: true
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid token or user inactive' });
        }

        // Attach user and business to request
        req.user = user;
        req.businessId = user.businessId;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Check if user is owner
const requireOwner = (req, res, next) => {
    if (req.user.role !== 'OWNER') {
        return res.status(403).json({ error: 'Owner access required' });
    }
    next();
};

// Check if user is owner or staff
const requireAuthenticated = verifyToken;

module.exports = {
    verifyToken,
    requireOwner,
    requireAuthenticated
};
