const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const protect = require('../middleware/auth'); // Import middleware

// Define Protected Task Routes
// POST /api/tasks: Create a new task
router.post('/', protect, taskController.createTask);

// GET /api/tasks: Get all tasks for the user
router.get('/', protect, taskController.getAllTasks);

router.delete('/:id', protect, taskController.deleteTask);

// PATCH /api/tasks/:taskId/complete: Toggle completion status (main or sub-task)
router.patch('/:taskId/complete', protect, taskController.toggleCompletion);

module.exports = router;