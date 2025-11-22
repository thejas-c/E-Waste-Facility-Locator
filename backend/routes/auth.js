const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const [existingUsers] = await db.execute(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create new user
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [name, email, passwordHash]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: result.insertId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertId,
                name,
                email,
                role: 'user',
                credits: 0
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed', message: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const [users] = await db.execute(
            'SELECT user_id, name, email, password_hash, role, credits FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.user_id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                credits: user.credits
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', message: error.message });
    }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user.user_id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                credits: req.user.credits
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to get profile', message: error.message });
    }
});

module.exports = router;