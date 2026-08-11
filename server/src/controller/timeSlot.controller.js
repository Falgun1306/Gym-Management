import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import timeSlotService from "../services/timeSlot.service.js";

export const getMyTimeSlots = asyncHandler(async (req, res) => {
    const result = await timeSlotService.getMyTimeSlots(req.user.id);
    res.status(200).json(new ApiResponse(200, result, "Time slots fetched successfully"));
});

export const setMyTimeSlot = asyncHandler(async (req, res) => {
    const slot = await timeSlotService.setMyTimeSlot(req.user.id, req.body);
    res.status(201).json(new ApiResponse(201, slot, "Time slot added successfully"));
});

export const updateMyTimeSlot = asyncHandler(async (req, res) => {
    const slot = await timeSlotService.updateMyTimeSlot(req.user.id, req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, slot, "Time slot updated successfully"));
});

export const deleteMyTimeSlot = asyncHandler(async (req, res) => {
    const result = await timeSlotService.deleteMyTimeSlot(req.user.id, req.params.id);
    res.status(200).json(new ApiResponse(200, result, "Time slot deleted successfully"));
});

export const getTrainerTimeSlotOverview = asyncHandler(async (req, res) => {
    const overview = await timeSlotService.getTrainerTimeSlotOverview(req.user, req.query);
    res.status(200).json(new ApiResponse(200, overview, "Time slot overview fetched successfully"));
});

export const createAdvisory = asyncHandler(async (req, res) => {
    const advisory = await timeSlotService.createAdvisory(req.user, req.body);
    res.status(201).json(new ApiResponse(201, advisory, "Advisory created successfully"));
});

export const deleteAdvisory = asyncHandler(async (req, res) => {
    const result = await timeSlotService.deleteAdvisory(req.user, req.params.id);
    res.status(200).json(new ApiResponse(200, result, "Advisory deleted successfully"));
});
