const mongoose = require('mongoose');

// --- Embedded Lesson Schema (Deepest Level) ---
const LessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    notes: { type: String } // For personal notes/reflection
}, { _id: true });

// --- Embedded Chapter/Module Schema (Mid-Level) ---
const ChapterSchema = new mongoose.Schema({
    title: { type: String, required: true },
    order: { type: Number, required: true }, // For sequencing (Physics -> Math -> Animation)
    lessons: [LessonSchema] // Array of lessons
}, { _id: true });

// --- Main Goal Schema (Top Level) ---
const GoalSchema = new mongoose.Schema({
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
    targetDate: {
        type: Date,
        required: true
    },
    category: { // New: e.g., 'Game Dev', 'Academics', 'Career'
        type: String,
        default: 'General'
    },
    status: {
        type: String,
        enum: ['InProgress', 'OnHold', 'Completed', 'Planned'],
        default: 'Planned'
    },
    // Progress is now CALCULATED based on internal Lessons
    progressPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    chapters: [ChapterSchema] // New: Hierarchical structure
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);