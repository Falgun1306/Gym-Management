export const validateCreateComplaint = (req) => {
    const { subject, description } = req.body;

    if (!subject || !description) {
        return "subject and description are required";
    }

    return null;
};

export const validateResolveComplaint = (req) => {
    const { status } = req.body;
    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"];

    if (!status || !validStatuses.includes(status)) {
        return `status is required and must be one of: ${validStatuses.join(", ")}`;
    }

    return null;
};
