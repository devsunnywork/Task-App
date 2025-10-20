const express = require('express');
const router = express.Router();
const goalController = require('../controllers/GoalController');
const protect = require('../middleware/auth'); 

// Define Protected Goal Routes
router.post('/', protect, goalController.createGoal);             // Create
router.get('/', protect, goalController.getAllGoals);              // Read All
router.put('/:id', protect, goalController.updateGoal);           // Update
router.delete('/:id', protect, goalController.deleteGoal);        // Delete

// PATCH /api/goals/:goalId/lesson/:chapterId/:lessonId/complete
// Toggle lesson completion and update goal progress
router.patch('/:goalId/lesson/:chapterId/:lessonId/complete', 
    protect, 
    goalController.toggleLessonCompletion
);

module.exports = router;
