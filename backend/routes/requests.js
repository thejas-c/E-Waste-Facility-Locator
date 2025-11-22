const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Submit new recycling request (requires authentication)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { device_id, year_of_purchase } = req.body;
        const user_id = req.user.user_id;

        if (!device_id || !year_of_purchase) {
            return res.status(400).json({ error: 'Device ID and year of purchase are required' });
        }

        // Validate year of purchase
        const currentYear = new Date().getFullYear();
        if (year_of_purchase < 2000 || year_of_purchase > currentYear) {
            return res.status(400).json({ error: 'Invalid year of purchase' });
        }

        // Verify device exists
        const [devices] = await db.execute(
            'SELECT device_id, model_name, credits_value FROM devices WHERE device_id = ?',
            [device_id]
        );

        if (devices.length === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Create recycling request
        const [result] = await db.execute(`
            INSERT INTO recycling_requests (user_id, device_id, year_of_purchase, status)
            VALUES (?, ?, ?, 'pending')
        `, [user_id, device_id, year_of_purchase]);

        res.status(201).json({
            success: true,
            message: 'Recycling request submitted successfully',
            request: {
                request_id: result.insertId,
                device_name: devices[0].model_name,
                year_of_purchase: year_of_purchase,
                status: 'pending',
                estimated_credits: devices[0].credits_value
            }
        });
    } catch (error) {
        console.error('Submit recycling request error:', error);
        res.status(500).json({ error: 'Failed to submit recycling request', message: error.message });
    }
});

// Get current user's recycling requests
router.get('/my-requests', verifyToken, async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const [requests] = await db.execute(`
            SELECT r.request_id, r.year_of_purchase, r.status, r.submitted_at,
                   d.model_name as device_name, d.category, d.credits_value
            FROM recycling_requests r
            JOIN devices d ON r.device_id = d.device_id
            WHERE r.user_id = ?
            ORDER BY r.submitted_at DESC
        `, [user_id]);

        res.json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Get user requests error:', error);
        res.status(500).json({ error: 'Failed to fetch your requests', message: error.message });
    }
});

module.exports = router;