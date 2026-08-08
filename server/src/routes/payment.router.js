import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import {
    createPayment,
    verifyPayment,
    webhook,
    failPayment,
    retryPayment,
    refundPayment,
    downloadInvoice,
    getRevenueReport,
    getMemberPayments,
    getAllPayments,
    getPaymentById,
} from "../controller/payment.controller.js";

const router = express.Router();

// ─── Public (signature-verified, no JWT auth) ────────────────────────────────
router.post("/webhook", webhook);

// ─── Authenticated Routes ────────────────────────────────────────────────────

// Admin only
router.post("/create", auth, authorize("ADMIN"), createPayment);
router.post("/:id/refund", auth, authorize("ADMIN"), refundPayment);
router.get("/revenue", auth, authorize("ADMIN"), getRevenueReport);
router.get("/all", auth, authorize("ADMIN"), getAllPayments);

// Admin or authenticated member (ownership enforced in controller)
router.post("/verify", auth, authorize("ADMIN", "MEMBER"), verifyPayment);
router.post("/:id/fail", auth, authorize("ADMIN", "MEMBER"), failPayment);
router.post("/:id/retry", auth, authorize("ADMIN", "MEMBER"), retryPayment);
router.get("/:id/invoice", auth, authorize("ADMIN", "MEMBER"), downloadInvoice);
router.get("/member/:memberId", auth, authorize("ADMIN", "MEMBER"), getMemberPayments);
router.get("/:id", auth, authorize("ADMIN", "MEMBER"), getPaymentById);

export default router;
