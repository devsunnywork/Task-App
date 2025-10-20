const mongoose = require('mongoose');

const connectDB = async () => {
    // Check if MONGO_URI is set in the environment variables
    if (!process.env.MONGO_URI) {
        console.error("FATAL ERROR: MONGO_URI is not defined in the .env file!");
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;