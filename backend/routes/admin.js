const express = require('express');
const db = require('../config/database');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(verifyToken);
router.use(adminOnly);

// Admin Recycling Requests Management
router.get('/recycling-requests', async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT r.request_id, r.year_of_purchase, r.status, r.submitted_at,
                   u.name as user_name, u.email as user_email,
                   d.model_name as device_name, d.category, d.credits_value
            FROM recycling_requests r
            JOIN users u ON r.user_id = u.user_id
            JOIN devices d ON r.device_id = d.device_id
        `;
        let params = [];

        if (status && status !== 'all') {
            query += ' WHERE r.status = ?';
            params.push(status);
        }

        query += ' ORDER BY r.submitted_at DESC';

        const [requests] = await db.execute(query, params);

        res.json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Admin get recycling requests error:', error);
        res.status(500).json({ error: 'Failed to fetch recycling requests', message: error.message });
    }
});

router.put('/recycling-requests/:id/approve', verifyToken, adminOnly, async (req, res) => {
  const requestId = req.params.id;
  let conn;

  try {
    // get dedicated connection from pool
    conn = await db.getConnection();

    // start transaction
    await conn.beginTransaction();

    // select request and lock the row
    const [rows] = await conn.execute(
      `SELECT r.request_id, r.user_id, r.device_id, d.credits_value
       FROM recycling_requests r
       JOIN devices d ON r.device_id = d.device_id
       WHERE r.request_id = ? AND r.status = 'pending' FOR UPDATE`,
      [requestId]
    );

    if (!rows || rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    const reqRow = rows[0];
    const creditsToAdd = Number(reqRow.credits_value) || 0;
    const userId = reqRow.user_id;

    // update request status
    await conn.execute(
      `UPDATE recycling_requests
       SET status = 'approved', processed_by = ?, processed_at = CURRENT_TIMESTAMP
       WHERE request_id = ?`,
      [req.user.user_id, requestId] // req.user is admin performing the action
    );

    // update user credits (safe if credits column is NULL)
    await conn.execute(
      `UPDATE users
       SET credits = COALESCE(credits,0) + ?
       WHERE user_id = ?`,
      [creditsToAdd, userId]
    );

    // commit
    await conn.commit();

    // Optionally emit socket update if io is available
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('recycling_request:approved', { request_id: requestId, user_id: userId, credits_awarded: creditsToAdd });
      }
    } catch (e) {
      console.warn('Socket emit failed', e);
    }

    return res.json({
      success: true,
      message: 'Request approved and credits awarded',
      credits_awarded: creditsToAdd
    });
  } catch (err) {
    console.error('Admin approve recycling request error:', err);
    try { if (conn) await conn.rollback(); } catch (_) {}
    return res.status(500).json({ error: 'Failed to approve request', message: err.message });
  } finally {
    try { if (conn) await conn.release(); } catch (e) {}
  }
});


router.put('/recycling-requests/:id/reject', async (req, res) => {
    try {
        const requestId = req.params.id;

        const [result] = await db.execute(`
            UPDATE recycling_requests 
            SET status = 'rejected'
            WHERE request_id = ? AND status = 'pending'
        `, [requestId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Request not found or already processed' });
        }

        res.json({
            success: true,
            message: 'Request rejected successfully'
        });
    } catch (error) {
        console.error('Admin reject recycling request error:', error);
        res.status(500).json({ error: 'Failed to reject request', message: error.message });
    }
});

// Admin Facilities Management
router.post('/facilities', async (req, res) => {
    try {
        const { name, address, latitude, longitude, contact, operating_hours, website } = req.body;

        if (!name || !address || !latitude || !longitude) {
            return res.status(400).json({ error: 'Name, address, latitude, and longitude are required' });
        }

        const [result] = await db.execute(`
            INSERT INTO facilities (name, address, latitude, longitude, contact, operating_hours, website)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, address, latitude, longitude, contact, operating_hours, website]);

        res.status(201).json({
            success: true,
            message: 'Facility created successfully',
            facility_id: result.insertId
        });
    } catch (error) {
        console.error('Admin create facility error:', error);
        res.status(500).json({ error: 'Failed to create facility', message: error.message });
    }
});

