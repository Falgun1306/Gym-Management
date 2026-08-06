import express from "express";
import auth from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import {
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
    assignMembership,
    listMemberships,
    getMembershipById,
    unfreezeMembership,
    listPayments,
    getPaymentById,
    recordPayment,
    approvePendingPayment,
    listAttendance,
    listComplaints,
    resolveComplaint,
    createGymClass,
    updateGymClass,
    deleteGymClass,
    getDashboard,
    listTrainers,
    getTrainerById,
} from "../controller/admin.controller.js";

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(auth, authorize("ADMIN"));

// ─── Own Profile ─────────────────────────────────────────────────────────────

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);

// ─── Dashboard ───────────────────────────────────────────────────────────────

router.get("/dashboard", getDashboard);

// ─── Trainer Application Management ────────────────────────────────────────

router.get("/trainer-applications", listTrainerApplications);
router.get("/trainer-applications/:id", getTrainerApplicationById);
router.patch("/trainer-applications/:id/approve", approveTrainerApplication);
router.patch("/trainer-applications/:id/reject", rejectTrainerApplication);

// ─── Trainer Management ─────────────────────────────────────────────────────

router.get("/trainers", listTrainers);
router.get("/trainers/:id", getTrainerById);
router.post("/trainers/promote", directPromoteToTrainer);
router.patch("/trainers/:id", updateTrainer);
router.delete("/trainers/:id", removeTrainer);

// ─── Member Management ──────────────────────────────────────────────────────

router.get("/members", listMembers);
router.get("/members/:id", getMemberById);
router.patch("/members/:id", updateMember);
router.delete("/members/:id", deleteMember);
router.patch("/members/:memberId/assign-trainer", assignTrainerToMember);
router.patch("/members/:memberId/remove-trainer", removeTrainerFromMember);

// ─── Membership Plan Management ─────────────────────────────────────────────

router.post("/membership-plans", createMembershipPlan);
router.get("/membership-plans", listMembershipPlans);
router.patch("/membership-plans/:id", updateMembershipPlan);
router.delete("/membership-plans/:id", deleteMembershipPlan);

// ─── Membership Management (Individual Memberships) ─────────────────────────

router.post("/memberships", assignMembership);
router.get("/memberships", listMemberships);
router.get("/memberships/:id", getMembershipById);
router.patch("/memberships/:id/unfreeze", unfreezeMembership);

// ─── Payment Management ─────────────────────────────────────────────────────

router.get("/payments", listPayments);
router.get("/payments/:id", getPaymentById);
router.post("/payments", recordPayment);
router.patch("/payments/:id/approve", approvePendingPayment);

// ─── Attendance ──────────────────────────────────────────────────────────────

router.get("/attendance", listAttendance);

// ─── Complaints ──────────────────────────────────────────────────────────────

router.get("/complaints", listComplaints);
router.patch("/complaints/:id", resolveComplaint);

// ─── Gym Class Management ───────────────────────────────────────────────────

router.post("/gym-classes", createGymClass);
router.patch("/gym-classes/:id", updateGymClass);
router.delete("/gym-classes/:id", deleteGymClass);

export default router;
