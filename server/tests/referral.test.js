/**
 * Integration Tests — Referral Routes
 *
 * Tests the full HTTP layer for referral-specific API endpoints:
 *   GET  /api/v1/coupons/my-referral-link       (MEMBER)
 *   POST /api/v1/members/me                      (MEMBER, with ?referralCode body field)
 *   POST /api/v1/admins/memberships              (ADMIN, with couponCode body field)
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
    membershipPlan: createModelMock(),
    notification: createModelMock(),
    trainer: createModelMock(),
    trainerApplication: createModelMock(),
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

const ADMIN_TOKEN = genToken({ id: "admin-id", role: "ADMIN" });
const MEMBER_TOKEN = genToken({ id: "member-user-id", role: "MEMBER" });

const ADMIN_USER = { id: "admin-id", role: "ADMIN", username: "admin" };
const MEMBER_USER = { id: "member-user-id", role: "MEMBER", username: "john" };
const MEMBER_RECORD = { id: "member-1", userId: "member-user-id", firstName: "John", lastName: "Doe" };

const REFERRAL_LINK = {
    id: "link-1",
    memberId: "member-1",
    code: "REF-JOHN",
    totalReferrals: 5,
    successfulReferrals: 3,
    createdAt: new Date(),
    referrals: [],
};

const PLAN = {
    id: "plan-1",
    name: "Basic",
    durationMonths: 1,
    price: "2000",
    isActive: true,
};

const MEMBERSHIP = {
    id: "ms-1",
    memberId: "member-1",
    planId: "plan-1",
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 86400000),
    status: "PENDING",
    couponId: null,
    plan: PLAN,
    member: MEMBER_RECORD,
};

const COUPON = {
    id: "coupon-1",
    code: "SUMMER20",
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

// ─── GET /api/v1/coupons/my-referral-link ─────────────────────────────────────

describe("GET /api/v1/coupons/my-referral-link — Member referral link", () => {
    beforeEach(() => {
        resetMocks();
        prismaMock.user.findUnique.mockResolvedValue(MEMBER_USER);
        prismaMock.member.findUnique.mockResolvedValue(MEMBER_RECORD);
    });

    it("200 — returns existing referral link", async () => {
        prismaMock.referralLink.findUnique.mockResolvedValue(REFERRAL_LINK);

        const res = await request
            .get("/api/v1/coupons/my-referral-link")
            .set("Authorization", `Bearer ${MEMBER_TOKEN}`);

        expect(res.status).toBe(200);
        expect(res.body.data.code).toBe("REF-JOHN");
        expect(res.body.data.totalReferrals).toBe(5);
    });

    it("201 — creates and returns new referral link on first call", async () => {
        // First call: no existing link
        prismaMock.referralLink.findUnique
            .mockResolvedValueOnce(null)    // findReferralLinkByMemberId — none
            .mockResolvedValueOnce(null);   // uniqueness check for code
        prismaMock.referralLink.create.mockResolvedValue({
            ...REFERRAL_LINK,
            code: "REF-JOHN",
        });

        const res = await request
            .get("/api/v1/coupons/my-referral-link")
            .set("Authorization", `Bearer ${MEMBER_TOKEN}`);

        expect(res.status).toBe(201);
        expect(res.body.data.code).toMatch(/^REF-/);
    });

    it("401 — unauthenticated request rejected", async () => {
        const res = await request.get("/api/v1/coupons/my-referral-link");
        expect(res.status).toBe(401);
    });

    it("403 — ADMIN cannot access member referral link endpoint", async () => {
        prismaMock.user.findUnique.mockResolvedValue(ADMIN_USER);

        const res = await request
            .get("/api/v1/coupons/my-referral-link")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

        expect(res.status).toBe(403);
    });
});

// ─── POST /api/v1/members/me with referralCode ────────────────────────────────

describe("POST /api/v1/members/me — Member profile creation with referral code", () => {
    beforeEach(() => {
        resetMocks();
        prismaMock.user.findUnique.mockResolvedValue(MEMBER_USER);
        // No existing member profile
        prismaMock.member.findUnique.mockResolvedValue(null);
        prismaMock.member.create.mockResolvedValue(MEMBER_RECORD);
    });

    it("201 — creates member profile successfully (no referral code)", async () => {
        const res = await request
            .post("/api/v1/members/me")
            .set("Authorization", `Bearer ${MEMBER_TOKEN}`)
            .send({
                firstName: "John",
                lastName: "Doe",
                phone: "9876543210",
                gender: "MALE",
            });

        expect(res.status).toBe(201);
    });

    it("201 — creates member profile and tracks referral code (fire-and-forget)", async () => {
        // Referral link exists
        prismaMock.referralLink.findUnique.mockResolvedValue({
            id: "link-1",
            memberId: "other-member-id",
            code: "REF-ALICE",
            member: { id: "other-member-id", userId: "other-user-id" },
        });
        // No existing referral for this member
        prismaMock.referral.findUnique.mockResolvedValue(null);
        prismaMock.referral.create.mockResolvedValue({});
        prismaMock.referralLink.update.mockResolvedValue({});

        const res = await request
            .post("/api/v1/members/me")
            .set("Authorization", `Bearer ${MEMBER_TOKEN}`)
            .send({
                firstName: "John",
                lastName: "Doe",
                phone: "9876543210",
                gender: "MALE",
                referralCode: "REF-ALICE",
            });

        // Registration still succeeds regardless of referral tracking result
        expect(res.status).toBe(201);
    });

    it("201 — registration succeeds even with an invalid referral code", async () => {
        // Invalid code — referral link not found
        prismaMock.referralLink.findUnique.mockResolvedValue(null);

        const res = await request
            .post("/api/v1/members/me")
            .set("Authorization", `Bearer ${MEMBER_TOKEN}`)
            .send({
                firstName: "John",
                lastName: "Doe",
                phone: "9876543210",
                gender: "MALE",
                referralCode: "REF-INVALID",
            });

        // Should still succeed — referral errors are swallowed
        expect(res.status).toBe(201);
    });
});

// ─── POST /api/v1/admins/memberships with couponCode ─────────────────────────

describe("POST /api/v1/admins/memberships — Admin assigns membership with coupon", () => {
    beforeEach(() => {
        resetMocks();
        prismaMock.user.findUnique.mockResolvedValue(ADMIN_USER);
        prismaMock.member.findUnique.mockResolvedValue(MEMBER_RECORD);
        prismaMock.membershipPlan.findUnique.mockResolvedValue(PLAN);
    });

    it("201 — assigns membership with valid couponCode, CouponUsage created", async () => {
        // Coupon validation
        prismaMock.coupon.findUnique.mockResolvedValue(COUPON);
        prismaMock.couponUsage.count.mockResolvedValue(0);

        // Transaction: create membership + coupon usage + increment
        prismaMock.membership.create.mockResolvedValue(MEMBERSHIP);
        prismaMock.couponUsage.create.mockResolvedValue({
            id: "usage-1",
            couponId: "coupon-1",
            memberId: "member-1",
            discountApplied: "400",
        });
        prismaMock.coupon.update.mockResolvedValue({ ...COUPON, usageCount: 1 });

        const res = await request
            .post("/api/v1/admins/memberships")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .send({ memberId: "member-1", planId: "plan-1", couponCode: "SUMMER20" });

        expect(res.status).toBe(201);
        expect(res.body.message).toContain("assigned");
    });

    it("404 — invalid couponCode returns 404", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue(null); // coupon not found

        const res = await request
            .post("/api/v1/admins/memberships")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .send({ memberId: "member-1", planId: "plan-1", couponCode: "BADCODE" });

        expect(res.status).toBe(404);
    });

    it("409 — coupon already used by same member", async () => {
        prismaMock.coupon.findUnique.mockResolvedValue(COUPON);
        prismaMock.couponUsage.count.mockResolvedValue(1); // already used

        const res = await request
            .post("/api/v1/admins/memberships")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .send({ memberId: "member-1", planId: "plan-1", couponCode: "SUMMER20" });

        expect(res.status).toBe(409);
    });

    it("201 — assigns membership without couponCode (no discount)", async () => {
        prismaMock.membership.create.mockResolvedValue(MEMBERSHIP);

        const res = await request
            .post("/api/v1/admins/memberships")
            .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
            .send({ memberId: "member-1", planId: "plan-1" });

        expect(res.status).toBe(201);
    });
});
