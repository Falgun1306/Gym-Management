/**
 * Validates the request body for creating a coupon.
 * Returns an error message string or null if valid.
 */
export const validateCreateCoupon = (req) => {
    const { code, discountType, discountValue } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
        return "Coupon code is required";
    }

    const VALID_TYPES = ["PERCENTAGE", "FIXED_AMOUNT", "FREE_DAYS"];
    if (!discountType || !VALID_TYPES.includes(discountType.toUpperCase())) {
        return `discountType must be one of: ${VALID_TYPES.join(", ")}`;
    }

    const value = parseFloat(discountValue);
    if (!discountValue || isNaN(value) || value <= 0) {
        return "discountValue must be a positive number";
    }

    if (discountType.toUpperCase() === "PERCENTAGE" && (value <= 0 || value > 100)) {
        return "Percentage discount must be between 1 and 100";
    }

    if (req.body.expiresAt && isNaN(new Date(req.body.expiresAt).getTime())) {
        return "expiresAt must be a valid date";
    }

    if (req.body.startDate && isNaN(new Date(req.body.startDate).getTime())) {
        return "startDate must be a valid date";
    }

    if (req.body.maxUsageCount !== undefined && parseInt(req.body.maxUsageCount) < 1) {
        return "maxUsageCount must be a positive integer";
    }

    if (req.body.perUserLimit !== undefined && parseInt(req.body.perUserLimit) < 1) {
        return "perUserLimit must be a positive integer";
    }

    if (req.body.applicablePlanIds !== undefined && !Array.isArray(req.body.applicablePlanIds)) {
        return "applicablePlanIds must be an array of membership plan IDs";
    }

    return null;
};

/**
 * Validates request body for updating a coupon.
 * Returns an error message string or null if valid.
 */
export const validateUpdateCoupon = (req) => {
    const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE"];

    if (req.body.status && !ALLOWED_STATUSES.includes(req.body.status.toUpperCase())) {
        return `status must be one of: ${ALLOWED_STATUSES.join(", ")}`;
    }

    if (req.body.expiresAt && isNaN(new Date(req.body.expiresAt).getTime())) {
        return "expiresAt must be a valid date";
    }

    if (req.body.maxUsageCount !== undefined && parseInt(req.body.maxUsageCount) < 1) {
        return "maxUsageCount must be a positive integer";
    }

    if (req.body.perUserLimit !== undefined && parseInt(req.body.perUserLimit) < 1) {
        return "perUserLimit must be a positive integer";
    }

    return null;
};
