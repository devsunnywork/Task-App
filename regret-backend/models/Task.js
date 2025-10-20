const mongoose = require('mongoose');

// --- Embedded Sub-Task Schema ---
const SubTaskSchema = new mongoose.Schema({
    // We only need title and completion status for sub-tasks
    title: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { _id: true }); // Mongoose automatically assigns an _id to sub-documents

// --- Main Task Schema ---
const TaskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    // Scheduling (combining date and time into one Date object is common practice)
    scheduleDate: {
        type: Date,
        required: true
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    // Connection to Goal
    goalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal',
        default: null
    },
    // Main Task Completion Status
    completed: {
        type: Boolean,
        default: false
    },
    // Hierarchical Sub-Tasks (Array of SubTaskSchema)
    subTasks: [SubTaskSchema]

}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);