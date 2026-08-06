import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import memberService from "../services/member.service.js";

import { getMyWorkoutPlans } from "./workout.controller.js";
import { getMyDietPlans } from "./diet.controller.js";
import { getMyNotifications, markNotificationRead } from "./notification.controller.js";
import { getMyAttendance } from "./attendance.controller.js";
import { createComplaint } from "./complaint.controller.js";
import { listGymClasses, bookGymClass, cancelGymClass } from "./gymClass.controller.js";

const getMyProfile = asyncHandler(async (req, res) => {
    const member = await memberService.getMyProfile(req.user.id);
    res.status(200).json(new ApiResponse(200, member));
});

const createMyProfile = asyncHandler(async (req, res) => {
    const newMember = await memberService.createMyProfile(req.user.id, req.body);
    res.status(201).json(new ApiResponse(201, newMember, "Member profile created successfully"));
});

const updateMyProfile = asyncHandler(async (req, res) => {
    const updatedMember = await memberService.updateMyProfile(req.user.id, req.body);
    res.status(200).json(new ApiResponse(200, updatedMember, "Profile updated successfully"));
});

const getMemberById = asyncHandler(async (req, res) => {
    const member = await memberService.getMemberById(req.params.id);
    res.status(200).json(new ApiResponse(200, member));
});

const listMembers = asyncHandler(async (req, res) => {
    const { members, pagination } = await memberService.listMembers(req.query);
    res.status(200).json(new ApiResponse(200, members, "Members retrieved successfully", pagination));
});

const getMyPayments = asyncHandler(async (req, res) => {
    const { payments, pagination } = await memberService.getMyPayments(req.user.id, req.query);
    res.status(200).json(new ApiResponse(200, payments, "Payment history retrieved", pagination));
});

const getMySubscriptions = asyncHandler(async (req, res) => {
    const subscriptions = await memberService.getMySubscriptions(req.user.id);
    res.status(200).json(new ApiResponse(200, subscriptions));
});

const applyForTrainer = asyncHandler(async (req, res) => {
    const application = await memberService.applyForTrainer(req.user, req.body);
    res.status(201).json(new ApiResponse(201, application, "Trainer application submitted successfully. Please wait for admin review."));
});

const getMyApplications = asyncHandler(async (req, res) => {
    const applications = await memberService.getMyApplications(req.user.id);
    res.status(200).json(new ApiResponse(200, applications));
});

const freezeMembership = asyncHandler(async (req, res) => {
    const membership = await memberService.freezeMembership(req.user.id, req.params.membershipId, req.body);
    res.status(200).json(new ApiResponse(200, membership, "Membership frozen successfully"));
});

const unfreezeMembership = asyncHandler(async (req, res) => {
    const membership = await memberService.unfreezeMembership(req.user.id, req.params.membershipId);
    res.status(200).json(new ApiResponse(200, membership, "Membership resumed successfully"));
});

const getMyProgress = asyncHandler(async (req, res) => {
    const progress = await memberService.getMyProgress(req.user.id);
    res.status(200).json(new ApiResponse(200, progress));
});

const logMyProgress = asyncHandler(async (req, res) => {
    const log = await memberService.logMyProgress(req.user.id, req.body);
    res.status(201).json(new ApiResponse(201, log, "Progress log added successfully"));
});

const getAvailableMembershipPlans = asyncHandler(async (req, res) => {
    const plans = await memberService.getAvailableMembershipPlans();
    res.status(200).json(new ApiResponse(200, plans));
});

const purchaseMembership = asyncHandler(async (req, res) => {
    const { planId, paymentMethod } = req.body;
    if (!planId) {
        throw new ErrorHandler("Plan ID is required", 400);
    }
    const membership = await memberService.purchaseMembership(req.user.id, planId, paymentMethod);
    res.status(201).json(new ApiResponse(201, membership, "Membership purchased successfully"));
});

export {
    getMyProfile,
    createMyProfile,
    updateMyProfile,
    getMemberById,
    listMembers,
    getMyAttendance,
    getMyPayments,
    getMySubscriptions,
    getMyWorkoutPlans,
    getMyDietPlans,
    getMyProgress,
    logMyProgress,
    listGymClasses,
    bookGymClass,
    cancelGymClass,
    createComplaint,
    getMyNotifications,
    markNotificationRead,
    applyForTrainer,
    getMyApplications,
    freezeMembership,
    unfreezeMembership,
    getAvailableMembershipPlans,
    purchaseMembership,
};
