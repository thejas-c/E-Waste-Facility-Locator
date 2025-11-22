const express = require('express');
const db = require('../config/database');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Create new mass collection request (public endpoint - no auth required)
router.post('/', async (req, res) => {
    try {
        const { 
            org_name, 
            org_type, 
            contact_person, 
            contact_phone, 
            contact_email, 
            address, 
            pincode, 
            estimated_items, 
            scheduled_date, 
            scheduled_time 
        } = req.body;

        // Validate required fields
        if (!org_name || !org_type || !address) {
            return res.status(400).json({ 
                error: 'Organization name, type, and address are required' 
            });
        }

        // Validate organization type
        const validOrgTypes = ['College', 'Company', 'Industry', 'Government', 'NGO'];
        if (!validOrgTypes.includes(org_type)) {
            return res.status(400).json({ error: 'Invalid organization type' });
        }

        // Validate scheduled date is not in the past
        if (scheduled_date) {
            const scheduledDate = new Date(scheduled_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (scheduledDate < today) {
                return res.status(400).json({ 
                    error: 'Scheduled date cannot be in the past' 
                });
            }
        }

        // Create mass collection request
        const [result] = await db.execute(`
            INSERT INTO mass_collection_requests 
            (org_name, org_type, contact_person, contact_phone, contact_email, address, pincode, estimated_items, scheduled_date, scheduled_time, tracking_note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            org_name, 
            org_type, 
            contact_person, 
            contact_phone, 
            contact_email, 
            address, 
            pincode, 
            estimated_items, 
            scheduled_date, 
            scheduled_time,
            'Mass collection request received, awaiting review and team assignment'
        ]);

        console.log(`🏭 New mass collection request created: ID ${result.insertId} for ${org_name}`);

        res.status(201).json({
            success: true,
            message: 'Mass collection request submitted successfully',
            collection: {
                collection_id: result.insertId,
                org_name: org_name,
                org_type: org_type,
                scheduled_date: scheduled_date,
                scheduled_time: scheduled_time,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Create mass collection request error:', error);
        res.status(500).json({ error: 'Failed to create mass collection request', message: error.message });
    }
});

// Get all mass collection requests (admin only)
router.get('/admin/all', verifyToken, adminOnly, async (req, res) => {
    try {
        const { status, org_type, date } = req.query;

        let query = `
            SELECT collection_id, org_name, org_type, contact_person, contact_phone, contact_email,
                   address, pincode, estimated_items, scheduled_date, scheduled_time,
                   status, tracking_note, created_at, updated_at
            FROM mass_collection_requests
        `;
        let params = [];

        const conditions = [];
        if (status && status !== 'all') {
            conditions.push('status = ?');
            params.push(status);
        }

        if (org_type && org_type !== 'all') {
            conditions.push('org_type = ?');
            params.push(org_type);
        }

        if (date) {
            conditions.push('scheduled_date = ?');
            params.push(date);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const [collections] = await db.execute(query, params);

        res.json({
            success: true,
            collections
        });
    } catch (error) {
        console.error('Get mass collection requests error:', error);
        res.status(500).json({ error: 'Failed to fetch mass collection requests', message: error.message });
    }
});

// Get mass collection requests for the logged-in user
router.get('/my', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const [collections] = await db.execute(
      `SELECT * FROM mass_collection_requests 
       WHERE contact_email = ?
       ORDER BY created_at DESC`,
      [userEmail]
    );

    res.json({ success: true, collections });
  } catch (error) {
    console.error('Get user mass collection requests error:', error);
    res.status(500).json({ error: 'Failed to fetch user requests' });
  }
});


// Get single mass collection request by ID (admin only)
router.get('/admin/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const collectionId = req.params.id;
        
        const [collections] = await db.execute(`
            SELECT collection_id, org_name, org_type, contact_person, contact_phone, contact_email,
                   address, pincode, estimated_items, scheduled_date, scheduled_time,
                   status, tracking_note, created_at, updated_at
            FROM mass_collection_requests
            WHERE collection_id = ?
        `, [collectionId]);

        if (collections.length === 0) {
            return res.status(404).json({ error: 'Mass collection request not found' });
        }

        res.json({
            success: true,
            collection: collections[0]
        });
    } catch (error) {
        console.error('Get mass collection request error:', error);
        res.status(500).json({ error: 'Failed to fetch mass collection request', message: error.message });
    }
});

// Update mass collection request status (admin only)
router.put('/admin/:id/status', verifyToken, adminOnly, async (req, res) => {
    try {
        const collectionId = req.params.id;
        const { status, tracking_note } = req.body;

        const validStatuses = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Get current collection details
        const [currentCollection] = await db.execute(
            'SELECT * FROM mass_collection_requests WHERE collection_id = ?',
            [collectionId]
        );

        if (currentCollection.length === 0) {
            return res.status(404).json({ error: 'Mass collection request not found' });
        }

        const collection = currentCollection[0];
        
        // Generate default tracking note if none provided
        let finalTrackingNote = tracking_note;
        if (!finalTrackingNote) {
            const statusMessages = {
                'pending': 'Request is pending review and team assignment',
                'scheduled': 'Collection has been scheduled with our specialized team',
                'in_progress': 'Collection team is on-site and processing the request',
                'completed': 'Mass collection completed successfully',
                'cancelled': 'Mass collection request has been cancelled'
            };
            finalTrackingNote = statusMessages[status] || `Status updated to ${status} by admin`;
        }

        // Update collection status and tracking note
        const [result] = await db.execute(`
            UPDATE mass_collection_requests
            SET status = ?, tracking_note = ?, updated_at = CURRENT_TIMESTAMP
            WHERE collection_id = ?
        `, [status, finalTrackingNote, collectionId]);

        // Get updated collection details for response
        const [updatedCollection] = await db.execute(`
            SELECT collection_id, org_name, org_type, contact_person, contact_phone, contact_email,
                   address, pincode, estimated_items, scheduled_date, scheduled_time,
                   status, tracking_note, created_at, updated_at
            FROM mass_collection_requests
            WHERE collection_id = ?
        `, [collectionId]);

        const updatedCollectionData = updatedCollection[0];

        // Broadcast real-time update (if Socket.io is available)
        const io = req.app.get('io');
        if (io) {
            io.emit('mass_collection:update', {
                collection_id: collectionId,
                status: status,
                tracking_note: finalTrackingNote,
                updated_at: new Date().toISOString(),
                org_name: collection.org_name
            });
            console.log(`🔌 Broadcasted mass collection update for ${collection.org_name}`);
        }

        console.log(`🏭 Mass collection request ${collectionId} status updated to ${status} by admin ${req.user.name}`);

        res.json({
            success: true,
            message: 'Mass collection status updated successfully',
            collection: updatedCollectionData
        });
    } catch (error) {
        console.error('Admin update mass collection status error:', error);
        res.status(500).json({ error: 'Failed to update mass collection status', message: error.message });
    }
});

// Get mass collection requests by organization email (for tracking)
router.get('/track/:email', async (req, res) => {
    try {
        const email = req.params.email;

        if (!email) {
            return res.status(400).json({ error: 'Email is required for tracking' });
        }

        const [collections] = await db.execute(`
            SELECT collection_id, org_name, org_type, scheduled_date, scheduled_time,
                   status, tracking_note, created_at, updated_at
            FROM mass_collection_requests
            WHERE contact_email = ?
            ORDER BY created_at DESC
        `, [email]);

        res.json({
            success: true,
            collections
        });
    } catch (error) {
        console.error('Track mass collection requests error:', error);
        res.status(500).json({ error: 'Failed to track mass collection requests', message: error.message });
    }
});

module.exports = router;