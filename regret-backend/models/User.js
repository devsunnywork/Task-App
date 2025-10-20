const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: { // Added for authentication
        type: String,
        required: true,
        minlength: 6 // Basic validation
    },
    // We don't need other fields for now (like email, name)
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);