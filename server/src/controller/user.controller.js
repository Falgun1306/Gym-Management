import argon2 from "argon2";
import User from "../models/user.model.js";
import cookieOptions from "../utility/cookieOptions.utility.js";
import generateToken from "../utility/generateToken.utility.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

const register = asyncHandler(async (req, res) => {
    const { username, password, confirmpassword, email, role } = req.body;

    if (!username || !password || !email || !role || !confirmpassword) {
        throw new ErrorHandler("All fields are required", 400);
    }

    if (password !== confirmpassword) {
        throw new ErrorHandler("Password do not match", 400);
    }

    const userWithMail = await User.findOne({ email });
    const userWithusername = await User.findOne({ username });
    if (userWithMail || userWithusername) {
        throw new ErrorHandler("User already exists", 400);
    }

    const hashed = await argon2.hash(password);

    const newUser = await User.create({
        username,
        password: hashed,
        confirmpassword: hashed,
        email,
        role
    });

    const token = generateToken({ username: newUser.username, role: newUser.role });
    res.status(201)
        .cookie("token", token, cookieOptions)
        .json({
            success: true,
            message: "User created successfully",
        });
});


const login = asyncHandler(async (req, res) => {
    const { username, password, email} = req.body;

    if ((!username && !email) || !password ) {
        throw new ErrorHandler("All fields are required", 400);
    }

    const user = await User.findOne(username ? { username } : { email });
    if (!user) {
        throw new ErrorHandler("username or Email or password invalid", 404);
    }

    const isValidPassword = await argon2.verify(user.password, password);
    if (!isValidPassword) {
        throw new ErrorHandler("username or Email or password invalid", 401);
    }

    const token = generateToken({ username: user.username, role: user.role });
    res.status(201)
        .cookie("token", token, cookieOptions)
        .json({
            success: true,
            message: "User login successfully",
        });
});

const logout = asyncHandler(async (req, res) => {
    res.clearCookie("token", cookieOptions);
    res.status(200).json({
        success: true,
        message: "User logout successfully",
    });
})

export { register, login, logout };