// Admin Recycling Requests Management
router.get('/requests', async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT r.request_id, r.status, r.submitted_at, r.processed_at,
                   u.name as user_name, u.email as user_email,
                   d.model_name as device_name, d.category, d.credits_value,
                   f.name as facility_name, f.address as facility_address,
                   admin.name as processed_by_name
            FROM recycling_requests r
            JOIN users u ON r.user_id = u.user_id
            JOIN devices d ON r.device_id = d.device_id
            JOIN facilities f ON r.facility_id = f.facility_id
            LEFT JOIN users admin ON r.processed_by = admin.user_id
        `;
        let params = [];

        if (status && status !== 'all') {
            query += ' WHERE r.status = ?';
            params.push(status);
        }

        query += ' ORDER BY r.submitted_at DESC';

        const [requests] = await db.execute(query, params);

        res.json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Admin get requests error:', error);
        res.status(500).json({ error: 'Failed to fetch requests', message: error.message });
    }
});

router.put('/requests/:id/approve', async (req, res) => {
    try {
        const requestId = req.params.id;
        const adminId = req.user.user_id;

        // Start transaction
        await db.execute('START TRANSACTION');

        try {
            // Get request details
            const [requests] = await db.execute(`
                SELECT r.user_id, r.device_id, r.facility_id, d.credits_value, d.model_name
                FROM recycling_requests r
                JOIN devices d ON r.device_id = d.device_id
                WHERE r.request_id = ? AND r.status = 'pending'
            `, [requestId]);

            if (requests.length === 0) {
                await db.execute('ROLLBACK');
                return res.status(404).json({ error: 'Request not found or already processed' });
            }

            const request = requests[0];

            // Update request status
            await db.execute(`
                UPDATE recycling_requests 
                SET status = 'approved', processed_at = NOW(), processed_by = ?
                WHERE request_id = ?
            `, [adminId, requestId]);

            // Add to recycling history
            await db.execute(`
                INSERT INTO recycling_history (user_id, device_id, facility_id, credits_earned)
                VALUES (?, ?, ?, ?)
            `, [request.user_id, request.device_id, request.facility_id, request.credits_value]);

            // Update user credits
            await db.execute(`
                UPDATE users SET credits = credits + ? WHERE user_id = ?
            `, [request.credits_value, request.user_id]);

            // Commit transaction
            await db.execute('COMMIT');

            res.json({
                success: true,
                message: 'Request approved successfully',
                credits_awarded: request.credits_value
            });
        } catch (transactionError) {
            await db.execute('ROLLBACK');
            throw transactionError;
        }
    } catch (error) {
        console.error('Admin approve request error:', error);
        res.status(500).json({ error: 'Failed to approve request', message: error.message });
    }
});

router.put('/requests/:id/reject', async (req, res) => {
    try {
        const requestId = req.params.id;
        const adminId = req.user.user_id;

        const [result] = await db.execute(`
            UPDATE recycling_requests 
            SET status = 'rejected', processed_at = NOW(), processed_by = ?
            WHERE request_id = ? AND status = 'pending'
        `, [adminId, requestId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Request not found or already processed' });
        }

        res.json({
            success: true,
            message: 'Request rejected successfully'
        });
    } catch (error) {
        console.error('Admin reject request error:', error);
        res.status(500).json({ error: 'Failed to reject request', message: error.message });
    }
});

// Admin Users Management
router.get('/users', async (req, res) => {
    try {
        const { search } = req.query;

        let query = `
            SELECT u.user_id, u.name, u.email, u.role, u.credits, u.created_at,
                   COUNT(h.history_id) as devices_recycled
            FROM users u
            LEFT JOIN recycling_history h ON u.user_id = h.user_id
        `;
        let params = [];

        if (search) {
            query += ' WHERE u.name LIKE ? OR u.email LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' GROUP BY u.user_id ORDER BY u.created_at DESC';

        const [users] = await db.execute(query, params);

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users', message: error.message });
    }
});

// Admin Marketplace Management
router.get('/marketplace', async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT l.listing_id, l.device_name, l.condition_type, l.price, 
                   l.description, l.image_url, l.status, l.created_at,
                   u.name as seller_name, u.email as seller_email
            FROM marketplace_listings l
            JOIN users u ON l.user_id = u.user_id
        `;
        let params = [];

        if (status && status !== 'all') {
            query += ' WHERE l.status = ?';
            params.push(status);
        }

        query += ' ORDER BY l.created_at DESC';

        const [listings] = await db.execute(query, params);

        res.json({
            success: true,
            listings
        });
    } catch (error) {
        console.error('Admin get marketplace error:', error);
        res.status(500).json({ error: 'Failed to fetch marketplace listings', message: error.message });
    }
});

