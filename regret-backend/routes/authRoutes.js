const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/signup: Register user
router.post('/signup', authController.registerUser);

// POST /api/auth/login: Login user
router.post('/login', authController.loginUser);

module.exports = router;