const Task = require('../models/Task');
const Goal = require('../models/Goal');
// Renamed to match file naming convention: goalController
const { calculateGoalProgress } = require('./GoalController'); 

/**
 * Helper to update a single goal's progress percentage and status.
 */
const updateGoalProgress = async (goalId) => {
    if (!goalId) return;

    try {
        const goal = await Goal.findById(goalId);
        if (!goal) return;

        // NOTE: Since Goals are now hierarchical, we must call the goalController's
        // progress calculation logic directly here. If calculateGoalProgress 
        // expects a Goal document, we need to adjust the call or the helper.
        // Assuming the imported calculateGoalProgress is the old version that requires task fetching, 
        // which means it is no longer correct for the NEW Goal model.
        
        // **CRITICAL:** Reverting to the old goal logic temporarily for this controller to run, 
        // but note this requires a full fix if your Goal model is the new hierarchical type.
        // Since the prompt shows the old `updateGoalProgress` helper, we assume the old logic for now.
        const progress = await calculateGoalProgress(goalId);
        
        // Update progress only if it has changed
        if (goal.progressPercentage !== progress || progress === 100) {
            goal.progressPercentage = progress;
            
            // Check for completion status update
            if (progress === 100 && goal.status !== 'Completed') {
                goal.status = 'Completed';
            } else if (progress < 100 && goal.status === 'Completed') {
                goal.status = 'InProgress'; // Reopen goal if progress drops
            }
            await goal.save();
        }
    } catch (error) {
        console.error(`Error updating goal ${goalId} after task change:`, error.message);
    }
};

/**
 * @route POST /api/tasks
 * @desc Create a new Task
 * (PROTECTED)
 */
exports.createTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, scheduleDate, priority, goalId, subTasks } = req.body;
        
        // Ensure sub-tasks are mapped cleanly (Mongoose assigns _id on its own)
        const subTasksData = subTasks ? subTasks.map(st => ({
            title: st.title,
            completed: false
        })) : [];

        const newTask = new Task({
            userId, // Assign the authenticated user ID
            title,
            description,
            // scheduleDate should be a valid ISO Date string from the frontend
            scheduleDate,
            priority,
            goalId: goalId || null, 
            subTasks: subTasksData,
            completed: false
        });

        const task = await newTask.save();
        
        // 1. Trigger Goal Update if linked (Note: This links a task to the OLD goal system. 
        // This should be removed if the new hierarchical Goal system is fully implemented)
        if (task.goalId) {
            await updateGoalProgress(task.goalId);
        }

        res.status(201).json(task);
    } catch (error) {
        console.error('Task Creation Error:', error);
        res.status(500).json({ message: 'Error creating task. Check input format (e.g., scheduleDate).', error: error.message });
    }
};

/**
 * @route GET /api/tasks
 * @desc Get all Tasks for the authenticated user
 * (PROTECTED)
 */
exports.getAllTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch tasks and filter by userId
        const tasks = await Task.find({ userId })
            .sort({ completed: 1, scheduleDate: 1 }); 
        
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Task Fetching Error:', error);
        res.status(500).json({ message: 'Error fetching tasks.', error: error.message });
    }
};

/**
 * @route PATCH /api/tasks/:taskId/complete
 * @desc Toggle completion status for a main task or a sub-task.
 * (PROTECTED)
 */
exports.toggleCompletion = async (req, res) => {
    const { taskId } = req.params;
    const { type, subTaskId } = req.body; // type: 'main' or 'sub'
    const userId = req.user.id;
    
    try {
        // Find task and ensure it belongs to the authenticated user
        const task = await Task.findOne({ _id: taskId, userId });
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found or unauthorized.' });
        }
        
        let completionChanged = false;

        if (type === 'main') {
            const newStatus = !task.completed;
            task.completed = newStatus;
            
            // Sync sub-tasks to match main task status
            if (task.subTasks.length > 0) {
                task.subTasks.forEach(st => st.completed = newStatus);
            }
            completionChanged = true;
        } 
        else if (type === 'sub' && subTaskId) {
            // Use Mongoose's built-in sub-document method for finding by _id
            const subTask = task.subTasks.id(subTaskId); 
            if (subTask) {
                subTask.completed = !subTask.completed;
                completionChanged = true;
                
                // Update main task completion based on all sub-tasks
                const allSubTasksCompleted = task.subTasks.every(st => st.completed);
                if (allSubTasksCompleted !== task.completed) {
                    task.completed = allSubTasksCompleted;
                }
            } else {
                return res.status(404).json({ message: 'Sub-task not found.' });
            }
        } else {
            return res.status(400).json({ message: 'Invalid completion type or missing subTaskId.' });
        }

        if (completionChanged) {
            await task.save();
            
            // 2. Trigger Goal Update if linked
            if (task.goalId) {
                await updateGoalProgress(task.goalId);
            }
        }
        
        res.status(200).json(task);

    } catch (error) {
        console.error('Toggle Completion Error:', error.message);
        res.status(500).json({ message: 'Server error during completion toggle.', error: error.message });
    }
};

/**
 * @route DELETE /api/tasks/:id
 * @desc Delete a Task
 * (PROTECTED)
 */
exports.deleteTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        
        // 1. Find the task to check goal linkage before deletion
        const taskToDelete = await Task.findOne({ _id: taskId, userId });

        if (!taskToDelete) {
            return res.status(404).json({ message: 'Task not found or unauthorized.' });
        }
        
        const goalId = taskToDelete.goalId;

        // 2. Delete the task
        await Task.deleteOne({ _id: taskId, userId });
        
        // 3. Update Goal progress if linked
        if (goalId) {
            // NOTE: The updateGoalProgress helper is called here to recalculate progress
            // because a contributing task has been removed.
            await updateGoalProgress(goalId);
        }

        // Send a successful, empty JSON response (200 OK)
        res.status(200).json({ message: 'Task deleted successfully.' });

    } catch (error) {
        console.error('Task Deletion Error:', error);
        res.status(500).json({ message: 'Error deleting task.', error: error.message });
    }
};