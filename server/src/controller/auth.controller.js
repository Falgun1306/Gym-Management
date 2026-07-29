import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import cookieOptions from "../utility/cookieOptions.utility.js";
import authService from "../services/auth.service.js";

const register = asyncHandler(async (req, res) => {
    const { token, user } = await authService.register(req.body);

    res
        .status(201)
        .cookie("token", token, cookieOptions)
        .json(new ApiResponse(201, { user, token }, "User created successfully"));
});

const login = asyncHandler(async (req, res) => {
    const { token, user } = await authService.login(req.body);

    res
        .status(200)
        .cookie("token", token, cookieOptions)
        .json(new ApiResponse(200, { user, token }, "User logged in successfully"));
});

const logout = asyncHandler(async (req, res) => {
    res.clearCookie("token", cookieOptions);

    res
        .status(200)
        .json(new ApiResponse(200, null, "User logged out successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json(new ApiResponse(200, null, result.message));
});

const resetPassword = asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    res.status(200).json(new ApiResponse(200, null, result.message));
});

export { register, login, logout, forgotPassword, resetPassword };