/**
 * Admin Controller Tests — All admin endpoints & operations
 *
 * Routes tested:
 *   GET    /api/v1/admins/me
 *   PATCH  /api/v1/admins/me
 *   GET    /api/v1/admins/dashboard
 *   PATCH  /api/v1/admins/trainers/:id
 *   DELETE /api/v1/admins/trainers/:id
 *   GET    /api/v1/admins/members
 *   GET    /api/v1/admins/members/:id
 *   PATCH  /api/v1/admins/members/:id
 *   DELETE /api/v1/admins/members/:id
 *   PATCH  /api/v1/admins/members/:memberId/assign-trainer
 *   PATCH  /api/v1/admins/members/:memberId/remove-trainer
 *   POST   /api/v1/admins/membership-plans
 *   GET    /api/v1/admins/membership-plans
 *   PATCH  /api/v1/admins/membership-plans/:id
 *   DELETE /api/v1/admins/membership-plans/:id
 *   GET    /api/v1/admins/memberships
 *   GET    /api/v1/admins/memberships/:id
 *   GET    /api/v1/admins/payments
 *   GET    /api/v1/admins/payments/:id
 *   GET    /api/v1/admins/attendance
 *   GET    /api/v1/admins/complaints
 *   PATCH  /api/v1/admins/complaints/:id
 *   POST   /api/v1/admins/gym-classes
 *   PATCH  /api/v1/admins/gym-classes/:id
 *   DELETE /api/v1/admins/gym-classes/:id
 */
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Prisma Mock ────────────────────────────────────────────────────────────

const createModelMock = () => ({
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    count: jest.fn(), aggregate: jest.fn(), upsert: jest.fn(),
    deleteMany: jest.fn(), updateMany: jest.fn(), createMany: jest.fn(),
});

const prismaMock = {
    user: createModelMock(), member: createModelMock(), trainer: createModelMock(),
    trainerApplication: createModelMock(), membership: createModelMock(),
    membershipPlan: createModelMock(), payment: createModelMock(),
    attendance: createModelMock(), exercise: createModelMock(),
    workoutAssignment: createModelMock(), workoutPlan: createModelMock(),
    workoutPlanExercise: createModelMock(), dietPlan: createModelMock(),
    dietAssignment: createModelMock(), progressLog: createModelMock(),
    gymClass: createModelMock(), classBooking: createModelMock(),
    trainerSchedule: createModelMock(), equipment: createModelMock(),
    notification: createModelMock(), complaint: createModelMock(),
    $transaction: jest.fn((fn) => (typeof fn === "function" ? fn(prismaMock) : Promise.all(fn))),
    $connect: jest.fn(), $disconnect: jest.fn(),
};

jest.unstable_mockModule(resolve(__dirname, "../src/config/prisma.js"), () => ({
    default: prismaMock,
}));

const { app } = await import(resolve(__dirname, "../src/app.js"));
const supertest = (await import("supertest")).default;
const jwt = (await import("jsonwebtoken")).default;
const request = supertest(app);

// ─── Helpers ────────────────────────────────────────────────────────────────

const createAdminUser = (o = {}) => ({ id: "admin-1", username: "admin", email: "admin@gym.com", role: "ADMIN", createdAt: new Date(), ...o });
const createMemberRecord = (o = {}) => ({ id: "m1", userId: "u1", firstName: "John", lastName: "Doe", phone: "1234567890", gender: "MALE", trainerId: null, joinedAt: new Date(), ...o });
const createTrainerRecord = (o = {}) => ({ id: "tr1", userId: "u2", firstName: "Alex", lastName: "Fit", phone: "9876543210", gender: "MALE", specialization: "STRENGTH", salary: 25000, ...o });

const token = (user) => jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
const auth = (req, user) => req.set("Cookie", [`token=${token(user)}`]);

