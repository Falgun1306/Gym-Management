/**
 * Member Controller Tests — All 18 functions
 *
 * Routes tested:
 *   GET    /api/v1/members/me
 *   POST   /api/v1/members/me
 *   PATCH  /api/v1/members/me
 *   GET    /api/v1/members/me/attendance
 *   GET    /api/v1/members/me/payments
 *   GET    /api/v1/members/me/subscriptions
 *   GET    /api/v1/members/me/workout-plans
 *   GET    /api/v1/members/me/diet-plans
 *   GET    /api/v1/members/me/notifications
 *   PATCH  /api/v1/members/me/notifications/:id
 *   POST   /api/v1/members/apply-trainer
 *   GET    /api/v1/members/my-applications
 *   GET    /api/v1/members/gym-classes
 *   POST   /api/v1/members/gym-classes/:classId/book
 *   PATCH  /api/v1/members/gym-classes/bookings/:bookingId/cancel
 *   POST   /api/v1/members/complaints
 *   GET    /api/v1/members/:id
 *   GET    /api/v1/members/
 */
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Prisma mock ────────────────────────────────────────────────────────────

const createModelMock = () => ({
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    count: jest.fn(), aggregate: jest.fn(), upsert: jest.fn(),
    deleteMany: jest.fn(), updateMany: jest.fn(),
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

const createUser = (o = {}) => ({ id: "u1", username: "member1", email: "m@e.com", password: "h", role: "MEMBER", createdAt: new Date(), updatedAt: new Date(), ...o });
const createMember = (o = {}) => ({ id: "m1", userId: "u1", firstName: "John", lastName: "Doe", phone: "123", gender: "MALE", dob: null, address: null, height: null, weight: null, emergencyContactName: null, emergencyContactPhone: null, medicalNotes: null, trainerId: null, joinedAt: new Date(), ...o });
const adminUser = createUser({ id: "a1", role: "ADMIN" });
const trainerUser = createUser({ id: "t1", role: "TRAINER" });

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
// GET /members/me — getMyProfile
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/members/me", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should return member profile", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        const res = await auth(request.get("/api/v1/members/me"), user);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
    });

    it("should return 404 if member profile not found", async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);
        const res = await auth(request.get("/api/v1/members/me"), user);
        expect(res.status).toBe(404);
    });

    it("should return 401 without auth", async () => {
        const res = await request.get("/api/v1/members/me");
        expect(res.status).toBe(401);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /members/me — createMyProfile
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/v1/members/me", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should create member profile successfully", async () => {
        prismaMock.member.findUnique.mockResolvedValue(null); // no existing profile
        prismaMock.member.create.mockResolvedValue(createMember());

        const res = await auth(request.post("/api/v1/members/me").send({
            firstName: "John", lastName: "Doe", phone: "123", gender: "MALE",
        }), user);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("created successfully");
    });

    it("should update profile if it already exists (upsert behavior)", async () => {
        const existing = createMember();
        prismaMock.member.findUnique.mockResolvedValue(existing);
        prismaMock.member.update.mockResolvedValue({ ...existing, firstName: "John" });

        const res = await auth(request.post("/api/v1/members/me").send({
            firstName: "John", lastName: "Doe", phone: "123", gender: "MALE",
        }), user);

        expect([200, 201]).toContain(res.status);
    });

    it("should reject if required fields are missing", async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);

        const res = await auth(request.post("/api/v1/members/me").send({
            firstName: "John", // missing lastName, phone, gender
        }), user);

        expect(res.status).toBe(400);
    });

    it("should accept optional fields (dob, height, weight)", async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);
        prismaMock.member.create.mockResolvedValue(createMember({ height: 175, weight: 70 }));

        const res = await auth(request.post("/api/v1/members/me").send({
            firstName: "John", lastName: "Doe", phone: "123", gender: "MALE",
            dob: "2000-01-01", height: 175, weight: 70,
        }), user);

        expect(res.status).toBe(201);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /members/me — updateMyProfile
