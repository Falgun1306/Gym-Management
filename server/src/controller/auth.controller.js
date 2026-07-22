import argon2 from "argon2";
import prisma from "../config/prisma.js";
import cookieOptions from "../utility/cookieOptions.utility.js";
import generateToken from "../utility/generateToken.utility.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

const register = asyncHandler(async (req, res) => {
    const { username, password, confirmpassword, email} = req.body;

    if (!username || !password || !confirmpassword || !email) {
        throw new ErrorHandler("All fields are required", 400);
    }

    if (password !== confirmpassword) {
        throw new ErrorHandler("Passwords do not match", 400);
    }

    const userWithEmail = await prisma.user.findUnique({
        where: { email }
    });

    if (userWithEmail) {
        throw new ErrorHandler("Email already exists", 400);
    }

    const userWithUsername = await prisma.user.findUnique({
        where: { username }
    });

    if (userWithUsername) {
        throw new ErrorHandler("Username already exists", 400);
    }

    const hashedPassword = await argon2.hash(password);

    const newUser = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
        }
    });

    const token = generateToken({
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
    });

    res
        .status(201)
        .cookie("token", token, cookieOptions)
        .json({
            success: true,
            message: "User created successfully",
        });
});

const login = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
        throw new ErrorHandler("Username or Email and password are required", 400);
    }

    const user = await prisma.user.findUnique({
        where: username ? { username } : { email }
    });

    if (!user) {
        throw new ErrorHandler("Invalid username/email or password", 401);
    }

    const isValidPassword = await argon2.verify(user.password, password);

    if (!isValidPassword) {
        throw new ErrorHandler("Invalid username/email or password", 401);
    }

    const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role
    });

    res
        .status(200)
        .cookie("token", token, cookieOptions)
        .json({
            success: true,
            message: "User logged in successfully",
        });
});

const logout = asyncHandler(async (req, res) => {
    res.clearCookie("token", cookieOptions);

    res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
});

export { register, login, logout };