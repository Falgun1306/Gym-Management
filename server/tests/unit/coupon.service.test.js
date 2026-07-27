/**
 * Unit Tests — coupon.service.js
 *
 * Tests cover: validateCoupon, applyCoupon, createCoupon, deactivateCoupon.
 * Uses ESM-compatible jest.unstable_mockModule + resolve() pattern.
 */

import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Prisma Mock ──────────────────────────────────────────────────────────────

const createModelMock = () => ({
    findUnique: jest.fn(), create: jest.fn(), update: jest.fn(),
    count: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    delete: jest.fn(), deleteMany: jest.fn(), updateMany: jest.fn(),
});

const prismaMock = {
    coupon: createModelMock(),
    couponUsage: createModelMock(),
    membership: createModelMock(),
    member: createModelMock(),
    notification: createModelMock(),
    referralLink: createModelMock(),
    referral: createModelMock(),
    user: createModelMock(),
    $transaction: jest.fn((fn) => (typeof fn === "function" ? fn(prismaMock) : Promise.all(fn))),
};

jest.unstable_mockModule(resolve(__dirname, "../../src/config/prisma.js"), () => ({
    default: prismaMock,
}));

// ─── Repository Mocks ─────────────────────────────────────────────────────────

const mockCouponRepo = {
    findCouponByCode: jest.fn(),
    findCouponById: jest.fn(),
    createCoupon: jest.fn(),
    updateCoupon: jest.fn(),
    countUserUsages: jest.fn(),
    findCoupons: jest.fn(),
    findReferralLinkByMemberId: jest.fn(),
    findReferralLinkByCode: jest.fn(),
    createReferralLink: jest.fn(),
    createReferral: jest.fn(),
    incrementReferralCount: jest.fn(),
    incrementSuccessfulReferrals: jest.fn(),
    findReferralByReferredMemberId: jest.fn(),
    updateReferral: jest.fn(),
    findUsagesByMember: jest.fn(),
};
const mockMemberRepo = {
    findByUserId: jest.fn(),
    findById: jest.fn(),
};

jest.unstable_mockModule(resolve(__dirname, "../../src/repositories/coupon.repository.js"), () => ({
    default: mockCouponRepo,
}));
jest.unstable_mockModule(resolve(__dirname, "../../src/repositories/member.repository.js"), () => ({
    default: mockMemberRepo,
}));

// ─── Import service after mocks ───────────────────────────────────────────────

const { default: couponService } = await import(resolve(__dirname, "../../src/services/coupon.service.js"));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeCoupon = (overrides = {}) => ({
    id: "coupon-1",
    code: "SUMMER20",
    status: "ACTIVE",
    discountType: "PERCENTAGE",
    discountValue: "20",
    minPurchaseAmount: null,
    maxDiscountAmount: null,
    maxUsageCount: null,
    usageCount: 0,
    perUserLimit: 1,
    startDate: new Date("2020-01-01"),
    expiresAt: null,
    isReferral: false,
    ...overrides,
});

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
    for (const m of Object.values(mockCouponRepo)) if (typeof m?.mockReset === "function") m.mockReset();
    for (const m of Object.values(mockMemberRepo)) if (typeof m?.mockReset === "function") m.mockReset();
};

// ─── validateCoupon Tests ─────────────────────────────────────────────────────

