export const validateCreateNotification = (req) => {
    const { userId, title, message } = req.body;

    if (!userId || !title || !message) {
        return "userId, title, and message are required";
    }

    return null;
};

export const validateSendBulkNotification = (req) => {
    const { title, message } = req.body;

    if (!title || !message) {
        return "title and message are required";
    }

    return null;
};
