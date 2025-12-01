const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all marketplace listings
router.get('/', async (req, res) => {
    try {
        const { condition, max_price, search } = req.query;

        let query = `
            SELECT l.listing_id, l.device_name, l.condition_type, l.price, 
                   l.description, l.image_url, l.status, l.created_at,
                   u.name as seller_name, u.email as seller_email
            FROM marketplace_listings l
            JOIN users u ON l.user_id = u.user_id
            WHERE l.status = 'active'
        `;
        let params = [];

        if (condition) {
            query += ' AND l.condition_type = ?';
            params.push(condition);
        }

        if (max_price) {
            query += ' AND l.price <= ?';
            params.push(parseFloat(max_price));
        }

        if (search) {
            query += ' AND (l.device_name LIKE ? OR l.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY l.created_at DESC';

        const [listings] = await db.execute(query, params);

        res.json({
            success: true,
            listings,
            total: listings.length
        });
    } catch (error) {
        console.error('Get marketplace listings error:', error);
        res.status(500).json({ error: 'Failed to fetch marketplace listings', message: error.message });
    }
});

// Get single listing by ID
router.get('/:id', async (req, res) => {
    try {
        const [listings] = await db.execute(`
            SELECT l.*, u.name as seller_name, u.email as seller_email
            FROM marketplace_listings l
            JOIN users u ON l.user_id = u.user_id
            WHERE l.listing_id = ?
        `, [req.params.id]);

        if (listings.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        res.json({
            success: true,
            listing: listings[0]
        });
    } catch (error) {
        console.error('Get listing error:', error);
        res.status(500).json({ error: 'Failed to fetch listing', message: error.message });
    }
});

// Create new marketplace listing (requires authentication)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { device_name, condition_type, price, description, image_url } = req.body;
        const user_id = req.user.user_id;

        if (!device_name || !condition_type || !price) {
            return res.status(400).json({ error: 'Device name, condition, and price are required' });
        }

        const validConditions = ['excellent', 'good', 'fair', 'poor'];
        if (!validConditions.includes(condition_type)) {
            return res.status(400).json({ error: 'Invalid condition type' });
        }

        if (price <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }

        const [result] = await db.execute(`
            INSERT INTO marketplace_listings (user_id, device_name, condition_type, price, description, image_url,status)
            VALUES (?, ?, ?, ?, ?, ?,'pending')
        `, [user_id, device_name, condition_type, price, description, image_url]);

        res.status(201).json({
            success: true,
            message: 'Listing created successfully',
            listing_id: result.insertId
        });
    } catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ error: 'Failed to create listing', message: error.message });
    }
});

// Update marketplace listing (only by owner)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { device_name, condition_type, price, description, image_url, status } = req.body;
        const listing_id = req.params.id;
        const user_id = req.user.user_id;

        // Check if listing exists and user owns it
        const [existingListings] = await db.execute(
            'SELECT user_id FROM marketplace_listings WHERE listing_id = ?',
            [listing_id]
        );

        if (existingListings.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (existingListings[0].user_id !== user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only update your own listings' });
        }

        const [result] = await db.execute(`
            UPDATE marketplace_listings 
            SET device_name = COALESCE(?, device_name),
                condition_type = COALESCE(?, condition_type),
                price = COALESCE(?, price),
                description = COALESCE(?, description),
                image_url = COALESCE(?, image_url),
                status = COALESCE(?, status)
            WHERE listing_id = ?
        `, [device_name, condition_type, price, description, image_url, status, listing_id]);

        res.json({
            success: true,
            message: 'Listing updated successfully'
        });
    } catch (error) {
        console.error('Update listing error:', error);
        res.status(500).json({ error: 'Failed to update listing', message: error.message });
    }
});

// Delete marketplace listing (only by owner or admin)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const listing_id = req.params.id;
        const user_id = req.user.user_id;

        // Check if listing exists and user owns it
        const [existingListings] = await db.execute(
            'SELECT user_id FROM marketplace_listings WHERE listing_id = ?',
            [listing_id]
        );

        if (existingListings.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (existingListings[0].user_id !== user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own listings' });
        }

        const [result] = await db.execute(
            'DELETE FROM marketplace_listings WHERE listing_id = ?',
            [listing_id]
        );

        res.json({
            success: true,
            message: 'Listing deleted successfully'
        });
    } catch (error) {
        console.error('Delete listing error:', error);
        res.status(500).json({ error: 'Failed to delete listing', message: error.message });
    }
});

// Get user's own listings
router.get('/user/my-listings', verifyToken, async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const [listings] = await db.execute(`
            SELECT listing_id, device_name, condition_type, price, description, 
                   image_url, status, created_at
            FROM marketplace_listings 
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [user_id]);

        res.json({
            success: true,
            listings
        });
    } catch (error) {
        console.error('Get user listings error:', error);
        res.status(500).json({ error: 'Failed to fetch your listings', message: error.message });
    }
});

module.exports = router;