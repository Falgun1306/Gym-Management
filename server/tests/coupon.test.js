/**
 * Integration Tests — Coupon Routes
 *
 * Tests the full HTTP layer: router → controller → service → (mocked) prisma
 *
 * Routes tested:
 *   POST   /api/v1/coupons                    (ADMIN)
 *   GET    /api/v1/coupons/admin/all          (ADMIN)
 *   GET    /api/v1/coupons/admin/:id          (ADMIN)
 *   PATCH  /api/v1/coupons/admin/:id          (ADMIN)
 *   DELETE /api/v1/coupons/admin/:id          (ADMIN)
 *   GET    /api/v1/coupons/validate/:code     (MEMBER)
 *   GET    /api/v1/coupons/my-usages          (MEMBER)
 */
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Prisma Mock ──────────────────────────────────────────────────────────────

const createModelMock = () => ({
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    count: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn(), updateMany: jest.fn(),
});

const prismaMock = {
    user: createModelMock(),
    member: createModelMock(),
    coupon: createModelMock(),
    couponUsage: createModelMock(),
    referralLink: createModelMock(),
    referral: createModelMock(),
    membership: createModelMock(),
    notification: createModelMock(),
    trainer: createModelMock(),
    trainerApplication: createModelMock(),
    membershipPlan: createModelMock(),
    payment: createModelMock(),
    attendance: createModelMock(),
    exercise: createModelMock(),
    workoutAssignment: createModelMock(),
    workoutPlan: createModelMock(),
    workoutPlanExercise: createModelMock(),
    dietPlan: createModelMock(),
    dietAssignment: createModelMock(),
    progressLog: createModelMock(),
    gymClass: createModelMock(),
    classBooking: createModelMock(),
    trainerSchedule: createModelMock(),
    equipment: createModelMock(),
    complaint: createModelMock(),
    $transaction: jest.fn((fn) => (typeof fn === "function" ? fn(prismaMock) : Promise.all(fn))),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
};

jest.unstable_mockModule(resolve(__dirname, "../src/config/prisma.js"), () => ({
    default: prismaMock,
}));

// ─── App + Supertest ──────────────────────────────────────────────────────────

const { app } = await import(resolve(__dirname, "../src/app.js"));
const supertest = (await import("supertest")).default;
const jwt = (await import("jsonwebtoken")).default;
const request = supertest(app);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const genToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

const ADMIN_TOKEN = genToken({ id: "admin-user-id", role: "ADMIN" });
const MEMBER_TOKEN = genToken({ id: "member-user-id", role: "MEMBER" });

const ADMIN_USER = { id: "admin-user-id", role: "ADMIN", username: "admin" };
const MEMBER_USER = { id: "member-user-id", role: "MEMBER", username: "john" };
const MEMBER_RECORD = { id: "member-1", userId: "member-user-id", firstName: "John", lastName: "Doe" };

const COUPON = {
    id: "coupon-1",
    code: "SUMMER20",
    description: "Summer sale",
    discountType: "PERCENTAGE",
    discountValue: "20",
    status: "ACTIVE",
    usageCount: 0,
    maxUsageCount: null,
    perUserLimit: 1,
    minPurchaseAmount: null,
    maxDiscountAmount: null,
    startDate: new Date("2020-01-01"),
    expiresAt: null,
    isReferral: false,
};

const resetMocks = () => {
    for (const model of Object.values(prismaMock)) {
        if (model && typeof model === "object") {
            for (const m of Object.values(model)) {
                if (typeof m?.mockReset === "function") m.mockReset();
            }
        }
    }
    prismaMock.$transaction.mockImplementation((fn) =>
        typeof fn === "function" ? fn(prismaMock) : Promise.all(fn)
    );
};

// ─── POST /api/v1/coupons (Admin: Create) ─────────────────────────────────────

describe("POST /api/v1/coupons — Admin creates coupon", () => {
    beforeEach(() => {
        resetMocks();
        prismaMock.user.findUnique.mockResolvedValue(ADMIN_USER);
    });

    it("201 — creates coupon with valid payload", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue(null); // code not taken
        prismaMock.coupon.create.mockResolvedValue({ ...COUPON, id: "c-new" });

        const res = await request
            .post("/api/v1/coupons")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .send({ code: "SUMMER20", discountType: "PERCENTAGE", discountValue: 20 });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.code).toBe("SUMMER20");
    });

    it("400 — missing required fields", async () => {
        const res = await request
            .post("/api/v1/coupons")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .send({ code: "X" }); // missing discountType and discountValue

        expect(res.status).toBe(400);
    });

    it("409 — duplicate coupon code", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue(COUPON); // code exists

        const res = await request
            .post("/api/v1/coupons")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .send({ code: "SUMMER20", discountType: "PERCENTAGE", discountValue: 20 });

        expect(res.status).toBe(409);
    });

    it("403 — MEMBER cannot create coupons", async () => {
        prismaMock.user.findUnique.mockResolvedValue(MEMBER_USER);

        const res = await request
            .post("/api/v1/coupons")
            .set("Authorization", `Bearer ${MEMBER_TOKEN}`)
            .send({ code: "SUMMER20", discountType: "PERCENTAGE", discountValue: 20 });

        expect(res.status).toBe(403);
    });

    it("401 — unauthenticated request rejected", async () => {
        const res = await request
            .post("/api/v1/coupons")
            .send({ code: "SUMMER20", discountType: "PERCENTAGE", discountValue: 20 });

        expect(res.status).toBe(401);
    });
});

