const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get user's recycling history
router.get('/user/:userId', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Users can only access their own history, admins can access any
        if (req.user.user_id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied to recycling history' });
        }

        const [history] = await db.execute(`
            SELECT h.history_id, h.credits_earned, h.recycled_at,
                   d.model_name, d.category,
                   f.name as facility_name, f.address as facility_address
            FROM recycling_history h
            JOIN devices d ON h.device_id = d.device_id
            JOIN facilities f ON h.facility_id = f.facility_id
            WHERE h.user_id = ?
            ORDER BY h.recycled_at DESC
        `, [userId]);

        // Calculate total credits earned
        const totalCredits = history.reduce((sum, record) => sum + record.credits_earned, 0);

        res.json({
            success: true,
            recycling_history: history,
            summary: {
                total_devices_recycled: history.length,
                total_credits_earned: totalCredits
            }
        });
    } catch (error) {
        console.error('Get recycling history error:', error);
        res.status(500).json({ error: 'Failed to fetch recycling history', message: error.message });
    }
});

// Get current user's recycling history
router.get('/my-history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [history] = await db.execute(`
            SELECT h.history_id, h.credits_earned, h.recycled_at,
                   d.model_name, d.category,
                   f.name as facility_name, f.address as facility_address
            FROM recycling_history h
            JOIN devices d ON h.device_id = d.device_id
            JOIN facilities f ON h.facility_id = f.facility_id
            WHERE h.user_id = ?
            ORDER BY h.recycled_at DESC
        `, [userId]);

        const totalCredits = history.reduce((sum, record) => sum + record.credits_earned, 0);

        res.json({
            success: true,
            recycling_history: history,
            summary: {
                total_devices_recycled: history.length,
                total_credits_earned: totalCredits,
                current_credits: req.user.credits
            }
        });
    } catch (error) {
        console.error('Get my recycling history error:', error);
        res.status(500).json({ error: 'Failed to fetch your recycling history', message: error.message });
    }
});

// Get recycling statistics (admin only)
router.get('/stats', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Get total recycling stats
        const [totalStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_recycled_devices,
                SUM(credits_earned) as total_credits_issued,
                COUNT(DISTINCT user_id) as active_recyclers
            FROM recycling_history
        `);

        // Get monthly recycling trends
        const [monthlyStats] = await db.execute(`
            SELECT 
                DATE_FORMAT(recycled_at, '%Y-%m') as month,
                COUNT(*) as devices_recycled,
                SUM(credits_earned) as credits_earned
            FROM recycling_history
            WHERE recycled_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(recycled_at, '%Y-%m')
            ORDER BY month DESC
        `);

        // Get top recycling facilities
        const [topFacilities] = await db.execute(`
            SELECT 
                f.name,
                f.address,
                COUNT(h.history_id) as total_recycled
            FROM facilities f
            JOIN recycling_history h ON f.facility_id = h.facility_id
            GROUP BY f.facility_id
            ORDER BY total_recycled DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            statistics: {
                overview: totalStats[0],
                monthly_trends: monthlyStats,
                top_facilities: topFacilities
            }
        });
    } catch (error) {
        console.error('Get recycling statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics', message: error.message });
    }
});

module.exports = router;