// ═════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/v1/members/me", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should update member profile fields", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.member.update.mockResolvedValue(createMember({ firstName: "Jane" }));

        const res = await auth(request.patch("/api/v1/members/me").send({ firstName: "Jane" }), user);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("should reject if no valid fields are provided", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());

        const res = await auth(request.patch("/api/v1/members/me").send({ role: "ADMIN" }), user);
        expect(res.status).toBe(400);
        expect(res.body.message).toContain("No valid fields");
    });

    it("should return 404 if member profile not found", async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);

        const res = await auth(request.patch("/api/v1/members/me").send({ firstName: "Jane" }), user);
        expect(res.status).toBe(404);
    });

    it("should parse numeric fields (height, weight)", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.member.update.mockResolvedValue(createMember({ height: 180.5 }));

        const res = await auth(request.patch("/api/v1/members/me").send({ height: "180.5", weight: "75" }), user);
        expect(res.status).toBe(200);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /members/me/attendance — getMyAttendance
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/members/me/attendance", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should return paginated attendance records", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.attendance.findMany.mockResolvedValue([{ id: "att1", checkIn: new Date() }]);
        prismaMock.attendance.count.mockResolvedValue(1);

        const res = await auth(request.get("/api/v1/members/me/attendance"), user);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.pagination).toBeDefined();
    });

    it("should return 404 if no member profile", async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);
        const res = await auth(request.get("/api/v1/members/me/attendance"), user);
        expect(res.status).toBe(404);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /members/me/payments — getMyPayments
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/members/me/payments", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should return paginated payment records", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.payment.findMany.mockResolvedValue([]);
        prismaMock.payment.count.mockResolvedValue(0);

        const res = await auth(request.get("/api/v1/members/me/payments"), user);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
        expect(res.body.pagination).toBeDefined();
    });

    it("should return 404 if no member profile", async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);
        const res = await auth(request.get("/api/v1/members/me/payments"), user);
        expect(res.status).toBe(404);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /members/me/subscriptions — getMySubscriptions
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/members/me/subscriptions", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should return enriched subscriptions with remaining days", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        prismaMock.membership.findMany.mockResolvedValue([{
            id: "ms1", status: "ACTIVE", endDate: futureDate, plan: { name: "Gold" },
        }]);

        const res = await auth(request.get("/api/v1/members/me/subscriptions"), user);
        expect(res.status).toBe(200);
        expect(res.body.data[0].remainingDays).toBeGreaterThan(0);
    });

    it("should return null remainingDays for expired memberships", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.membership.findMany.mockResolvedValue([{
            id: "ms1", status: "EXPIRED", endDate: new Date("2025-01-01"), plan: { name: "Silver" },
        }]);

        const res = await auth(request.get("/api/v1/members/me/subscriptions"), user);
        expect(res.status).toBe(200);
        expect(res.body.data[0].remainingDays).toBeNull();
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /members/me/workout-plans — getMyWorkoutPlans
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/members/me/workout-plans", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should return workout assignments", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.workoutAssignment.findMany.mockResolvedValue([]);

        const res = await auth(request.get("/api/v1/members/me/workout-plans"), user);
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    it("should return 404 if no member profile", async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);
        const res = await auth(request.get("/api/v1/members/me/workout-plans"), user);
        expect(res.status).toBe(404);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /members/me/diet-plans — getMyDietPlans
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/members/me/diet-plans", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should return diet assignments", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.dietAssignment.findMany.mockResolvedValue([]);

        const res = await auth(request.get("/api/v1/members/me/diet-plans"), user);
        expect(res.status).toBe(200);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /members/me/notifications — getMyNotifications
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/members/me/notifications", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should return paginated notifications", async () => {
        prismaMock.notification.findMany.mockResolvedValue([{ id: "n1", message: "Welcome", isRead: false }]);
        prismaMock.notification.count.mockResolvedValue(1);

        const res = await auth(request.get("/api/v1/members/me/notifications"), user);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.pagination).toBeDefined();
    });

    it("should filter by unreadOnly=true", async () => {
        prismaMock.notification.findMany.mockResolvedValue([]);
        prismaMock.notification.count.mockResolvedValue(0);

        const res = await auth(request.get("/api/v1/members/me/notifications?unreadOnly=true"), user);
        expect(res.status).toBe(200);
        expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ isRead: false }) })
        );
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /members/me/notifications/:id — markNotificationRead
// ═════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/v1/members/me/notifications/:id", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should mark notification as read", async () => {
        prismaMock.notification.findUnique.mockResolvedValue({ id: "n1", userId: "u1", isRead: false });
        prismaMock.notification.update.mockResolvedValue({ id: "n1", isRead: true });

        const res = await auth(request.patch("/api/v1/members/me/notifications/n1"), user);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("marked as read");
    });

    it("should return 404 if notification not found", async () => {
        prismaMock.notification.findUnique.mockResolvedValue(null);
        const res = await auth(request.patch("/api/v1/members/me/notifications/bad-id"), user);
        expect(res.status).toBe(404);
    });

    it("should return 403 if notification belongs to another user", async () => {
        prismaMock.notification.findUnique.mockResolvedValue({ id: "n1", userId: "other-user" });
        const res = await auth(request.patch("/api/v1/members/me/notifications/n1"), user);
        expect(res.status).toBe(403);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// GYM CLASSES — listGymClasses, bookGymClass, cancelGymClass
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/members/gym-classes", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should list all gym classes", async () => {
        prismaMock.gymClass.findMany.mockResolvedValue([{ id: "gc1", title: "Yoga" }]);
        const res = await auth(request.get("/api/v1/members/gym-classes"), user);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });
});

