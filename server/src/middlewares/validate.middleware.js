import ErrorHandler from "../utility/ErrorHandler.utility.js";

/**
 * Validation Middleware Wrapper
 *
 * @param {Function|Object} validator - Validation function or schema with validate method
 * @returns Express Middleware
 */
const validate = (validator) => {
    return (req, res, next) => {
        try {
            if (typeof validator === "function") {
                const error = validator(req);
                if (error) {
                    throw new ErrorHandler(error, 400);
                }
            } else if (validator && typeof validator.validate === "function") {
                const { error } = validator.validate(req);
                if (error) {
                    throw new ErrorHandler(error.message || "Validation failed", 400);
                }
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};

export default validate;
