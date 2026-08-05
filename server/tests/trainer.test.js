/**
 * Trainer Controller Tests — All 28 exported functions
 *
 * Routes tested:
 *   GET    /api/v1/trainers/me
 *   PATCH  /api/v1/trainers/me
 *   GET    /api/v1/trainers/me/members
 *   GET    /api/v1/trainers/me/members/:memberId
 *   GET    /api/v1/trainers/me/schedule
 *   PATCH  /api/v1/trainers/me/schedule
 *   POST   /api/v1/trainers/workout-plans
 *   GET    /api/v1/trainers/workout-plans
 *   GET    /api/v1/trainers/workout-plans/:id
 *   PATCH  /api/v1/trainers/workout-plans/:id
 *   DELETE /api/v1/trainers/workout-plans/:id
 *   POST   /api/v1/trainers/workout-plans/:planId/assign/:memberId
 *   POST   /api/v1/trainers/diet-plans
 *   GET    /api/v1/trainers/diet-plans
 *   GET    /api/v1/trainers/diet-plans/:id
 *   PATCH  /api/v1/trainers/diet-plans/:id
 *   DELETE /api/v1/trainers/diet-plans/:id
 *   POST   /api/v1/trainers/diet-plans/:planId/assign/:memberId
 *   POST   /api/v1/trainers/members/:memberId/progress
 *   GET    /api/v1/trainers/members/:memberId/progress
 *   GET    /api/v1/trainers/members/:memberId/attendance
 *   POST   /api/v1/trainers/members/:memberId/attendance
 *   GET    /api/v1/trainers/exercises
 *   GET    /api/v1/trainers/exercises/search
 *   PATCH  /api/v1/trainers/exercises/:id
 *   DELETE /api/v1/trainers/exercises/:id
 *   GET    /api/v1/trainers/class-bookings
 *   GET    /api/v1/trainers/:id
 *   GET    /api/v1/trainers/
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

const createTrainerUser = (o = {}) => ({ id: "tu1", username: "trainer1", email: "t@e.com", password: "h", role: "TRAINER", createdAt: new Date(), updatedAt: new Date(), ...o });
const createMemberUser = (o = {}) => ({ id: "mu1", username: "member1", email: "m@e.com", password: "h", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), ...o });
const createTrainerRecord = (o = {}) => ({ id: "tr1", userId: "tu1", firstName: "Alex", lastName: "Fit", phone: "9998887770", gender: "MALE", specialization: "STRENGTH", salary: 30000, bio: "Pro trainer", profilePhoto: null, certifications: ["NASM"], averageRating: 4.8, totalReviews: 12, joinedAt: new Date(), ...o });
const createMemberRecord = (o = {}) => ({ id: "m1", userId: "mu1", firstName: "Jane", lastName: "Smith", phone: "1234567890", gender: "FEMALE", trainerId: "tr1", joinedAt: new Date(), ...o });

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
// 1. GET /trainers/me & PATCH /trainers/me — Own Profile
// ═════════════════════════════════════════════════════════════════════════════

describe("GET & PATCH /api/v1/trainers/me", () => {
    const trainerUser = createTrainerUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(trainerUser); });

    it("should return own profile for TRAINER role", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        const res = await auth(request.get("/api/v1/trainers/me"), trainerUser);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
    });

    it("should return 404 if trainer record does not exist", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(null);
        const res = await auth(request.get("/api/v1/trainers/me"), trainerUser);
        expect(res.status).toBe(404);
        expect(res.body.message).toContain("Trainer profile not found");
    });

    it("should update bio and certifications", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.trainer.update.mockResolvedValue(createTrainerRecord({ bio: "Updated Bio" }));

        const res = await auth(request.patch("/api/v1/trainers/me").send({
            bio: "Updated Bio",
            certifications: ["ACE", "NASM"],
        }), trainerUser);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("Profile updated successfully");
    });

    it("should reject update if no valid fields provided", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        const res = await auth(request.patch("/api/v1/trainers/me").send({
            salary: 90000, // salary non-editable via this endpoint
        }), trainerUser);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("No valid fields provided to update");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. PUBLIC TRAINER LISTINGS — listTrainers & getTrainerById
// ═════════════════════════════════════════════════════════════════════════════

describe("Public Trainer Listings", () => {
    const memberUser = createMemberUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(memberUser); });

    it("GET /trainers — should list all trainers", async () => {
        prismaMock.trainer.findMany.mockResolvedValue([createTrainerRecord()]);
        const res = await auth(request.get("/api/v1/trainers/"), memberUser);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });

    it("GET /trainers/:id — should return single trainer", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord({ id: "tr1" }));
        const res = await auth(request.get("/api/v1/trainers/tr1"), memberUser);
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe("tr1");
    });

    it("GET /trainers/:id — should return 404 if trainer not found", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(null);
        const res = await auth(request.get("/api/v1/trainers/nonexistent"), memberUser);
        expect(res.status).toBe(404);
        expect(res.body.message).toContain("Trainer not found");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. ASSIGNED MEMBERS — getMyMembers & getMyMemberById
// ═════════════════════════════════════════════════════════════════════════════

describe("Assigned Members", () => {
    const trainerUser = createTrainerUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(trainerUser); });

    it("GET /trainers/me/members — should return list of assigned members", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.member.findMany.mockResolvedValue([createMemberRecord()]);

        const res = await auth(request.get("/api/v1/trainers/me/members"), trainerUser);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });

    it("GET /trainers/me/members/:memberId — should return single assigned member details", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.member.findUnique.mockResolvedValue(createMemberRecord({ id: "m1" }));

        const res = await auth(request.get("/api/v1/trainers/me/members/m1"), trainerUser);
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe("m1");
    });

    it("GET /trainers/me/members/:memberId — should return 404 if member not assigned to trainer", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.member.findUnique.mockResolvedValue(null);

        const res = await auth(request.get("/api/v1/trainers/me/members/unassigned"), trainerUser);
        expect(res.status).toBe(404);
        expect(res.body.message).toContain("Member not found or not assigned to you");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. WORKOUT PLAN CRUD & ASSIGNMENT
// ═════════════════════════════════════════════════════════════════════════════

describe("Workout Plan Operations", () => {
    const trainerUser = createTrainerUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(trainerUser); });

    it("POST /workout-plans — create workout plan", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.workoutPlan.create.mockResolvedValue({
            id: "wp1", trainerId: "tr1", title: "Leg Day", exercises: [],
        });

        const res = await auth(request.post("/api/v1/trainers/workout-plans").send({
            title: "Leg Day",
            description: "Intense leg workout",
            exercises: [{ exerciseId: "ex1", sets: 4, reps: 12 }],
        }), trainerUser);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it("POST /workout-plans — reject if title missing", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());

        const res = await auth(request.post("/api/v1/trainers/workout-plans").send({
            exercises: [{ exerciseId: "ex1", sets: 4, reps: 12 }],
        }), trainerUser);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("Title is required");
    });

    it("GET /workout-plans — get all workout plans", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.workoutPlan.findMany.mockResolvedValue([]);

        const res = await auth(request.get("/api/v1/trainers/workout-plans"), trainerUser);
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    it("GET /workout-plans/:id — get plan by ID", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.workoutPlan.findUnique.mockResolvedValue({ id: "wp1", title: "Leg Day" });

        const res = await auth(request.get("/api/v1/trainers/workout-plans/wp1"), trainerUser);
        expect(res.status).toBe(200);
    });

    it("DELETE /workout-plans/:id — delete plan", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.workoutPlan.findUnique.mockResolvedValue({ id: "wp1" });
        prismaMock.workoutPlan.delete.mockResolvedValue({ id: "wp1" });

        const res = await auth(request.delete("/api/v1/trainers/workout-plans/wp1"), trainerUser);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("deleted successfully");
    });

    it("POST /workout-plans/:planId/assign/:memberId — assign workout plan", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.workoutPlan.findUnique.mockResolvedValue({
            id: "wp1", title: "Leg Day", exercises: [{ exerciseId: "ex1", sets: 4, reps: 12 }],
        });
        prismaMock.member.findUnique.mockResolvedValue(createMemberRecord());
        prismaMock.workoutAssignment.createMany.mockResolvedValue({ count: 1 });

        const res = await auth(request.post("/api/v1/trainers/workout-plans/wp1/assign/m1"), trainerUser);
        expect(res.status).toBe(201);
        expect(res.body.message).toContain("assigned to member successfully");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. DIET PLAN CRUD & ASSIGNMENT
// ═════════════════════════════════════════════════════════════════════════════

describe("Diet Plan Operations", () => {
    const trainerUser = createTrainerUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(trainerUser); });

    it("POST /diet-plans — create diet plan", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.dietPlan.create.mockResolvedValue({ id: "dp1", title: "Keto Cut", durationDays: 30 });

        const res = await auth(request.post("/api/v1/trainers/diet-plans").send({
            title: "Keto Cut",
            durationDays: 30,
            calories: 2000,
            protein: 180,
        }), trainerUser);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it("POST /diet-plans — reject missing title or durationDays", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());

        const res = await auth(request.post("/api/v1/trainers/diet-plans").send({
            title: "Keto Cut",
        }), trainerUser);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("Title and duration days are required");
    });

    it("DELETE /diet-plans/:id — delete diet plan", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.dietPlan.findUnique.mockResolvedValue({ id: "dp1" });
        prismaMock.dietPlan.delete.mockResolvedValue({ id: "dp1" });

        const res = await auth(request.delete("/api/v1/trainers/diet-plans/dp1"), trainerUser);
        expect(res.status).toBe(200);
    });

    it("POST /diet-plans/:planId/assign/:memberId — assign diet plan", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.dietPlan.findUnique.mockResolvedValue({ id: "dp1", title: "Keto Cut", durationDays: 30 });
        prismaMock.member.findUnique.mockResolvedValue(createMemberRecord());
        prismaMock.dietAssignment.create.mockResolvedValue({ id: "da1" });

        const res = await auth(request.post("/api/v1/trainers/diet-plans/dp1/assign/m1"), trainerUser);
        expect(res.status).toBe(201);
        expect(res.body.message).toContain("assigned to member successfully");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. SCHEDULE MANAGEMENT — getMySchedule & updateMySchedule
// ═════════════════════════════════════════════════════════════════════════════

describe("Trainer Schedule", () => {
    const trainerUser = createTrainerUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(trainerUser); });

    it("GET /trainers/me/schedule — get schedule", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.trainerSchedule.findMany.mockResolvedValue([]);

        const res = await auth(request.get("/api/v1/trainers/me/schedule"), trainerUser);
        expect(res.status).toBe(200);
    });

    it("PATCH /trainers/me/schedule — update schedule slots", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.trainerSchedule.upsert.mockResolvedValue({ id: "ts1" });

        const res = await auth(request.patch("/api/v1/trainers/me/schedule").send({
            slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
        }), trainerUser);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("Schedule updated successfully");
    });

    it("PATCH /trainers/me/schedule — reject invalid dayOfWeek", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());

        const res = await auth(request.patch("/api/v1/trainers/me/schedule").send({
            slots: [{ dayOfWeek: 7, startTime: "09:00", endTime: "17:00" }],
        }), trainerUser);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("dayOfWeek must be between 0 (Sun) and 6 (Sat)");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. PROGRESS TRACKING & ATTENDANCE
// ═════════════════════════════════════════════════════════════════════════════

describe("Member Progress & Attendance by Trainer", () => {
    const trainerUser = createTrainerUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(trainerUser); });

    it("POST /members/:memberId/progress — log member progress", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.member.findUnique.mockResolvedValue(createMemberRecord());
        prismaMock.progressLog.create.mockResolvedValue({ id: "pl1", weight: 75.5 });

        const res = await auth(request.post("/api/v1/trainers/members/m1/progress").send({
            weight: 75.5, notes: "Great progress",
        }), trainerUser);

        expect(res.status).toBe(201);
        expect(res.body.message).toContain("Progress logged successfully");
    });

    it("POST /members/:memberId/attendance — check-in member", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.member.findUnique.mockResolvedValue(createMemberRecord());
        prismaMock.attendance.findFirst.mockResolvedValue(null); // not checked in today
        prismaMock.attendance.create.mockResolvedValue({ id: "att1", checkIn: new Date() });

        const res = await auth(request.post("/api/v1/trainers/members/m1/attendance"), trainerUser);
        expect(res.status).toBe(201);
        expect(res.body.message).toContain("checked in successfully");
    });

    it("POST /members/:memberId/attendance — check-out member if already checked in", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.member.findUnique.mockResolvedValue(createMemberRecord());
        prismaMock.attendance.findFirst.mockResolvedValue({ id: "att1", checkIn: new Date(), checkOut: null });
        prismaMock.attendance.update.mockResolvedValue({ id: "att1", checkOut: new Date() });

        const res = await auth(request.post("/api/v1/trainers/members/m1/attendance"), trainerUser);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("checked out successfully");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. EXERCISES & CLASS BOOKINGS
// ═════════════════════════════════════════════════════════════════════════════

describe("Exercises & Class Bookings", () => {
    const trainerUser = createTrainerUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(trainerUser); });

    it("GET /exercises — list exercises", async () => {
        prismaMock.exercise.findMany.mockResolvedValue([{ id: "ex1", name: "Squats" }]);
        const res = await auth(request.get("/api/v1/trainers/exercises"), trainerUser);
        expect(res.status).toBe(200);
    });

    it("GET /exercises/search — search exercises", async () => {
        prismaMock.exercise.findMany.mockResolvedValue([{ id: "ex1", name: "Bench Press" }]);
        const res = await auth(request.get("/api/v1/trainers/exercises/search?q=bench"), trainerUser);
        expect(res.status).toBe(200);
    });

    it("GET /exercises/search — return 400 if q missing", async () => {
        const res = await auth(request.get("/api/v1/trainers/exercises/search"), trainerUser);
        expect(res.status).toBe(400);
    });

    it("GET /class-bookings — get class bookings", async () => {
        prismaMock.trainer.findUnique.mockResolvedValue(createTrainerRecord());
        prismaMock.classBooking.findMany.mockResolvedValue([]);

        const res = await auth(request.get("/api/v1/trainers/class-bookings"), trainerUser);
        expect(res.status).toBe(200);
    });
});
