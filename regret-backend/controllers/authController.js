const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// The secret key from your .env file
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1d'; // Token expires in 1 day

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 */
exports.registerUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide both username and password.' });
    }

    try {
        // 1. Check if user already exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create new user
        user = new User({
            username,
            password: hashedPassword // Store the hashed password
        });

        await user.save();

        // 4. Generate JWT Token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });

        // 5. Respond with token (and user ID for the frontend)
        res.status(201).json({
            token,
            userId: user._id,
            username: user.username,
            message: 'User registered successfully.'
        });

    } catch (error) {
        console.error('Registration Error:', error.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 */
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide both username and password.' });
    }

    try {
        // 1. Check for user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials.' });
        }

        // 2. Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials.' });
        }

        // 3. Generate JWT Token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });

        // 4. Respond with token
        res.status(200).json({
            token,
            userId: user._id,
            username: user.username,
            message: 'Login successful.'
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
};