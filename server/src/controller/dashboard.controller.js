import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import dashboardService from "../services/dashboard.service.js";

const getAdminDashboard = asyncHandler(async (req, res) => {
    const data = await dashboardService.getAdminDashboard();
    res.status(200).json(new ApiResponse(200, data, "Admin dashboard statistics retrieved"));
});

const getTrainerDashboard = asyncHandler(async (req, res) => {
    const data = await dashboardService.getTrainerDashboard(req.user.id);
    res.status(200).json(new ApiResponse(200, data, "Trainer dashboard statistics retrieved"));
});

const getMemberDashboard = asyncHandler(async (req, res) => {
    const data = await dashboardService.getMemberDashboard(req.user.id);
    res.status(200).json(new ApiResponse(200, data, "Member dashboard statistics retrieved"));
});

// Backward compatibility alias
const getDashboard = getAdminDashboard;

export {
    getAdminDashboard,
    getTrainerDashboard,
    getMemberDashboard,
    getDashboard,
};
