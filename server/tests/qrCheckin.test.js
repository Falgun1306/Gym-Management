/**
 * QR Code Check-in Tests
 *
 * Routes tested:
 *   GET  /api/v1/attendance/me/qr-code   (Member generates QR code)
 *   POST /api/v1/attendance/qr/scan      (Trainer scans QR to check in/out)
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

const createMemberUser = (o = {}) => ({ id: "user-m1", username: "member1", email: "member@gym.com", role: "MEMBER", createdAt: new Date(), ...o });
const createTrainerUser = (o = {}) => ({ id: "user-t1", username: "trainer1", email: "trainer@gym.com", role: "TRAINER", createdAt: new Date(), ...o });
const createAdminUser = (o = {}) => ({ id: "user-a1", username: "admin1", email: "admin@gym.com", role: "ADMIN", createdAt: new Date(), ...o });
const createMemberRecord = (o = {}) => ({ id: "m1", userId: "user-m1", firstName: "John", lastName: "Doe", phone: "1234567890", gender: "MALE", trainerId: null, joinedAt: new Date(), ...o });
const createActiveMembership = (o = {}) => ({ id: "ms1", memberId: "m1", planId: "p1", status: "ACTIVE", startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000), ...o });

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
// 1. QR CODE GENERATION (Member)
// ═════════════════════════════════════════════════════════════════════════════

describe("QR Code Generation — GET /attendance/me/qr-code", () => {
    const memberUser = createMemberUser();
    const memberRecord = createMemberRecord();

    beforeEach(() => {
        resetAll();
        prismaMock.user.findUnique.mockResolvedValue(memberUser);
    });

    it("should generate QR code for member with active membership", async () => {
        prismaMock.member.findUnique.mockResolvedValue(memberRecord);
        prismaMock.membership.findMany.mockResolvedValue([createActiveMembership()]);
        prismaMock.membership.count.mockResolvedValue(1);

        const res = await auth(request.get("/api/v1/attendance/me/qr-code"), memberUser);

        expect(res.status).toBe(200);
        expect(res.body.data.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
        expect(res.body.data.expiresAt).toBeDefined();
        expect(res.body.data.memberName).toBe("John Doe");
        expect(res.body.message).toContain("QR code generated");
    });

    it("should reject QR generation when member has no active membership", async () => {
        prismaMock.member.findUnique.mockResolvedValue(memberRecord);
        prismaMock.membership.findMany.mockResolvedValue([]);
        prismaMock.membership.count.mockResolvedValue(0);

        const res = await auth(request.get("/api/v1/attendance/me/qr-code"), memberUser);

        expect(res.status).toBe(403);
        expect(res.body.message).toContain("No active membership");
    });

    it("should reject QR generation when member profile not found", async () => {
        prismaMock.member.findUnique.mockResolvedValue(null);

        const res = await auth(request.get("/api/v1/attendance/me/qr-code"), memberUser);

        expect(res.status).toBe(404);
        expect(res.body.message).toContain("Member profile not found");
    });

    it("should reject unauthenticated request", async () => {
        const res = await request.get("/api/v1/attendance/me/qr-code");
        expect(res.status).toBe(401);
    });

    it("should reject trainer trying to generate member QR", async () => {
        const trainerUser = createTrainerUser();
        prismaMock.user.findUnique.mockResolvedValue(trainerUser);

        const res = await auth(request.get("/api/v1/attendance/me/qr-code"), trainerUser);
        expect(res.status).toBe(403);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. QR CODE SCANNING (Trainer/Admin)
// ═════════════════════════════════════════════════════════════════════════════

describe("QR Code Scanning — POST /attendance/qr/scan", () => {
    const trainerUser = createTrainerUser();
    const memberRecord = createMemberRecord();
    const qrSecret = process.env.QR_TOKEN_SECRET || process.env.JWT_SECRET;

    const createValidQrToken = (memberId = "m1") =>
        jwt.sign({ memberId, purpose: "gym-checkin" }, qrSecret, { expiresIn: "5m" });

    beforeEach(() => {
        resetAll();
        prismaMock.user.findUnique.mockResolvedValue(trainerUser);
    });

    it("should check in member when scanned for the first time today", async () => {
        const qrToken = createValidQrToken();
        prismaMock.member.findUnique.mockResolvedValue(memberRecord);
        prismaMock.membership.findMany.mockResolvedValue([createActiveMembership()]);
        prismaMock.membership.count.mockResolvedValue(1);
        prismaMock.attendance.findFirst.mockResolvedValue(null); // no active check-in
        prismaMock.attendance.create.mockResolvedValue({
            id: "att1", memberId: "m1", checkIn: new Date(), checkInMethod: "QR_CODE",
        });

        const res = await auth(
            request.post("/api/v1/attendance/qr/scan").send({ qrToken }),
            trainerUser
        );

        expect(res.status).toBe(201);
        expect(res.body.message).toContain("John Doe checked in successfully");
        expect(res.body.data.checkInMethod).toBe("QR_CODE");
    });

    it("should check out member when already checked in today", async () => {
        const qrToken = createValidQrToken();
        prismaMock.member.findUnique.mockResolvedValue(memberRecord);
        prismaMock.membership.findMany.mockResolvedValue([createActiveMembership()]);
        prismaMock.membership.count.mockResolvedValue(1);
        prismaMock.attendance.findFirst.mockResolvedValue({
            id: "att1", memberId: "m1", checkIn: new Date(), checkOut: null,
        });
        prismaMock.attendance.update.mockResolvedValue({
            id: "att1", memberId: "m1", checkIn: new Date(), checkOut: new Date(),
        });

        const res = await auth(
            request.post("/api/v1/attendance/qr/scan").send({ qrToken }),
            trainerUser
        );

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("checked out successfully");
    });

    it("should reject expired QR token", async () => {
        const expiredToken = jwt.sign(
            { memberId: "m1", purpose: "gym-checkin" },
            qrSecret,
            { expiresIn: "0s" }
        );

        // Small delay to ensure token is expired
        await new Promise((r) => setTimeout(r, 100));

        const res = await auth(
            request.post("/api/v1/attendance/qr/scan").send({ qrToken: expiredToken }),
            trainerUser
        );

        expect(res.status).toBe(401);
        expect(res.body.message).toContain("expired");
    });

    it("should reject invalid/tampered QR token", async () => {
        const res = await auth(
            request.post("/api/v1/attendance/qr/scan").send({ qrToken: "invalid.token.here" }),
            trainerUser
        );

        expect(res.status).toBe(401);
        expect(res.body.message).toContain("Invalid QR code");
    });

    it("should reject when qrToken is missing", async () => {
        const res = await auth(
            request.post("/api/v1/attendance/qr/scan").send({}),
            trainerUser
        );

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("QR token is required");
    });

    it("should reject when member has no active membership", async () => {
        const qrToken = createValidQrToken();
        prismaMock.member.findUnique.mockResolvedValue(memberRecord);
        prismaMock.membership.findMany.mockResolvedValue([]);
        prismaMock.membership.count.mockResolvedValue(0);

        const res = await auth(
            request.post("/api/v1/attendance/qr/scan").send({ qrToken }),
            trainerUser
        );

        expect(res.status).toBe(403);
        expect(res.body.message).toContain("active membership");
    });

    it("should reject when member profile not found", async () => {
        const qrToken = createValidQrToken("nonexistent");
        prismaMock.member.findUnique.mockResolvedValue(null);

        const res = await auth(
            request.post("/api/v1/attendance/qr/scan").send({ qrToken }),
            trainerUser
        );

        expect(res.status).toBe(404);
        expect(res.body.message).toContain("Member not found");
    });

    it("should allow ADMIN to scan QR code too", async () => {
        const adminUser = createAdminUser();
        prismaMock.user.findUnique.mockResolvedValue(adminUser);

        const qrToken = createValidQrToken();
        prismaMock.member.findUnique.mockResolvedValue(memberRecord);
        prismaMock.membership.findMany.mockResolvedValue([createActiveMembership()]);
        prismaMock.membership.count.mockResolvedValue(1);
        prismaMock.attendance.findFirst.mockResolvedValue(null);
        prismaMock.attendance.create.mockResolvedValue({
            id: "att2", memberId: "m1", checkIn: new Date(), checkInMethod: "QR_CODE",
        });

        const res = await auth(
            request.post("/api/v1/attendance/qr/scan").send({ qrToken }),
            adminUser
        );

        expect(res.status).toBe(201);
        expect(res.body.message).toContain("checked in successfully");
    });

    it("should reject member trying to scan (wrong role)", async () => {
        const memberUser = createMemberUser();
        prismaMock.user.findUnique.mockResolvedValue(memberUser);

        const res = await auth(
            request.post("/api/v1/attendance/qr/scan").send({ qrToken: "any" }),
            memberUser
        );

        expect(res.status).toBe(403);
    });
});
