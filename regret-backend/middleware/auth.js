const jwt = require('jsonwebtoken');

// The secret key from your .env file
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to protect routes.
 * 1. Checks for a token in the 'x-auth-token' header.
 * 2. Verifies the token using JWT_SECRET.
 * 3. Attaches the user ID (from the token payload) to the request object (req.user.id).
 */
const protect = (req, res, next) => {
    // Get token from header
    // The frontend must send the token in the header: { 'x-auth-token': 'TOKEN_HERE' }
    const token = req.header('x-auth-token'); 

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Attach the user ID to the request object
        req.user = decoded; 

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        // If verification fails (e.g., token expired or invalid secret)
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

module.exports = protect;