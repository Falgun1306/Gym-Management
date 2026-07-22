import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import {
    getMyProfile,
    updateMyProfile,
    promoteToTrainer,
    updateTrainer,
    removeTrainer,
    listMembers,
    getMemberById,
    updateMember,
    deleteMember,
    createMembershipPlan,
    listMembershipPlans,
    updateMembershipPlan,
    deleteMembershipPlan,
    listPayments,
    getPaymentById,
    getDashboard,
} from "../controller/admin.controller.js";

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(auth, authorize("ADMIN"));

// ─── Own Profile ─────────────────────────────────────────────────────────────

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);

// ─── Dashboard ───────────────────────────────────────────────────────────────

router.get("/dashboard", getDashboard);

// ─── Trainer Management ─────────────────────────────────────────────────────

router.post("/trainers", promoteToTrainer);
router.patch("/trainers/:id", updateTrainer);
router.delete("/trainers/:id", removeTrainer);

// ─── Member Management ──────────────────────────────────────────────────────

router.get("/members", listMembers);
router.get("/members/:id", getMemberById);
router.patch("/members/:id", updateMember);
router.delete("/members/:id", deleteMember);

// ─── Membership Plan Management ─────────────────────────────────────────────

router.post("/membership-plans", createMembershipPlan);
router.get("/membership-plans", listMembershipPlans);
router.patch("/membership-plans/:id", updateMembershipPlan);
router.delete("/membership-plans/:id", deleteMembershipPlan);

// ─── Payment Management ─────────────────────────────────────────────────────

router.get("/payments", listPayments);
router.get("/payments/:id", getPaymentById);

export default router;
