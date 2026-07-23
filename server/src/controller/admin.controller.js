import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import adminService from "../services/admin.service.js";

import { listAttendance } from "./attendance.controller.js";
import { listComplaints, resolveComplaint } from "./complaint.controller.js";
import { createGymClass, updateGymClass, deleteGymClass } from "./gymClass.controller.js";
import { getDashboard } from "./dashboard.controller.js";
import { listTrainers, getTrainerById } from "./trainer.controller.js";

const getMyProfile = asyncHandler(async (req, res) => {
    const user = await adminService.getMyProfile(req.user.id);
    res.status(200).json(new ApiResponse(200, user));
});

const updateMyProfile = asyncHandler(async (req, res) => {
    const updatedUser = await adminService.updateMyProfile(req.user.id, req.body);
    res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

const listTrainerApplications = asyncHandler(async (req, res) => {
    const { applications, pagination } = await adminService.listTrainerApplications(req.query);
    res.status(200).json(new ApiResponse(200, applications, "Trainer applications retrieved", pagination));
});

const getTrainerApplicationById = asyncHandler(async (req, res) => {
    const application = await adminService.getTrainerApplicationById(req.params.id);
    res.status(200).json(new ApiResponse(200, application));
});

const approveTrainerApplication = asyncHandler(async (req, res) => {
    const trainer = await adminService.approveTrainerApplication(req.user.id, req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, trainer, "Application approved. Trainer profile created."));
});

const rejectTrainerApplication = asyncHandler(async (req, res) => {
    const updatedApplication = await adminService.rejectTrainerApplication(req.user.id, req.params.id, req.body.rejectionReason);
    res.status(200).json(new ApiResponse(200, updatedApplication, "Application rejected"));
});

const directPromoteToTrainer = asyncHandler(async (req, res) => {
    const trainer = await adminService.directPromoteToTrainer(req.body);
    res.status(201).json(new ApiResponse(201, trainer, "Member promoted to Trainer successfully"));
});

const updateTrainer = asyncHandler(async (req, res) => {
    const updatedTrainer = await adminService.updateTrainer(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, updatedTrainer, "Trainer updated successfully"));
});

const removeTrainer = asyncHandler(async (req, res) => {
    await adminService.removeTrainer(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Trainer removed and role reverted to MEMBER"));
});

const listMembers = asyncHandler(async (req, res) => {
    const { members, pagination } = await adminService.listMembers(req.query);
    res.status(200).json(new ApiResponse(200, members, "Members retrieved", pagination));
});

const getMemberById = asyncHandler(async (req, res) => {
    const member = await adminService.getMemberById(req.params.id);
    res.status(200).json(new ApiResponse(200, member));
});

const updateMember = asyncHandler(async (req, res) => {
    const updatedMember = await adminService.updateMember(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, updatedMember, "Member updated successfully"));
});

const deleteMember = asyncHandler(async (req, res) => {
    await adminService.deleteMember(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Member deleted successfully"));
});

const createMembershipPlan = asyncHandler(async (req, res) => {
    const plan = await adminService.createMembershipPlan(req.body);
    res.status(201).json(new ApiResponse(201, plan, "Membership plan created successfully"));
});

const listMembershipPlans = asyncHandler(async (req, res) => {
    const plans = await adminService.listMembershipPlans();
    res.status(200).json(new ApiResponse(200, plans));
});

const updateMembershipPlan = asyncHandler(async (req, res) => {
    const updatedPlan = await adminService.updateMembershipPlan(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, updatedPlan, "Membership plan updated successfully"));
});

const deleteMembershipPlan = asyncHandler(async (req, res) => {
    const result = await adminService.deleteMembershipPlan(req.params.id);
    res.status(200).json(new ApiResponse(200, null, result.message));
});

const listPayments = asyncHandler(async (req, res) => {
    const { payments, pagination } = await adminService.listPayments(req.query);
    res.status(200).json(new ApiResponse(200, payments, "Payments retrieved", pagination));
});

const getPaymentById = asyncHandler(async (req, res) => {
    const payment = await adminService.getPaymentById(req.params.id);
    res.status(200).json(new ApiResponse(200, payment));
});

const assignTrainerToMember = asyncHandler(async (req, res) => {
    const updatedMember = await adminService.assignTrainerToMember(req.params.memberId, req.body.trainerId);
    res.status(200).json(new ApiResponse(200, updatedMember, "Trainer assigned to member successfully"));
});

const removeTrainerFromMember = asyncHandler(async (req, res) => {
    const updatedMember = await adminService.removeTrainerFromMember(req.params.memberId);
    res.status(200).json(new ApiResponse(200, updatedMember, "Trainer removed from member successfully"));
});

const listMemberships = asyncHandler(async (req, res) => {
    const { memberships, pagination } = await adminService.listMemberships(req.query);
    res.status(200).json(new ApiResponse(200, memberships, "Memberships retrieved", pagination));
});

const getMembershipById = asyncHandler(async (req, res) => {
    const membership = await adminService.getMembershipById(req.params.id);
    res.status(200).json(new ApiResponse(200, membership));
});

export {
    getMyProfile,
    updateMyProfile,
    listTrainerApplications,
    getTrainerApplicationById,
    approveTrainerApplication,
    rejectTrainerApplication,
    directPromoteToTrainer,
    updateTrainer,
    removeTrainer,
    assignTrainerToMember,
    removeTrainerFromMember,
    listMembers,
    getMemberById,
    updateMember,
    deleteMember,
    createMembershipPlan,
    listMembershipPlans,
    updateMembershipPlan,
    deleteMembershipPlan,
    listMemberships,
    getMembershipById,
    listPayments,
    getPaymentById,
    listAttendance,
    listComplaints,
    resolveComplaint,
    createGymClass,
    updateGymClass,
    deleteGymClass,
    getDashboard,
    listTrainers,
    getTrainerById,
};