// ─── GET /api/v1/coupons/admin/all ───────────────────────────────────────────

describe("GET /api/v1/coupons/admin/all — Admin lists coupons", () => {
    beforeEach(() => {
        resetMocks();
        prismaMock.user.findUnique.mockResolvedValue(ADMIN_USER);
    });

    it("200 — returns paginated coupon list", async () => {
        prismaMock.coupon.findMany.mockResolvedValue([COUPON]);
        prismaMock.coupon.count.mockResolvedValue(1);

        const res = await request
            .get("/api/v1/coupons/admin/all")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.pagination).toBeDefined();
    });
});

// ─── GET /api/v1/coupons/admin/:id ───────────────────────────────────────────

describe("GET /api/v1/coupons/admin/:id — Admin gets single coupon", () => {
    beforeEach(() => {
        resetMocks();
        prismaMock.user.findUnique.mockResolvedValue(ADMIN_USER);
    });

    it("200 — returns existing coupon", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue({ ...COUPON, usages: [] });

        const res = await request
            .get("/api/v1/coupons/admin/coupon-1")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

        expect(res.status).toBe(200);
        expect(res.body.data.code).toBe("SUMMER20");
    });

    it("404 — non-existent coupon id", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue(null);

        const res = await request
            .get("/api/v1/coupons/admin/bad-id")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

        expect(res.status).toBe(404);
    });
});

// ─── PATCH /api/v1/coupons/admin/:id ─────────────────────────────────────────

describe("PATCH /api/v1/coupons/admin/:id — Admin updates coupon", () => {
    beforeEach(() => {
        resetMocks();
        prismaMock.user.findUnique.mockResolvedValue(ADMIN_USER);
    });

    it("200 — updates expiresAt successfully", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue(COUPON);
        prismaMock.coupon.update.mockResolvedValue({
            ...COUPON,
            expiresAt: new Date("2026-12-31"),
        });

        const res = await request
            .patch("/api/v1/coupons/admin/coupon-1")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .send({ expiresAt: "2026-12-31" });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("updated");
    });

    it("400 — invalid status value", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue(COUPON);

        const res = await request
            .patch("/api/v1/coupons/admin/coupon-1")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .send({ status: "BADSTATUS" });

        expect(res.status).toBe(400);
    });
});

// ─── DELETE /api/v1/coupons/admin/:id ────────────────────────────────────────

describe("DELETE /api/v1/coupons/admin/:id — Admin deactivates coupon", () => {
    beforeEach(() => {
        resetMocks();
        prismaMock.user.findUnique.mockResolvedValue(ADMIN_USER);
    });

    it("200 — sets status to INACTIVE", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue(COUPON);
        prismaMock.coupon.update.mockResolvedValue({ ...COUPON, status: "INACTIVE" });

        const res = await request
            .delete("/api/v1/coupons/admin/coupon-1")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("deactivated");
    });
});

// ─── GET /api/v1/coupons/validate/:code ──────────────────────────────────────

describe("GET /api/v1/coupons/validate/:code — Member validates coupon", () => {
    beforeEach(() => {
        resetMocks();
        prismaMock.user.findUnique.mockResolvedValue(MEMBER_USER);
        prismaMock.member.findUnique.mockResolvedValue(MEMBER_RECORD);
        prismaMock.couponUsage.count.mockResolvedValue(0);
    });

    it("200 — returns discount preview for valid code", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue(COUPON);

        const res = await request
            .get("/api/v1/coupons/validate/SUMMER20?amount=2000")
            .set("Authorization", `Bearer ${MEMBER_TOKEN}`);

        expect(res.status).toBe(200);
        expect(res.body.data.valid).toBe(true);
        expect(res.body.data.discountAmount).toBe(400);
        expect(res.body.data.finalAmount).toBe(1600);
    });

    it("400 — expired coupon returns 400", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue({
            ...COUPON,
            expiresAt: new Date("2020-01-01"),
        });

        const res = await request
            .get("/api/v1/coupons/validate/SUMMER20?amount=2000")
            .set("Authorization", `Bearer ${MEMBER_TOKEN}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("expired");
    });

    it("400 — below minimum purchase amount", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue({
            ...COUPON,
            minPurchaseAmount: "1000",
        });

        const res = await request
            .get("/api/v1/coupons/validate/SUMMER20?amount=500")
            .set("Authorization", `Bearer ${MEMBER_TOKEN}`);

        expect(res.status).toBe(400);
    });

    it("401 — unauthenticated request rejected", async () => {
        const res = await request.get("/api/v1/coupons/validate/SUMMER20");
        expect(res.status).toBe(401);
    });
});

// ─── GET /api/v1/coupons/my-usages ───────────────────────────────────────────

describe("GET /api/v1/coupons/my-usages — Member usage history", () => {
    beforeEach(() => {
        resetMocks();
        prismaMock.user.findUnique.mockResolvedValue(MEMBER_USER);
        prismaMock.member.findUnique.mockResolvedValue(MEMBER_RECORD);
    });

    it("200 — returns usage list for authenticated member", async () => {
        prismaMock.couponUsage.findMany.mockResolvedValue([]);
        prismaMock.couponUsage.count.mockResolvedValue(0);

        const res = await request
            .get("/api/v1/coupons/my-usages")
            .set("Authorization", `Bearer ${MEMBER_TOKEN}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("401 — unauthenticated request rejected", async () => {
        const res = await request.get("/api/v1/coupons/my-usages");
        expect(res.status).toBe(401);
    });
});
