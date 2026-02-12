const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

// Get all users (staff)
router.get('/', verifyToken, async (req, res) => {
    res.json({ message: 'Users endpoint - coming soon' });
});

module.exports = router;
