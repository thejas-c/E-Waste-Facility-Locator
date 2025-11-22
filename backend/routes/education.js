const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get all educational content
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;

        let query = `
            SELECT content_id, title, description, image_url, category, created_at 
            FROM educational_content
        `;
        let params = [];

        if (category) {
            query += ' WHERE category = ?';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const [content] = await db.execute(query, params);

        res.json({
            success: true,
            content,
            total: content.length
        });
    } catch (error) {
        console.error('Get educational content error:', error);
        res.status(500).json({ error: 'Failed to fetch educational content', message: error.message });
    }
});

// Get single educational content by ID
router.get('/:id', async (req, res) => {
    try {
        const [content] = await db.execute(
            'SELECT * FROM educational_content WHERE content_id = ?',
            [req.params.id]
        );

        if (content.length === 0) {
            return res.status(404).json({ error: 'Educational content not found' });
        }

        res.json({
            success: true,
            content: content[0]
        });
    } catch (error) {
        console.error('Get educational content error:', error);
        res.status(500).json({ error: 'Failed to fetch educational content', message: error.message });
    }
});

// Get random educational fact
router.get('/random/fact', async (req, res) => {
    try {
        const [content] = await db.execute(`
            SELECT content_id, title, description, image_url, category 
            FROM educational_content 
            ORDER BY RAND() 
            LIMIT 1
        `);

        if (content.length === 0) {
            return res.status(404).json({ error: 'No educational content available' });
        }

        res.json({
            success: true,
            fact: content[0]
        });
    } catch (error) {
        console.error('Get random fact error:', error);
        res.status(500).json({ error: 'Failed to fetch random fact', message: error.message });
    }
});

// Get content categories
router.get('/meta/categories', async (req, res) => {
    try {
        const [categories] = await db.execute(`
            SELECT DISTINCT category, COUNT(*) as count 
            FROM educational_content 
            GROUP BY category 
            ORDER BY category ASC
        `);

        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories', message: error.message });
    }
});

module.exports = router;