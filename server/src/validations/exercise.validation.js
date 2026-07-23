export const validateCreateExercise = (req) => {
    const { name, muscleGroup } = req.body;

    if (!name || !muscleGroup) {
        return "Name and muscle group are required";
    }

    return null;
};
