import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import {
    createCoupon,
    listCoupons,
    getCouponById,
    updateCoupon,
    deactivateCoupon,
    validateCoupon,
    getMyCouponUsages,
    getMyReferralLink,
} from "../controller/coupon.controller.js";

const router = express.Router();

// ─── Admin Routes (require ADMIN role) ───────────────────────────────────────

router.post("/", auth, authorize("ADMIN"), createCoupon);
router.get("/admin/all", auth, authorize("ADMIN"), listCoupons);
router.get("/admin/:id", auth, authorize("ADMIN"), getCouponById);
router.patch("/admin/:id", auth, authorize("ADMIN"), updateCoupon);
router.delete("/admin/:id", auth, authorize("ADMIN"), deactivateCoupon);

// ─── Member Routes ────────────────────────────────────────────────────────────

// NOTE: specific paths must come BEFORE /:code to avoid route collision
router.get("/my-referral-link", auth, authorize("MEMBER"), getMyReferralLink);
router.get("/my-usages", auth, authorize("MEMBER", "ADMIN"), getMyCouponUsages);
router.get("/validate/:code", auth, authorize("MEMBER", "ADMIN"), validateCoupon);

export default router;
