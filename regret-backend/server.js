// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); 

// Import DB connection and Routes
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const goalRoutes = require('./routes/goalRoutes');
const taskRoutes = require('./routes/taskRoutes'); 

// --- Configuration ---
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// --- Middleware ---
// Enable CORS for the frontend (allowing all origins for now)
app.use(cors());
// Body parser for JSON requests
app.use(express.json());

// --- API Routes ---
// 1. Authentication Routes (Public)
app.use('/api/auth', authRoutes); 

// 2. Protected Data Routes (Require JWT middleware 'protect')
app.use('/api/goals', goalRoutes);
app.use('/api/tasks', taskRoutes);

// --- Basic Health Check Route ---
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'REGRET Backend API is running successfully!',
        status: 'OK',
        database: mongoose.STATES[mongoose.connection.readyState],
        api_endpoints: ['/api/auth/signup', '/api/auth/login', '/api/goals', '/api/tasks']
    });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Open http://localhost:${PORT}/ to check API status.`);
});