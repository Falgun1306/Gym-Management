export const validateCreateDietPlan = (req) => {
    const { title, durationDays } = req.body;

    if (!title || !durationDays) {
        return "Title and duration days are required";
    }

    return null;
};
