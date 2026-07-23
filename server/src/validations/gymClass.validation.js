export const validateCreateGymClass = (req) => {
    const { trainerId, title, capacity, startTime, endTime } = req.body;

    if (!trainerId || !title || !capacity || !startTime || !endTime) {
        return "trainerId, title, capacity, startTime, and endTime are required";
    }

    if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
        return "capacity must be a positive integer";
    }

    return null;
};
