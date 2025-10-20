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
// const courseRoutes = require('./routes/courseRoutes'); // Keep this commented if not implemented

// --- Configuration ---
const app = express();
const PORT = process.env.PORT || 5000;
// Define the allowed origin from .env
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

// Connect to Database
connectDB();

// --- Middleware ---

// FIX: Configure CORS to restrict access to only your frontend URL
const corsOptions = {
    origin: ALLOWED_ORIGIN,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allows cookies/auth headers to be sent
    optionsSuccessStatus: 200 
}
app.use(cors(corsOptions)); 

// Body parser for JSON requests
app.use(express.json());

// --- API Routes ---
// 1. Authentication Routes (Public)
app.use('/api/auth', authRoutes); 

// 2. Protected Data Routes (Require JWT middleware 'protect')
app.use('/api/goals', goalRoutes);
app.use('/api/tasks', taskRoutes);
// app.use('/api/courses', courseRoutes); // Uncomment when ready

// --- Basic Health Check Route ---
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'REGRET Backend API is running successfully!',
        status: 'OK',
        database: mongoose.STATES[mongoose.connection.readyState],
        api_endpoints: ['/api/auth/signup', '/api/auth/login', '/api/goals', '/api/tasks'],
        allowed_origin: ALLOWED_ORIGIN || 'ALL (*)'
    });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Open http://localhost:${PORT}/ to check API status.`);
});