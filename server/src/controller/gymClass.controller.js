import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import gymClassService from "../services/gymClass.service.js";

const createGymClass = asyncHandler(async (req, res) => {
    const gymClass = await gymClassService.createGymClass(req.body);
    res.status(201).json(new ApiResponse(201, gymClass, "Gym class created successfully"));
});

const listGymClasses = asyncHandler(async (req, res) => {
    const { classes, pagination } = await gymClassService.listGymClasses(req.query);
    res.status(200).json(new ApiResponse(200, classes, "Gym classes retrieved successfully", pagination));
});

const getClassById = asyncHandler(async (req, res) => {
    const gymClass = await gymClassService.getClassById(req.params.id);
    res.status(200).json(new ApiResponse(200, gymClass));
});

const updateGymClass = asyncHandler(async (req, res) => {
    const updatedClass = await gymClassService.updateGymClass(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, updatedClass, "Gym class updated successfully"));
});

const deleteGymClass = asyncHandler(async (req, res) => {
    await gymClassService.deleteGymClass(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Gym class deleted successfully"));
});

const bookClass = asyncHandler(async (req, res) => {
    const booking = await gymClassService.bookClass(req.user.id, req.params.classId);
    res.status(201).json(new ApiResponse(201, booking, "Class booked successfully"));
});

const cancelBooking = asyncHandler(async (req, res) => {
    const booking = await gymClassService.cancelBooking(req.user.id, req.params.bookingId);
    res.status(200).json(new ApiResponse(200, booking, "Booking cancelled successfully"));
});

const getClassBookings = asyncHandler(async (req, res) => {
    const bookings = await gymClassService.getClassBookings(req.user.id, req.query);
    res.status(200).json(new ApiResponse(200, bookings));
});

// Backward compatibility aliases
const bookGymClass = bookClass;
const cancelGymClass = cancelBooking;
const markClassAttendance = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, null, "Attendance marked"));
});

export {
    createGymClass,
    listGymClasses,
    getClassById,
    updateGymClass,
    deleteGymClass,
    bookClass,
    cancelBooking,
    getClassBookings,
    bookGymClass,
    cancelGymClass,
    markClassAttendance,
};
