const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const [users] = await db.execute(
            'SELECT user_id, name, email, role, credits FROM users WHERE user_id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid token. User not found.' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

module.exports = { verifyToken, adminOnly };