router.put('/marketplace/:id/approve', async (req, res) => {
    try {
        const listingId = req.params.id;

        const [result] = await db.execute(`
            UPDATE marketplace_listings 
            SET status = 'active'
            WHERE listing_id = ?
        `, [listingId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        res.json({
            success: true,
            message: 'Listing approved successfully'
        });
    } catch (error) {
        console.error('Admin approve listing error:', error);
        res.status(500).json({ error: 'Failed to approve listing', message: error.message });
    }
});

router.delete('/marketplace/:id', async (req, res) => {
    try {
        const listingId = req.params.id;

        const [result] = await db.execute(`
            DELETE FROM marketplace_listings WHERE listing_id = ?
        `, [listingId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        res.json({
            success: true,
            message: 'Listing removed successfully'
        });
    } catch (error) {
        console.error('Admin remove listing error:', error);
        res.status(500).json({ error: 'Failed to remove listing', message: error.message });
    }
});

// Admin Statistics
router.get('/stats/overview', async (req, res) => {
    try {
        // Get total users
        const [userStats] = await db.execute('SELECT COUNT(*) as total_users FROM users WHERE role = "user"');
        
        // Get total facilities
        const [facilityStats] = await db.execute('SELECT COUNT(*) as total_facilities FROM facilities');
        
        // Get pending requests
        const [requestStats] = await db.execute('SELECT COUNT(*) as pending_requests FROM recycling_requests WHERE status = "pending"');
        
        // Get active listings
        const [listingStats] = await db.execute('SELECT COUNT(*) as active_listings FROM marketplace_listings WHERE status = "active"');

        res.json({
            success: true,
            stats: {
                total_users: userStats[0].total_users,
                total_facilities: facilityStats[0].total_facilities,
                pending_requests: requestStats[0].pending_requests,
                active_listings: listingStats[0].active_listings
            }
        });
    } catch (error) {
        console.error('Admin get overview stats error:', error);
        res.status(500).json({ error: 'Failed to fetch overview stats', message: error.message });
    }
});

router.get('/stats/activity', async (req, res) => {
    try {
        // Get recent activities (simplified version)
        const activities = [];

        // Recent user registrations
        const [recentUsers] = await db.execute(`
            SELECT name, created_at FROM users 
            WHERE role = 'user' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY created_at DESC LIMIT 5
        `);

        recentUsers.forEach(user => {
            activities.push({
                type: 'user_registered',
                description: `${user.name} registered`,
                timestamp: user.created_at
            });
        });

        // Recent requests
        const [recentRequests] = await db.execute(`
            SELECT r.submitted_at, r.status, u.name, d.model_name
            FROM recycling_requests r
            JOIN users u ON r.user_id = u.user_id
            JOIN devices d ON r.device_id = d.device_id
            WHERE r.submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY r.submitted_at DESC LIMIT 5
        `);

        recentRequests.forEach(request => {
            activities.push({
                type: request.status === 'approved' ? 'request_approved' : 'request_submitted',
                description: `${request.name} ${request.status === 'approved' ? 'got approved for' : 'submitted'} ${request.model_name}`,
                timestamp: request.submitted_at
            });
        });

        // Recent pickup requests
        const [recentPickups] = await db.execute(`
            SELECT p.created_at, p.status, u.name, d.model_name
            FROM pickup_requests p
            JOIN users u ON p.user_id = u.user_id
            JOIN devices d ON p.device_id = d.device_id
            WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY p.created_at DESC LIMIT 5
        `);

        recentPickups.forEach(pickup => {
            activities.push({
                type: 'pickup_requested',
                description: `${pickup.name} requested pickup for ${pickup.model_name}`,
                timestamp: pickup.created_at
            });
        });
        // Sort by timestamp
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            activities: activities.slice(0, 10)
        });
    } catch (error) {
        console.error('Admin get activity error:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity', message: error.message });
    }
});

// Admin Pickup Requests Management
router.get('/pickups', async (req, res) => {
    try {
        const { status, date } = req.query;

        let query = `
            SELECT p.pickup_id, p.address, p.scheduled_date, p.scheduled_time, 
                   p.status, p.tracking_note, p.created_at,
                   u.name as user_name, u.email as user_email,
                   d.model_name as device_name, d.category, d.credits_value
            FROM pickup_requests p
            JOIN users u ON p.user_id = u.user_id
            JOIN devices d ON p.device_id = d.device_id
        `;
        let params = [];

        const conditions = [];
        if (status && status !== 'all') {
            conditions.push('p.status = ?');
            params.push(status);
        }

        if (date) {
            conditions.push('p.scheduled_date = ?');
            params.push(date);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY p.created_at DESC';

        const [pickups] = await db.execute(query, params);

        res.json({
            success: true,
            pickups
        });
    } catch (error) {
        console.error('Admin get pickup requests error:', error);
        res.status(500).json({ error: 'Failed to fetch pickup requests', message: error.message });
    }
});

router.put('/pickups/:id/status', async (req, res) => {
    try {
        const pickupId = req.params.id;
        const { status, tracking_note } = req.body;
        const adminId = req.user.user_id;

        const validStatuses = ['pending', 'scheduled', 'picked_up', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Get current pickup details with user info
        const [currentPickup] = await db.execute(
            'SELECT p.*, d.credits_value, d.model_name FROM pickup_requests p JOIN devices d ON p.device_id = d.device_id WHERE p.pickup_id = ?',
            [pickupId]
        );

        if (currentPickup.length === 0) {
            return res.status(404).json({ error: 'Pickup request not found' });
        }

        const pickup = currentPickup[0];
        
        // Generate default tracking note if none provided
        let finalTrackingNote = tracking_note;
        if (!finalTrackingNote) {
            const statusMessages = {
                'pending': 'Request is pending review',
                'scheduled': 'Pickup has been scheduled with our team',
                'picked_up': 'Device has been picked up and is being processed',
                'completed': 'Pickup completed successfully - credits have been awarded',
                'cancelled': 'Pickup request has been cancelled'
            };
            finalTrackingNote = statusMessages[status] || `Status updated to ${status} by admin`;
        }

        // Update pickup status, tracking note, and updated_at
        const [result] = await db.execute(`
            UPDATE pickup_requests
            SET status = ?, tracking_note = ?, updated_at = CURRENT_TIMESTAMP
            WHERE pickup_id = ?
        `, [status, finalTrackingNote, pickupId]);

        // If pickup is completed, award credits to user
        if (status === 'completed' && pickup.status !== 'completed') {
            if (pickup.credits_value > 0) {
                await db.execute(
                    'UPDATE users SET credits = credits + ? WHERE user_id = ?',
                    [pickup.credits_value, pickup.user_id]
                );

                console.log(`💰 Awarded ${pickup.credits_value} credits for completed pickup ${pickupId} to user ${pickup.user_id}`);
            }
        }

        // Get updated pickup details for response and socket broadcast
        const [updatedPickup] = await db.execute(`
            SELECT p.pickup_id, p.user_id, p.address, p.scheduled_date, p.scheduled_time,
                   p.status, p.tracking_note, p.created_at, p.updated_at,
                   d.model_name, d.category, d.credits_value,
                   u.name as user_name
            FROM pickup_requests p
            JOIN devices d ON p.device_id = d.device_id
            JOIN users u ON p.user_id = u.user_id
            WHERE p.pickup_id = ?
        `, [pickupId]);

        const updatedPickupData = updatedPickup[0];

        // Broadcast real-time update to user
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${pickup.user_id}`).emit('pickup:update', {
                pickup_id: pickupId,
                status: status,
                tracking_note: finalTrackingNote,
                updated_at: new Date().toISOString(),
                device_name: pickup.model_name,
                credits_awarded: status === 'completed' && pickup.status !== 'completed' ? pickup.credits_value : 0
            });
            console.log(`🔌 Broadcasted pickup update to user_${pickup.user_id}`);
        }

        console.log(`📦 Pickup request ${pickupId} status updated to ${status} by admin ${req.user.name}`);

        res.json({
            success: true,
            message: 'Pickup status updated successfully',
            pickup: updatedPickupData
        });
    } catch (error) {
        console.error('Admin update pickup status error:', error);
        res.status(500).json({ error: 'Failed to update pickup status', message: error.message });
    }
});
module.exports = router;