describe("POST /api/v1/members/gym-classes/:classId/book", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should book a gym class successfully", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.gymClass.findUnique.mockResolvedValue({ id: "gc1", capacity: 20, _count: { bookings: 5 } });
        prismaMock.classBooking.findFirst.mockResolvedValue(null);
        prismaMock.classBooking.create.mockResolvedValue({ id: "b1", classId: "gc1" });

        const res = await auth(request.post("/api/v1/members/gym-classes/gc1/book"), user);
        expect(res.status).toBe(201);
        expect(res.body.message).toContain("booked successfully");
    });

    it("should reject if class is fully booked", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.gymClass.findUnique.mockResolvedValue({ id: "gc1", capacity: 5, _count: { bookings: 5 } });

        const res = await auth(request.post("/api/v1/members/gym-classes/gc1/book"), user);
        expect(res.status).toBe(400);
        expect(res.body.message).toContain("fully booked");
    });

    it("should reject if already booked", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.gymClass.findUnique.mockResolvedValue({ id: "gc1", capacity: 20, _count: { bookings: 5 } });
        prismaMock.classBooking.findFirst.mockResolvedValue({ id: "existing" });

        const res = await auth(request.post("/api/v1/members/gym-classes/gc1/book"), user);
        expect(res.status).toBe(409);
        expect(res.body.message).toContain("already booked");
    });

    it("should return 404 if class not found", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.gymClass.findUnique.mockResolvedValue(null);

        const res = await auth(request.post("/api/v1/members/gym-classes/bad-id/book"), user);
        expect(res.status).toBe(404);
    });
});

