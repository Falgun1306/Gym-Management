import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import healthService from "../services/health.service.js";

const healthCheck = asyncHandler(async (req, res) => {
    const data = await healthService.checkHealth();
    res.status(200).json(new ApiResponse(200, data, "Gym Management Backend is healthy"));
});

const databaseStatus = asyncHandler(async (req, res) => {
    try {
        const data = await healthService.checkDatabaseStatus();
        res.status(200).json(new ApiResponse(200, data, "Database connection is healthy"));
    } catch (error) {
        res.status(500).json({
            success: false,
            statusCode: 500,
            status: "DOWN",
            message: "Database connection failed",
            error: error.message,
        });
    }
});

export { healthCheck, databaseStatus };
