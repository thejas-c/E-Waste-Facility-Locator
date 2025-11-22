const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all device types
router.get('/', async (req, res) => {
    try {
        const [devices] = await db.execute(`
            SELECT device_id, model_name, category, gold, copper, silver, credits_value 
            FROM devices 
            ORDER BY category ASC, model_name ASC
        `);

        res.json({
            success: true,
            devices
        });
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ error: 'Failed to fetch devices', message: error.message });
    }
});

// Estimate credits for a device
router.post('/estimate', async (req, res) => {
    try {
        const { model_name, quantity = 1 } = req.body;

        if (!model_name) {
            return res.status(400).json({ error: 'Device model name is required' });
        }

        // Search for exact match first, then partial match
        let [devices] = await db.execute(
            'SELECT * FROM devices WHERE model_name = ? LIMIT 1',
            [model_name]
        );

        if (devices.length === 0) {
            // Try partial match
            [devices] = await db.execute(
                'SELECT * FROM devices WHERE model_name LIKE ? LIMIT 1',
                [`%${model_name}%`]
            );
        }

        if (devices.length === 0) {
            return res.status(404).json({ 
                error: 'Device not found in our database',
                suggestion: 'Try searching with a different model name or contact support'
            });
        }

        const device = devices[0];
        const totalCredits = device.credits_value * quantity;

        res.json({
            success: true,
            estimate: {
                device_id: device.device_id,
                model_name: device.model_name,
                category: device.category,
                quantity: parseInt(quantity),
                credits_per_unit: device.credits_value,
                total_credits: totalCredits,
                materials: {
                    gold: device.gold * quantity,
                    copper: device.copper * quantity,
                    silver: device.silver * quantity
                }
            }
        });
    } catch (error) {
        console.error('Device estimate error:', error);
        res.status(500).json({ error: 'Failed to estimate device credits', message: error.message });
    }
});

// Submit device for recycling (requires authentication)
router.post('/recycle', verifyToken, async (req, res) => {
    try {
        const { device_id, facility_id, quantity = 1 } = req.body;
        const user_id = req.user.user_id;

        if (!device_id || !facility_id) {
            return res.status(400).json({ error: 'Device ID and Facility ID are required' });
        }

        // Get device credits value
        const [devices] = await db.execute(
            'SELECT credits_value, model_name FROM devices WHERE device_id = ?',
            [device_id]
        );

        if (devices.length === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Verify facility exists
        const [facilities] = await db.execute(
            'SELECT name FROM facilities WHERE facility_id = ?',
            [facility_id]
        );

        if (facilities.length === 0) {
            return res.status(404).json({ error: 'Facility not found' });
        }

        // Create recycling request instead of directly processing
        const [result] = await db.execute(`
            INSERT INTO recycling_requests (user_id, device_id, facility_id, status)
            VALUES (?, ?, ?, 'pending')
        `, [user_id, device_id, facility_id]);

        res.json({
            success: true,
            message: 'Recycling request submitted successfully! It will be reviewed by an admin.',
            request: {
                request_id: result.insertId,
                device_name: devices[0].model_name,
                facility_name: facilities[0].name,
                status: 'pending',
                estimated_credits: devices[0].credits_value * quantity
            }
        });
    } catch (error) {
        console.error('Device recycle request error:', error);
        res.status(500).json({ error: 'Failed to submit recycling request', message: error.message });
    }
});

// Search devices
router.get('/search', async (req, res) => {
    try {
        const { q, category } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        let query = `
            SELECT device_id, model_name, category, credits_value 
            FROM devices 
            WHERE model_name LIKE ?
        `;
        let params = [`%${q}%`];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY model_name ASC LIMIT 20';

        const [devices] = await db.execute(query, params);

        res.json({
            success: true,
            devices,
            search_query: q,
            category: category || 'all'
        });
    } catch (error) {
        console.error('Device search error:', error);
        res.status(500).json({ error: 'Device search failed', message: error.message });
    }
});

module.exports = router;