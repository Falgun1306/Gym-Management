import ErrorHandler from "../utility/ErrorHandler.utility.js";

/**
 * Role-based authorization middleware.
 * Must be used AFTER the auth middleware (requires req.user).
 * 
 * @param  {...string} roles - Allowed roles (e.g., "ADMIN", "TRAINER")
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new ErrorHandler("Authentication required", 401);
            }

            if (!roles.includes(req.user.role)) {
                throw new ErrorHandler("Access denied: insufficient permissions", 403);
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

export default authorize;
