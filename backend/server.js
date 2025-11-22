const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join user-specific room for pickup updates
    socket.on('join-user-room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room user_${userId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/education', require('./routes/education'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/history', require('./routes/history'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/pickups', require('./routes/pickups'));
app.use('/api/admin', require('./routes/admin'));

const massCollectionRouter = require('./routes/mass-collection');
app.use('/api/mass-collection', massCollectionRouter);


// Serve main app for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

server.listen(PORT, () => {
    console.log(`🚀 E-Waste Facility Locator server running on port ${PORT}`);
    console.log(`🌐 Access the application at: http://localhost:${PORT}`);
    console.log(`🔌 Socket.io enabled for real-time pickup tracking`);
});