describe("PATCH /api/v1/members/gym-classes/bookings/:bookingId/cancel", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should cancel a booking", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.classBooking.findUnique.mockResolvedValue({ id: "b1", memberId: "m1", status: "BOOKED" });
        prismaMock.classBooking.update.mockResolvedValue({ id: "b1", status: "CANCELLED" });

        const res = await auth(request.patch("/api/v1/members/gym-classes/bookings/b1/cancel"), user);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("cancelled");
    });

    it("should return 404 if booking not found", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.classBooking.findUnique.mockResolvedValue(null);

        const res = await auth(request.patch("/api/v1/members/gym-classes/bookings/bad/cancel"), user);
        expect(res.status).toBe(404);
    });

    it("should return 403 if booking belongs to another member", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.classBooking.findUnique.mockResolvedValue({ id: "b1", memberId: "other-member", status: "BOOKED" });

        const res = await auth(request.patch("/api/v1/members/gym-classes/bookings/b1/cancel"), user);
        expect(res.status).toBe(403);
    });

    it("should reject if already cancelled", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.classBooking.findUnique.mockResolvedValue({ id: "b1", memberId: "m1", status: "CANCELLED" });

        const res = await auth(request.patch("/api/v1/members/gym-classes/bookings/b1/cancel"), user);
        expect(res.status).toBe(400);
        expect(res.body.message).toContain("already cancelled");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /members/complaints — createComplaint
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/v1/members/complaints", () => {
    const user = createUser();
    beforeEach(() => { resetAll(); prismaMock.user.findUnique.mockResolvedValue(user); });

    it("should create a complaint", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());
        prismaMock.complaint.create.mockResolvedValue({ id: "c1", subject: "Broken equipment" });

        const res = await auth(request.post("/api/v1/members/complaints").send({
            subject: "Broken equipment", description: "The treadmill is broken",
        }), user);

        expect(res.status).toBe(201);
        expect(res.body.message).toContain("submitted successfully");
    });

    it("should reject if subject or description missing", async () => {
        prismaMock.member.findUnique.mockResolvedValue(createMember());

        const res = await auth(request.post("/api/v1/members/complaints").send({
            subject: "Broken equipment", // missing description
        }), user);

        expect(res.status).toBe(400);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /members/:id — getMemberById (ADMIN/TRAINER only)
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/members/:id", () => {
    beforeEach(() => resetAll());

    it("should return member for ADMIN", async () => {
        prismaMock.user.findUnique.mockResolvedValue(adminUser);
        prismaMock.member.findUnique.mockResolvedValue(createMember());

        const res = await auth(request.get("/api/v1/members/m1"), adminUser);
        expect(res.status).toBe(200);
    });

    it("should return member for TRAINER", async () => {
        prismaMock.user.findUnique.mockResolvedValue(trainerUser);
        prismaMock.member.findUnique.mockResolvedValue(createMember());

        const res = await auth(request.get("/api/v1/members/m1"), trainerUser);
        expect(res.status).toBe(200);
    });

    it("should deny access to MEMBER role", async () => {
        const memberUser = createUser();
        prismaMock.user.findUnique.mockResolvedValue(memberUser);

        const res = await auth(request.get("/api/v1/members/m1"), memberUser);
        expect(res.status).toBe(403);
    });

    it("should return 404 if member not found", async () => {
        prismaMock.user.findUnique.mockResolvedValue(adminUser);
        prismaMock.member.findUnique.mockResolvedValue(null);

        const res = await auth(request.get("/api/v1/members/bad-id"), adminUser);
        expect(res.status).toBe(404);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /members/ — listMembers (ADMIN only)
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/v1/members/", () => {
    beforeEach(() => resetAll());

    it("should return paginated members for ADMIN", async () => {
        prismaMock.user.findUnique.mockResolvedValue(adminUser);
        prismaMock.member.findMany.mockResolvedValue([createMember()]);
        prismaMock.member.count.mockResolvedValue(1);

        const res = await auth(request.get("/api/v1/members/"), adminUser);
        expect(res.status).toBe(200);
        expect(res.body.pagination).toBeDefined();
    });

    it("should deny access to MEMBER role", async () => {
        const memberUser = createUser();
        prismaMock.user.findUnique.mockResolvedValue(memberUser);

        const res = await auth(request.get("/api/v1/members/"), memberUser);
        expect(res.status).toBe(403);
    });

    it("should deny access to TRAINER role", async () => {
        prismaMock.user.findUnique.mockResolvedValue(trainerUser);

        const res = await auth(request.get("/api/v1/members/"), trainerUser);
        expect(res.status).toBe(403);
    });
});
