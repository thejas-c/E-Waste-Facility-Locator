const express = require('express');
const db = require('../config/database');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all facilities
router.get('/', async (req, res) => {
    try {
        const [facilities] = await db.execute(`
            SELECT facility_id, name, address, latitude, longitude, 
                   contact, operating_hours, website, created_at 
            FROM facilities 
            ORDER BY name ASC
        `);

        res.json({
            success: true,
            facilities
        });
    } catch (error) {
        console.error('Get facilities error:', error);
        res.status(500).json({ error: 'Failed to fetch facilities', message: error.message });
    }
});

// Get nearby facilities (robust - clamps acos arg to [-1,1] to avoid NULL)
router.get('/nearby', async (req, res) => {
    try {
        let { lat, lng, radius = 50 } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        lat = parseFloat(lat);
        lng = parseFloat(lng);
        radius = Number(radius); // kilometers

        if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radius)) {
            return res.status(400).json({ error: 'Invalid lat/lng/radius' });
        }

        console.log('Nearby facilities query params:', { lat, lng, radius });

        // build expression parts
        const expr = `
            cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?))
            + sin(radians(?)) * sin(radians(latitude))
        `;

        // clamp inside LEAST/GREATEST to ensure acos gets [-1,1]
        const haversine_clamped = `
            (6371 * acos( LEAST(1, GREATEST(-1, ${expr})) ))
        `;

        const sql = `
            SELECT facility_id, name, address, latitude, longitude,
                   contact, operating_hours, website,
                   ROUND(${haversine_clamped}, 2) AS distance_km
            FROM facilities
            WHERE ${haversine_clamped} <= ?
            ORDER BY distance_km ASC
            LIMIT 200
        `;

        // placeholders: expr used twice (3 params each) then radius
        const params = [lat, lng, lat, lat, lng, lat, radius];

        const [rows] = await db.execute(sql, params);

        // debug logs
        console.log('Nearby facilities found:', rows.length);

        // helpful debug if zero results
        if (rows.length === 0) {
            // fetch one sample row near the DB (no distance filter) to inspect coords
            const [sample] = await db.execute(`
                SELECT facility_id, name, latitude, longitude
                FROM facilities
                LIMIT 5
            `);
            console.info('Sample facility rows (for debugging):', sample);
        }

        res.json({
            success: true,
            facilities: rows,
            searchParams: { latitude: lat, longitude: lng, radius_km: radius }
        });
    } catch (error) {
        console.error('Get nearby facilities error:', error);
        res.status(500).json({ error: 'Failed to find nearby facilities', message: error.message });
    }
});



// Get single facility by ID
router.get('/:id', async (req, res) => {
    try {
        const [facilities] = await db.execute(
            'SELECT * FROM facilities WHERE facility_id = ?',
            [req.params.id]
        );

        if (facilities.length === 0) {
            return res.status(404).json({ error: 'Facility not found' });
        }

        res.json({
            success: true,
            facility: facilities[0]
        });
    } catch (error) {
        console.error('Get facility error:', error);
        res.status(500).json({ error: 'Failed to fetch facility', message: error.message });
    }
});

// Create new facility (Admin only)
router.post('/', verifyToken, adminOnly, async (req, res) => {
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
        console.error('Create facility error:', error);
        res.status(500).json({ error: 'Failed to create facility', message: error.message });
    }
});

// Update facility (Admin only)
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const { name, address, latitude, longitude, contact, operating_hours, website } = req.body;
        const facilityId = req.params.id;

        const [result] = await db.execute(`
            UPDATE facilities 
            SET name = ?, address = ?, latitude = ?, longitude = ?, 
                contact = ?, operating_hours = ?, website = ?
            WHERE facility_id = ?
        `, [name, address, latitude, longitude, contact, operating_hours, website, facilityId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Facility not found' });
        }

        res.json({
            success: true,
            message: 'Facility updated successfully'
        });
    } catch (error) {
        console.error('Update facility error:', error);
        res.status(500).json({ error: 'Failed to update facility', message: error.message });
    }
});

router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid facility id' });
        }

        // Hard delete:
        const [result] = await db.execute(
            'DELETE FROM facilities WHERE facility_id = ?',
            [id]
        );

        // // Soft-delete alternative:
        // const [result] = await db.execute(
        //     'UPDATE facilities SET deleted_at = CURRENT_TIMESTAMP WHERE facility_id = ? AND deleted_at IS NULL',
        //     [id]
        // );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Facility not found' });
        }

        console.log(`Facility ${id} deleted by admin ${req.user?.user_id || 'unknown'}`);
        return res.json({ success: true, message: 'Facility deleted successfully' });
    } catch (error) {
        console.error('Delete facility error:', error);

        // Foreign key constraint error (can't delete referenced row)
        if (error && (error.errno === 1451 || error.code === 'ER_ROW_IS_REFERENCED_2')) {
            return res.status(409).json({ error: 'Cannot delete facility: referenced by other records' });
        }

        return res.status(500).json({ error: 'Failed to delete facility', message: error.message });
    }
});


module.exports = router;