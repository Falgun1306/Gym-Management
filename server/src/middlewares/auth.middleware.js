import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import asyncHandler from "./asyncHandler.middleware.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

const auth = asyncHandler(async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        throw new ErrorHandler("Authentication required", 401);
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new ErrorHandler("Invalid or expired token", 401);
    }

    const user = await prisma.user.findUnique({
        where: {
            id: decoded.id,
        },
    });

    if (!user) {
        throw new ErrorHandler("User not found", 404);
    }

    req.user = user;

    next();
});

export default auth;