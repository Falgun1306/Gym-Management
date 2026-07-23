export const validateCreateEquipment = (req) => {
    const { name, category, quantity } = req.body;

    if (!name || !category || quantity === undefined) {
        return "name, category, and quantity are required";
    }

    if (isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
        return "quantity must be a non-negative number";
    }

    return null;
};

export const validateUpdateEquipmentStatus = (req) => {
    const { status } = req.body;
    const validStatuses = ["AVAILABLE", "UNDER_MAINTENANCE", "OUT_OF_ORDER", "RETIRED"];

    if (!status || !validStatuses.includes(status)) {
        return `status is required and must be one of: ${validStatuses.join(", ")}`;
    }

    return null;
};
