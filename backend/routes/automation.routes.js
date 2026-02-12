const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

// Get automations
router.get('/', verifyToken, async (req, res) => {
    res.json({ message: 'Automations endpoint - coming soon' });
});

module.exports = router;
