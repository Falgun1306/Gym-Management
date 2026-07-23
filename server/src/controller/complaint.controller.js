import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import complaintService from "../services/complaint.service.js";

const createComplaint = asyncHandler(async (req, res) => {
    const complaint = await complaintService.createComplaint(req.user.id, req.body);
    res.status(201).json(new ApiResponse(201, complaint, "Complaint submitted successfully"));
});

const listComplaints = asyncHandler(async (req, res) => {
    const { complaints, pagination } = await complaintService.listComplaints(req.user, req.query);
    res.status(200).json(new ApiResponse(200, complaints, "Complaints retrieved successfully", pagination));
});

const getComplaintById = asyncHandler(async (req, res) => {
    const complaint = await complaintService.getComplaintById(req.user, req.params.id);
    res.status(200).json(new ApiResponse(200, complaint));
});

const resolveComplaint = asyncHandler(async (req, res) => {
    const updatedComplaint = await complaintService.resolveComplaint(req.params.id, req.body.status);
    res.status(200).json(new ApiResponse(200, updatedComplaint, `Complaint status updated to ${req.body.status}`));
});

const deleteComplaint = asyncHandler(async (req, res) => {
    await complaintService.deleteComplaint(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Complaint deleted successfully"));
});

export {
    createComplaint,
    listComplaints,
    getComplaintById,
    resolveComplaint,
    deleteComplaint,
};
