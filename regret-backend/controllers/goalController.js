const Goal = require('../models/Goal');

/**
 * Core business logic: Calculates the completion percentage based on internal lessons.
 * @param {GoalDocument} goal - The Mongoose Goal document.
 * @returns {number} The calculated progress percentage (0-100).
 */
const calculateGoalProgress = (goal) => {
    let totalLessons = 0;
    let completedLessons = 0;

    goal.chapters.forEach(chapter => {
        totalLessons += chapter.lessons.length;
        completedLessons += chapter.lessons.filter(lesson => lesson.completed).length;
    });

    if (totalLessons === 0) return 0;

    return Math.round((completedLessons / totalLessons) * 100);
};

// Export the core progress function (used internally now)
exports.calculateGoalProgress = calculateGoalProgress;

/** Helper to save goal and update its progress/status */
const saveAndUpdateGoal = async (goal) => {
    const progress = calculateGoalProgress(goal);
    
    if (goal.progressPercentage !== progress) {
        goal.progressPercentage = progress;
        // Update status based on progress
        if (progress === 100 && goal.status !== 'Completed') {
             goal.status = 'Completed';
        } else if (progress < 100 && goal.status === 'Completed') {
             goal.status = 'InProgress';
        }
    }
    await goal.save();
    return goal;
}


/**
 * @route POST /api/goals
 * @desc Create a new Goal (now includes chapters/lessons in req.body)
 * (PROTECTED)
 */
exports.createGoal = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { title, description, targetDate, category, chapters } = req.body;
        
        // Ensure chapters have an order assigned if not provided
        const finalChapters = chapters.map((c, index) => ({
            ...c,
            order: c.order !== undefined ? c.order : index
        }));

        const newGoal = new Goal({
            userId, 
            title,
            description,
            targetDate,
            category,
            chapters: finalChapters,
            status: 'Planned', 
            progressPercentage: 0
        });

        const goal = await saveAndUpdateGoal(newGoal);
        res.status(201).json(goal);
    } catch (error) {
        console.error('Goal Creation Error:', error);
        res.status(500).json({ message: 'Error creating goal. Check input format.', error: error.message });
    }
};

/**
 * @route GET /api/goals
 * @desc Get all Goals for the user
 * (PROTECTED)
 */
exports.getAllGoals = async (req, res) => {
    try {
        const userId = req.user.id;
        // Fetch goals, sort by target date
        const goals = await Goal.find({ userId }).sort({ targetDate: 1 });
        
        // Ensure progress is updated before sending (optional but safer)
        const goalsWithProgress = await Promise.all(goals.map(saveAndUpdateGoal));

        res.status(200).json(goalsWithProgress);
    } catch (error) {
        console.error('Goal Fetching Error:', error);
        res.status(500).json({ message: 'Error fetching goals.', error: error.message });
    }
};

/**
 * @route PUT /api/goals/:id
 * @desc Update a Goal (allows chapters/lessons to be updated)
 * (PROTECTED)
 */
exports.updateGoal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, targetDate, category, status, chapters } = req.body;
        
        const goal = await Goal.findOne({ _id: req.params.id, userId });
        if (!goal) return res.status(404).json({ message: 'Goal not found or unauthorized.' });

        // Update main fields
        goal.title = title || goal.title;
        goal.description = description || goal.description;
        goal.targetDate = targetDate || goal.targetDate;
        goal.category = category || goal.category;
        goal.status = status || goal.status;
        
        // If chapters are provided, replace or merge them
        if (chapters) {
             // For simplicity, we'll replace the entire chapter structure on update
             goal.chapters = chapters;
        }

        const updatedGoal = await saveAndUpdateGoal(goal);

        res.status(200).json(updatedGoal);
    } catch (error) {
        console.error('Goal Update Error:', error);
        res.status(500).json({ message: 'Error updating goal.', error: error.message });
    }
};


/**
 * @route PATCH /api/goals/:goalId/lesson/:chapterId/:lessonId/complete
 * @desc Toggle completion status for a lesson (and recalculate goal progress)
 * (PROTECTED)
 */
exports.toggleLessonCompletion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { goalId, chapterId, lessonId } = req.params;
        
        const goal = await Goal.findOne({ _id: goalId, userId });
        if (!goal) return res.status(404).json({ message: 'Goal not found or unauthorized.' });

        const chapter = goal.chapters.id(chapterId);
        if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });

        const lesson = chapter.lessons.id(lessonId);
        if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });
        
        // Toggle status
        lesson.completed = !lesson.completed;
        
        const updatedGoal = await saveAndUpdateGoal(goal);

        res.status(200).json(updatedGoal);
    } catch (error) {
        console.error('Lesson Toggle Error:', error);
        res.status(500).json({ message: 'Error toggling lesson completion.', error: error.message });
    }
};

/**
 * @route DELETE /api/goals/:id
 * @desc Delete a Goal
 * (PROTECTED)
 */
exports.deleteGoal = async (req, res) => {
    try {
        const userId = req.user.id;
        const goalId = req.params.id;
        
        // Find and delete the goal only if it belongs to the user
        const result = await Goal.deleteOne({ _id: goalId, userId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Goal not found or unauthorized.' });
        }

        res.status(200).json({ message: 'Goal deleted successfully.' });
    } catch (error) {
        console.error('Goal Deletion Error:', error);
        res.status(500).json({ message: 'Error deleting goal.', error: error.message });
    }
};