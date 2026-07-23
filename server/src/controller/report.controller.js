import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import reportService from "../services/report.service.js";

const getRevenueReport = asyncHandler(async (req, res) => {
    const data = await reportService.getRevenueReport(req.query);
    res.status(200).json(new ApiResponse(200, data, "Revenue report generated successfully"));
});

const getMembershipReport = asyncHandler(async (req, res) => {
    const data = await reportService.getMembershipReport();
    res.status(200).json(new ApiResponse(200, data, "Membership report generated successfully"));
});

const getTrainerReport = asyncHandler(async (req, res) => {
    const data = await reportService.getTrainerReport();
    res.status(200).json(new ApiResponse(200, data, "Trainer report generated successfully"));
});

const getMemberGrowthReport = asyncHandler(async (req, res) => {
    const data = await reportService.getMemberGrowthReport();
    res.status(200).json(new ApiResponse(200, data, "Member growth report generated successfully"));
});

export {
    getRevenueReport,
    getMembershipReport,
    getTrainerReport,
    getMemberGrowthReport,
};
