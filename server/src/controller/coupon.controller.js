import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import couponService from "../services/coupon.service.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";
import { validateCreateCoupon, validateUpdateCoupon } from "../validations/coupon.validation.js";
import memberRepository from "../repositories/member.repository.js";

// ─── ADMIN: Coupon CRUD ───────────────────────────────────────────────────────

export const createCoupon = asyncHandler(async (req, res) => {
    const error = validateCreateCoupon(req);
    if (error) throw new ErrorHandler(error, 400);

    const coupon = await couponService.createCoupon(req.body);
    res.status(201).json(new ApiResponse(201, coupon, "Coupon created successfully"));
});

export const listCoupons = asyncHandler(async (req, res) => {
    const { coupons, pagination } = await couponService.listCoupons(req.query);
    res.status(200).json(new ApiResponse(200, coupons, "Coupons retrieved", pagination));
});

export const getCouponById = asyncHandler(async (req, res) => {
    const coupon = await couponService.getCouponById(req.params.id);
    res.status(200).json(new ApiResponse(200, coupon));
});

export const updateCoupon = asyncHandler(async (req, res) => {
    const error = validateUpdateCoupon(req);
    if (error) throw new ErrorHandler(error, 400);

    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, coupon, "Coupon updated successfully"));
});

export const deactivateCoupon = asyncHandler(async (req, res) => {
    const coupon = await couponService.deactivateCoupon(req.params.id);
    res.status(200).json(new ApiResponse(200, coupon, "Coupon deactivated"));
});

// ─── MEMBER: Validate Coupon ──────────────────────────────────────────────────

export const validateCoupon = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { amount = 0 } = req.query;

    // Resolve memberId from authenticated user
    const member = await memberRepository.findByUserId(req.user.id);
    if (!member) throw new ErrorHandler("Member profile not found", 404);

    const result = await couponService.validateCoupon(code, member.id, parseFloat(amount));
    res.status(200).json(new ApiResponse(200, result, "Coupon is valid"));
});

// ─── MEMBER: Coupon Usage History ────────────────────────────────────────────

export const getMyCouponUsages = asyncHandler(async (req, res) => {
    const { usages, pagination } = await couponService.getMyCouponUsages(req.user.id, req.query);
    res.status(200).json(new ApiResponse(200, usages, "Coupon usage history", pagination));
});

// ─── MEMBER: Referral Link ────────────────────────────────────────────────────

export const getMyReferralLink = asyncHandler(async (req, res) => {
    const { referralLink, created } = await couponService.getMyReferralLink(req.user.id);
    const statusCode = created ? 201 : 200;
    res.status(statusCode).json(new ApiResponse(statusCode, referralLink, created ? "Referral link created" : "Referral link retrieved"));
});
