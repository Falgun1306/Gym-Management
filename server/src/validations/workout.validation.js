export const validateCreateWorkoutPlan = (req) => {
    const { title, exercises } = req.body;

    if (!title) {
        return "Title is required";
    }

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
        return "At least one exercise is required";
    }

    return null;
};
