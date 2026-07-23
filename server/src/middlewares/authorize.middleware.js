import ErrorHandler from "../utility/ErrorHandler.utility.js";

/**
 * Role-based authorization middleware.
 * Must be used AFTER the auth middleware (which sets req.user).
 *
 * @param  {...string} allowedRoles - Roles permitted to access the route (e.g. "ADMIN", "MEMBER")
 * @returns {Function} Express middleware
 *
 * Usage:
 *   router.get("/admin-only", auth, authorize("ADMIN"), handler);
 *   router.get("/staff", auth, authorize("ADMIN", "TRAINER"), handler);
 */
const authorize = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new ErrorHandler("Authentication required", 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ErrorHandler("Access denied: insufficient permissions", 403);
        }

        next();
    };
};

export default authorize;
