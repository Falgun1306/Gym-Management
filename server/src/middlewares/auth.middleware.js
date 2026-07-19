import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import asyncHandler from "./asyncHandler.middleware.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";


const auth = asyncHandler(async (req, res, next) => {

    const token = req.cookies.token;

    if (!token) {
        throw new ErrorHandler("Authentication required", 401);
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
        username: decoded.username,
        role: decoded.role,
    });

    if (!user) {
        throw new ErrorHandler("User not found", 404);
    }

    req.user = user;
    next();
});

export default auth;