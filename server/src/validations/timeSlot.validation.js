const ALLOWED_PRESET_SLOTS = [
    "06:00-07:00",
    "07:00-08:00",
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "16:00-17:00",
    "17:00-18:00",
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
];

export const validateCreateTimeSlot = (req) => {
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
        return "Please select a valid predefined time slot";
    }

    const slotKey = `${startTime}-${endTime}`;
    if (!ALLOWED_PRESET_SLOTS.includes(slotKey)) {
        return "Selected time slot is invalid. Please select from the predefined gym time slots.";
    }

    return null;
};

export const validateUpdateTimeSlot = (req) => {
    const { startTime, endTime } = req.body;

    if (startTime && endTime) {
        const slotKey = `${startTime}-${endTime}`;
        if (!ALLOWED_PRESET_SLOTS.includes(slotKey)) {
            return "Selected time slot is invalid. Please select from the predefined gym time slots.";
        }
    }

    return null;
};

export const validateCreateAdvisory = (req) => {
    const { startTime, endTime, title } = req.body;

    if (!startTime || !endTime || !title) {
        return "startTime, endTime, and title are required";
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return "startTime and endTime must be in valid HH:mm format";
    }

    return null;
};
