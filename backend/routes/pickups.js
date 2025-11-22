const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Create new pickup request (requires authentication)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { device_id, address, scheduled_date, scheduled_time } = req.body;
        const user_id = req.user.user_id;

        if (!device_id || !address || !scheduled_date || !scheduled_time) {
            return res.status(400).json({ 
                error: 'Device ID, address, scheduled date, and time are required' 
            });
        }

        // Validate scheduled date is not in the past
        const scheduledDate = new Date(scheduled_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (scheduledDate < today) {
            return res.status(400).json({ 
                error: 'Scheduled date cannot be in the past' 
            });
        }

        // Verify device exists
        const [devices] = await db.execute(
            'SELECT device_id, model_name, credits_value FROM devices WHERE device_id = ?',
            [device_id]
        );

        if (devices.length === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Create pickup request
        const [result] = await db.execute(`
            INSERT INTO pickup_requests (user_id, device_id, address, scheduled_date, scheduled_time, tracking_note)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [user_id, device_id, address, scheduled_date, scheduled_time, 'Pickup request received, awaiting processing']);

        console.log(`📦 New pickup request created: ID ${result.insertId} for user ${req.user.name}`);

        res.status(201).json({
            success: true,
            message: 'Pickup request submitted successfully',
            pickup: {
                pickup_id: result.insertId,
                device_name: devices[0].model_name,
                address: address,
                scheduled_date: scheduled_date,
                scheduled_time: scheduled_time,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Create pickup request error:', error);
        res.status(500).json({ error: 'Failed to create pickup request', message: error.message });
    }
});

// Get pickup requests for a specific user
router.get('/:userId', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Users can only access their own pickup requests, admins can access any
        if (req.user.user_id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied to pickup requests' });
        }

        const [pickups] = await db.execute(`
            SELECT p.pickup_id, p.address, p.scheduled_date, p.scheduled_time,
                   p.status, p.tracking_note, p.created_at, p.updated_at,
                   d.model_name as device_name, d.category, d.credits_value
            FROM pickup_requests p
            JOIN devices d ON p.device_id = d.device_id
            WHERE p.user_id = ?
            ORDER BY p.updated_at DESC, p.created_at DESC
        `, [userId]);

        res.json({
            success: true,
            pickups
        });
    } catch (error) {
        console.error('Get user pickup requests error:', error);
        res.status(500).json({ error: 'Failed to fetch pickup requests', message: error.message });
    }
});

// Get single pickup request by ID
router.get('/single/:id', verifyToken, async (req, res) => {
    try {
        const pickupId = req.params.id;
        
        const [pickups] = await db.execute(`
            SELECT p.pickup_id, p.user_id, p.address, p.scheduled_date, p.scheduled_time,
                   p.status, p.tracking_note, p.created_at, p.updated_at,
                   d.model_name as device_name, d.category, d.credits_value,
                   u.name as user_name
            FROM pickup_requests p
            JOIN devices d ON p.device_id = d.device_id
            JOIN users u ON p.user_id = u.user_id
            WHERE p.pickup_id = ?
        `, [pickupId]);

        if (pickups.length === 0) {
            return res.status(404).json({ error: 'Pickup request not found' });
        }

        const pickup = pickups[0];
        
        // Users can only access their own pickup requests, admins can access any
        if (req.user.user_id !== pickup.user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied to this pickup request' });
        }

        res.json({
            success: true,
            pickup
        });
    } catch (error) {
        console.error('Get pickup request error:', error);
        res.status(500).json({ error: 'Failed to fetch pickup request', message: error.message });
    }
});

// Cancel a pending pickup request
router.put('/:id/cancel', verifyToken, async (req, res) => {
    try {
        const pickupId = req.params.id;
        const userId = req.user.user_id;

        // Check if pickup exists and belongs to user
        const [pickups] = await db.execute(
            'SELECT user_id, status FROM pickup_requests WHERE pickup_id = ?',
            [pickupId]
        );

        if (pickups.length === 0) {
            return res.status(404).json({ error: 'Pickup request not found' });
        }

        if (pickups[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only cancel your own pickup requests' });
        }

        if (pickups[0].status !== 'pending') {
            return res.status(400).json({ 
                error: 'Only pending pickup requests can be cancelled' 
            });
        }

        // Update status to cancelled
        const [result] = await db.execute(`
            UPDATE pickup_requests
            SET status = 'cancelled', tracking_note = 'Cancelled by user', updated_at = CURRENT_TIMESTAMP
            WHERE pickup_id = ?
        `, [pickupId]);

        // Broadcast real-time update to user
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${userId}`).emit('pickup:update', {
                pickup_id: pickupId,
                status: 'cancelled',
                tracking_note: 'Cancelled by user',
                updated_at: new Date().toISOString()
            });
        }

        console.log(`❌ Pickup request ${pickupId} cancelled by user ${req.user.name}`);

        res.json({
            success: true,
            message: 'Pickup request cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel pickup request error:', error);
        res.status(500).json({ error: 'Failed to cancel pickup request', message: error.message });
    }
});

module.exports = router;