const resetAll = () => {
    for (const m of Object.values(prismaMock)) {
        if (typeof m === "object" && m !== null) {
            for (const fn of Object.values(m)) { if (typeof fn?.mockReset === "function") fn.mockReset(); }
        }
    }
    prismaMock.$transaction.mockImplementation((fn) => typeof fn === "function" ? fn(prismaMock) : Promise.all(fn));
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. OWN PROFILE & DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════

describe("Admin Profile & Dashboard", () => {
    const adminUser = createAdminUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(adminUser); });

    it("GET /admins/me — get admin profile", async () => {
        const res = await auth(request.get("/api/v1/admins/me"), adminUser);
        expect(res.status).toBe(200);
        expect(res.body.data.username).toBe("admin");
    });

    it("PATCH /admins/me — update admin profile", async () => {
        prismaMock.user.findUnique
            .mockResolvedValueOnce(adminUser) // auth middleware
            .mockResolvedValueOnce(null);     // username uniqueness check
        prismaMock.user.update.mockResolvedValue({ ...adminUser, username: "newadmin" });

        const res = await auth(request.patch("/api/v1/admins/me").send({ username: "newadmin" }), adminUser);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("Profile updated successfully");
    });

    it("GET /admins/dashboard — get dashboard statistics", async () => {
        prismaMock.member.count.mockResolvedValue(100);
        prismaMock.trainer.count.mockResolvedValue(10);
        prismaMock.membership.count.mockResolvedValue(80);
        prismaMock.payment.aggregate.mockResolvedValue({ _sum: { amount: 150000 } });
        prismaMock.payment.count.mockResolvedValue(5);
        prismaMock.attendance.count.mockResolvedValue(45);

        const res = await auth(request.get("/api/v1/admins/dashboard"), adminUser);
        expect(res.status).toBe(200);
        expect(res.body.data.totalMembers).toBe(100);
        expect(res.body.data.monthlyRevenue).toBe(150000);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. TRAINER MANAGEMENT (Update & Remove)
// ═════════════════════════════════════════════════════════════════════════════

describe("Admin Trainer Management", () => {
    const adminUser = createAdminUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(adminUser); });

    it("PATCH /admins/trainers/:id — update trainer details", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.trainer.update.mockResolvedValue(createTrainerRecord({ salary: 35000 }));

        const res = await auth(request.patch("/api/v1/admins/trainers/tr1").send({ salary: 35000 }), adminUser);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("Trainer updated successfully");
    });

    it("DELETE /admins/trainers/:id — remove trainer and revert role to MEMBER", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.trainer.delete.mockResolvedValue({});
        prismaMock.user.update.mockResolvedValue({});

        const res = await auth(request.delete("/api/v1/admins/trainers/tr1"), adminUser);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("reverted to MEMBER");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. MEMBER MANAGEMENT (Update, Delete, Assign/Remove Trainer)
// ═════════════════════════════════════════════════════════════════════════════

describe("Admin Member Management", () => {
    const adminUser = createAdminUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(adminUser); });

    it("PATCH /admins/members/:id — update member profile", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMemberRecord());
        prismaMock.member.update.mockResolvedValue(createMemberRecord({ firstName: "Updated" }));

        const res = await auth(request.patch("/api/v1/admins/members/m1").send({ firstName: "Updated" }), adminUser);
        expect(res.status).toBe(200);
    });

    it("DELETE /admins/members/:id — delete member profile", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMemberRecord());
        prismaMock.member.delete.mockResolvedValue({});

        const res = await auth(request.delete("/api/v1/admins/members/m1"), adminUser);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("deleted successfully");
    });

    it("PATCH /admins/members/:memberId/assign-trainer — assign trainer to member", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMemberRecord());
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.member.update.mockResolvedValue(createMemberRecord({ trainerId: "tr1" }));

        const res = await auth(request.patch("/api/v1/admins/members/m1/assign-trainer").send({ trainerId: "tr1" }), adminUser);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("assigned to member successfully");
    });

    it("PATCH /admins/members/:memberId/remove-trainer — remove trainer from member", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMemberRecord({ trainerId: "tr1" }));
        prismaMock.member.update.mockResolvedValue(createMemberRecord({ trainerId: null }));

        const res = await auth(request.patch("/api/v1/admins/members/m1/remove-trainer"), adminUser);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("Trainer removed from member successfully");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. MEMBERSHIP PLAN MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

describe("Admin Membership Plans", () => {
    const adminUser = createAdminUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(adminUser); });

    it("POST /admins/membership-plans — create new plan", async () => {
        prismaMock.membershipPlan.findUnique.mockResolvedValue(null);
        prismaMock.membershipPlan.create.mockResolvedValue({ id: "p1", name: "Gold Plan", price: 100 });

        const res = await auth(request.post("/api/v1/admins/membership-plans").send({
            name: "Gold Plan", durationMonths: 12, price: 100,
        }), adminUser);

        expect(res.status).toBe(201);
        expect(res.body.message).toContain("created successfully");
    });

    it("GET /admins/membership-plans — list all plans", async () => {
        prismaMock.membershipPlan.findMany.mockResolvedValue([]);
        const res = await auth(request.get("/api/v1/admins/membership-plans"), adminUser);
        expect(res.status).toBe(200);
    });

    it("DELETE /admins/membership-plans/:id — soft delete if has active memberships", async () => {
        prismaMock.membershipPlan.findUnique.mockResolvedValue({ id: "p1", _count: { memberships: 5 } });
        prismaMock.membershipPlan.update.mockResolvedValue({ id: "p1", isActive: false });

        const res = await auth(request.delete("/api/v1/admins/membership-plans/p1"), adminUser);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("deactivated instead of deleted");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. PAYMENTS, COMPLAINTS & GYM CLASSES
// ═════════════════════════════════════════════════════════════════════════════

describe("Admin Payments, Complaints & Gym Classes", () => {
    const adminUser = createAdminUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(adminUser); });

    it("GET /admins/payments — list payments", async () => {
        prismaMock.payment.findMany.mockResolvedValue([]);
        prismaMock.payment.count.mockResolvedValue(0);

        const res = await auth(request.get("/api/v1/admins/payments"), adminUser);
        expect(res.status).toBe(200);
    });

    it("PATCH /admins/complaints/:id — resolve complaint", async () => {
        prismaMock.complaint.findUnique.mockResolvedValue({ id: "c1", status: "OPEN" });
        prismaMock.complaint.update.mockResolvedValue({ id: "c1", status: "RESOLVED" });

        const res = await auth(request.patch("/api/v1/admins/complaints/c1").send({ status: "RESOLVED" }), adminUser);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("updated to RESOLVED");
    });

    it("POST /admins/gym-classes — create gym class", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.gymClass.create.mockResolvedValue({ id: "gc1", title: "Zumba" });

        const res = await auth(request.post("/api/v1/admins/gym-classes").send({
            trainerId: "tr1", title: "Zumba", capacity: 20,
            startTime: "2026-08-01T10:00:00Z", endTime: "2026-08-01T11:00:00Z",
        }), adminUser);

        expect(res.status).toBe(201);
        expect(res.body.message).toContain("Gym class created successfully");
    });
});
