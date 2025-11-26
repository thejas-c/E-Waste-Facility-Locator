const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const aiClient = require('../config/aiClient');

// Create new pickup request (requires authentication)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { device_id, address } = req.body;
        const user_id = req.user.user_id;

        if (!device_id || !address) {
            return res.status(400).json({
                error: 'Device ID and address are required'
            });
        }

        // Verify device exists
        const [devices] = await db.execute(
            'SELECT device_id, model_name FROM devices WHERE device_id = ?',
            [device_id]
        );

        if (devices.length === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Detect district with AI
        const district = await extractDistrictAI(address, aiClient);

        // Calculate auto pickup date/time
        const schedule = await calculatePickupSchedule(district, db);

        // Insert into DB
        const [result] = await db.execute(`
            INSERT INTO pickup_requests 
            (user_id, device_id, address, scheduled_date, scheduled_time, status, tracking_note)
            VALUES (?, ?, ?, ?, ?, 'pending', ?)
        `, [
            user_id,
            device_id,
            address,
            schedule.pickup_date,
            schedule.pickup_time,
            district
        ]);

        console.log(`📦 Pickup ${result.insertId} created — ${district}`);

        res.status(201).json({
            success: true,
            message: "Pickup request scheduled successfully",
            estimated_pickup: schedule
        });

    } catch (err) {
        console.error("Pickup creation error:", err);
        res.status(500).json({
            error: "Failed to schedule pickup",
            message: err.message
        });
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

async function extractDistrictAI(address, aiClient) {
    const prompt = `
Extract ONLY the city or district name from this address.
Return ONLY JSON exactly like this:
{"district": "<name>"}

Address:
${address}
`;

    try {
        const response = await aiClient.models.generateContent({
            model: process.env.GEMINI_TEXT_MODEL || "gemini-1.5-flash",
            contents: [{ parts: [{ text: prompt }] }]
        });

        const text = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = JSON.parse(text);

        if (parsed.district && parsed.district.trim() !== "") {
            return parsed.district.trim();
        }

    } catch (err) {
        console.log("AI district extraction failed:", err);
    }

    // fallback — pick last part
    const parts = address.split(",");
    const fallback = parts[parts.length - 2] || parts[parts.length - 1];

    return fallback.trim();
}

async function calculatePickupSchedule(district, db) {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    const before3pm = hour < 15;

    let pickupDate = new Date();

    // If after 3 PM → schedule tomorrow
    if (!before3pm) {
        pickupDate.setDate(pickupDate.getDate() + 1);
    }

    while (true) {
        const y = pickupDate.getFullYear();
        const m = String(pickupDate.getMonth() + 1).padStart(2, '0');
        const d = String(pickupDate.getDate()).padStart(2, '0');

        const dateString = `${y}-${m}-${d}`;
        const todayString = new Date().toISOString().slice(0, 10);

        // Find pickups already assigned for this district on this date
        const [rows] = await db.execute(
            "SELECT COUNT(*) AS count FROM pickup_requests WHERE tracking_note = ? AND scheduled_date = ?",
            [district, dateString]
        );

        const already = rows[0].count;

        // If day has slot
        if (already < 5) {
            let estimatedHour = 9 + already;
            let estimatedMinute = "00";

            // If scheduling for today AND time already passed
            if (dateString === todayString && before3pm) {
                if (estimatedHour < hour || (estimatedHour === hour && estimatedMinute <= minute)) {
                    estimatedHour = hour + 1; // push forward 1 hour
                    estimatedMinute = String(minute).padStart(2, '0');
                }
            }

            return {
                pickup_date: dateString,
                pickup_time: `${estimatedHour}:${estimatedMinute}`,
                position_in_queue: already + 1
            };
        }

        // Day full → next day
        pickupDate.setDate(pickupDate.getDate() + 1);
    }
}

module.exports = router;