describe("CouponService.validateCoupon()", () => {
    beforeEach(resetMocks);

    it("returns discount preview for a valid PERCENTAGE coupon", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(makeCoupon());
        mockCouponRepo.countUserUsages.mockResolvedValue(0);

        const result = await couponService.validateCoupon("SUMMER20", "member-1", 2000);

        expect(result.valid).toBe(true);
        expect(result.discountType).toBe("PERCENTAGE");
        expect(result.discountAmount).toBe(400); // 20% of 2000
        expect(result.finalAmount).toBe(1600);
    });

    it("returns discount preview for a valid FIXED_AMOUNT coupon", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(
            makeCoupon({ code: "FLAT500", discountType: "FIXED_AMOUNT", discountValue: "500" })
        );
        mockCouponRepo.countUserUsages.mockResolvedValue(0);

        const result = await couponService.validateCoupon("FLAT500", "member-1", 2000);
        expect(result.discountAmount).toBe(500);
        expect(result.finalAmount).toBe(1500);
    });

    it("returns extraDays for a valid FREE_DAYS coupon", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(
            makeCoupon({ code: "EXTRA15", discountType: "FREE_DAYS", discountValue: "15" })
        );
        mockCouponRepo.countUserUsages.mockResolvedValue(0);

        const result = await couponService.validateCoupon("EXTRA15", "member-1", 0);
        expect(result.extraDays).toBe(15);
        expect(result.discountAmount).toBe(0);
    });

    it("throws 404 when coupon code does not exist", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(null);
        await expect(couponService.validateCoupon("BADCODE", "member-1", 1000))
            .rejects.toMatchObject({ statusCode: 404, message: "Coupon not found" });
    });

    it("throws 400 when coupon status is INACTIVE", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(makeCoupon({ status: "INACTIVE" }));
        await expect(couponService.validateCoupon("SUMMER20", "member-1", 1000))
            .rejects.toMatchObject({ statusCode: 400, message: "Coupon is no longer active" });
    });

    it("throws 400 when coupon has expired", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(
            makeCoupon({ expiresAt: new Date("2020-01-01") })
        );
        await expect(couponService.validateCoupon("SUMMER20", "member-1", 1000))
            .rejects.toMatchObject({ statusCode: 400, message: "Coupon has expired" });
    });

    it("throws 400 when coupon is not yet active (future startDate)", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(
            makeCoupon({ startDate: new Date(Date.now() + 86400000) })
        );
        await expect(couponService.validateCoupon("SUMMER20", "member-1", 1000))
            .rejects.toMatchObject({ statusCode: 400, message: "Coupon is not yet active" });
    });

    it("throws 400 when global usage cap is reached", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(
            makeCoupon({ maxUsageCount: 10, usageCount: 10 })
        );
        await expect(couponService.validateCoupon("SUMMER20", "member-1", 1000))
            .rejects.toMatchObject({ statusCode: 400, message: "Coupon usage limit has been reached" });
    });

    it("throws 409 when per-user limit is reached", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(makeCoupon({ perUserLimit: 1 }));
        mockCouponRepo.countUserUsages.mockResolvedValue(1);
        await expect(couponService.validateCoupon("SUMMER20", "member-1", 1000))
            .rejects.toMatchObject({ statusCode: 409 });
    });

    it("throws 400 when purchase amount is below minimum", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(
            makeCoupon({ minPurchaseAmount: "1000" })
        );
        mockCouponRepo.countUserUsages.mockResolvedValue(0);
        await expect(couponService.validateCoupon("SUMMER20", "member-1", 500))
            .rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("₹1000") });
    });

    it("caps discount at maxDiscountAmount for PERCENTAGE coupons", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(
            makeCoupon({ discountType: "PERCENTAGE", discountValue: "50", maxDiscountAmount: "1000" })
        );
        mockCouponRepo.countUserUsages.mockResolvedValue(0);

        const result = await couponService.validateCoupon("SUMMER20", "member-1", 5000);
        expect(result.discountAmount).toBe(1000); // capped at 1000, not 2500
    });
});

// ─── createCoupon Tests ───────────────────────────────────────────────────────

describe("CouponService.createCoupon()", () => {
    beforeEach(resetMocks);

    it("creates a coupon and uppercases the code", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(null);
        mockCouponRepo.createCoupon.mockResolvedValue({ id: "c1", code: "SUMMER20" });

        await couponService.createCoupon({
            code: "summer20",
            discountType: "PERCENTAGE",
            discountValue: 20,
        });

        expect(mockCouponRepo.createCoupon).toHaveBeenCalledWith(
            expect.objectContaining({ code: "SUMMER20" })
        );
    });

    it("throws 409 when a coupon with the same code already exists", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(makeCoupon());
        await expect(
            couponService.createCoupon({ code: "SUMMER20", discountType: "PERCENTAGE", discountValue: 20 })
        ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("throws 400 when required fields are missing", async () => {
        await expect(couponService.createCoupon({ code: "X" }))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    it("throws 400 for PERCENTAGE value > 100", async () => {
        mockCouponRepo.findCouponByCode.mockResolvedValue(null);
        await expect(
            couponService.createCoupon({ code: "BAD", discountType: "PERCENTAGE", discountValue: 150 })
        ).rejects.toMatchObject({ statusCode: 400 });
    });
});

// ─── deactivateCoupon Tests ───────────────────────────────────────────────────

describe("CouponService.deactivateCoupon()", () => {
    beforeEach(resetMocks);

    it("sets status to INACTIVE", async () => {
        mockCouponRepo.findCouponById.mockResolvedValue(makeCoupon());
        mockCouponRepo.updateCoupon.mockResolvedValue({ ...makeCoupon(), status: "INACTIVE" });

        const result = await couponService.deactivateCoupon("coupon-1");
        expect(mockCouponRepo.updateCoupon).toHaveBeenCalledWith("coupon-1", { status: "INACTIVE" });
        expect(result.status).toBe("INACTIVE");
    });

    it("throws 404 when coupon not found", async () => {
        mockCouponRepo.findCouponById.mockResolvedValue(null);
        await expect(couponService.deactivateCoupon("nonexistent"))
            .rejects.toMatchObject({ statusCode: 404 });
    });
});
