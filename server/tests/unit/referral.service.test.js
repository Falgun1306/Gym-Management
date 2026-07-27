/**
 * Unit Tests — Referral logic in coupon.service.js
 *
 * Tests: getMyReferralLink, trackReferralSignup, grantReferralRewards
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

const makeMember = (overrides = {}) => ({ id: "member-1", userId: "user-1", ...overrides });
const makeReferralLink = (overrides = {}) => ({
    id: "link-1",
    memberId: "member-1",
    code: "REF-JOHN",
    totalReferrals: 0,
    successfulReferrals: 0,
    member: { id: "member-1", userId: "user-1" },
    referrals: [],
    ...overrides,
});
const makeReferral = (overrides = {}) => ({
    id: "ref-1",
    referralLinkId: "link-1",
    referredMemberId: "member-2",
    referrerRewardGranted: false,
    refereeRewardGranted: false,
    referralLink: makeReferralLink(),
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

// ─── getMyReferralLink ────────────────────────────────────────────────────────

describe("CouponService.getMyReferralLink()", () => {
    beforeEach(resetMocks);

    it("returns existing referral link without creating a new one", async () => {
        mockMemberRepo.findByUserId.mockResolvedValue(makeMember());
        mockCouponRepo.findReferralLinkByMemberId.mockResolvedValue(makeReferralLink());

        const { referralLink, created } = await couponService.getMyReferralLink("user-1");

        expect(created).toBe(false);
        expect(referralLink.code).toBe("REF-JOHN");
        expect(mockCouponRepo.createReferralLink).not.toHaveBeenCalled();
    });

    it("creates and returns a new referral link on first call", async () => {
        mockMemberRepo.findByUserId.mockResolvedValue(makeMember());
        mockCouponRepo.findReferralLinkByMemberId.mockResolvedValue(null);
        prismaMock.user.findUnique.mockResolvedValue({ username: "john123" });
        mockCouponRepo.findReferralLinkByCode.mockResolvedValue(null); // code is unique
        mockCouponRepo.createReferralLink.mockResolvedValue(makeReferralLink({ code: "REF-JOHN123" }));

        const { referralLink, created } = await couponService.getMyReferralLink("user-1");

        expect(created).toBe(true);
        expect(mockCouponRepo.createReferralLink).toHaveBeenCalledWith(
            expect.objectContaining({ code: expect.stringContaining("REF-") })
        );
    });

    it("throws 404 when member profile not found", async () => {
        mockMemberRepo.findByUserId.mockResolvedValue(null);
        await expect(couponService.getMyReferralLink("user-99"))
            .rejects.toMatchObject({ statusCode: 404 });
    });
});

// ─── trackReferralSignup ──────────────────────────────────────────────────────

describe("CouponService.trackReferralSignup()", () => {
    beforeEach(resetMocks);

    it("creates a Referral row and increments totalReferrals for a valid code", async () => {
        mockCouponRepo.findReferralLinkByCode.mockResolvedValue(makeReferralLink());
        mockCouponRepo.findReferralByReferredMemberId.mockResolvedValue(null);
        mockCouponRepo.createReferral.mockResolvedValue({});
        mockCouponRepo.incrementReferralCount.mockResolvedValue({});

        const result = await couponService.trackReferralSignup("REF-JOHN", "member-2");

        expect(result).not.toBeNull();
        expect(mockCouponRepo.createReferral).toHaveBeenCalled();
        expect(mockCouponRepo.incrementReferralCount).toHaveBeenCalled();
    });

    it("returns null silently for an invalid referral code", async () => {
        mockCouponRepo.findReferralLinkByCode.mockResolvedValue(null);

        const result = await couponService.trackReferralSignup("REF-BADCODE", "member-2");

        expect(result).toBeNull();
        expect(mockCouponRepo.createReferral).not.toHaveBeenCalled();
    });

    it("throws 400 when member tries to use own referral code", async () => {
        mockCouponRepo.findReferralLinkByCode.mockResolvedValue(makeReferralLink({ memberId: "member-SELF" }));

        await expect(couponService.trackReferralSignup("REF-JOHN", "member-SELF"))
            .rejects.toMatchObject({ statusCode: 400, message: "You cannot refer yourself" });
    });

    it("returns null silently when member was already referred", async () => {
        mockCouponRepo.findReferralLinkByCode.mockResolvedValue(makeReferralLink());
        mockCouponRepo.findReferralByReferredMemberId.mockResolvedValue(makeReferral());

        const result = await couponService.trackReferralSignup("REF-JOHN", "member-2");

        expect(result).toBeNull();
        expect(mockCouponRepo.createReferral).not.toHaveBeenCalled();
    });
});

// ─── grantReferralRewards ─────────────────────────────────────────────────────

describe("CouponService.grantReferralRewards()", () => {
    beforeEach(resetMocks);

    it("returns null when member was not referred", async () => {
        mockCouponRepo.findReferralByReferredMemberId.mockResolvedValue(null);

        const result = await couponService.grantReferralRewards("member-99");
        expect(result).toBeNull();
    });

    it("is idempotent: skips transaction when both rewards already granted", async () => {
        mockCouponRepo.findReferralByReferredMemberId.mockResolvedValue(
            makeReferral({ referrerRewardGranted: true, refereeRewardGranted: true })
        );

        const result = await couponService.grantReferralRewards("member-2");

        // Should return the referral immediately without granting rewards
        expect(result).not.toBeNull();
        // No DB writes should occur — referral.update is the signal that reward logic ran
        expect(prismaMock.referral.update).not.toHaveBeenCalled();
        expect(prismaMock.coupon.create).not.toHaveBeenCalled();
        expect(prismaMock.membership.update).not.toHaveBeenCalled();
    });

    it("extends referrer membership by REFERRAL_BONUS_DAYS on first successful payment", async () => {
        mockCouponRepo.findReferralByReferredMemberId
            .mockResolvedValueOnce(makeReferral())
            .mockResolvedValueOnce(makeReferral({ referrerRewardGranted: true, refereeRewardGranted: true }));

        prismaMock.membership.findFirst.mockResolvedValue({
            id: "ms-1",
            endDate: new Date("2026-12-31"),
        });
        prismaMock.membership.update.mockResolvedValue({});
        prismaMock.notification.create.mockResolvedValue({});
        prismaMock.coupon.create.mockResolvedValue({ id: "bonus-coupon", code: "REF-BONUS-XXXXXXXX" });
        prismaMock.member.findUnique.mockResolvedValue({ userId: "user-2" });
        prismaMock.referral.update.mockResolvedValue({});

        await couponService.grantReferralRewards("member-2");

        expect(prismaMock.membership.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "ms-1" },
                data: expect.objectContaining({ endDate: expect.any(Object) }),
            })
        );
    });

    it("creates a personal referee coupon for the referred member", async () => {
        mockCouponRepo.findReferralByReferredMemberId
            .mockResolvedValueOnce(makeReferral())
            .mockResolvedValueOnce(makeReferral({ refereeRewardGranted: true }));

        prismaMock.membership.findFirst.mockResolvedValue({ id: "ms-1", endDate: new Date("2026-12-31") });
        prismaMock.membership.update.mockResolvedValue({});
        prismaMock.notification.create.mockResolvedValue({});
        prismaMock.coupon.create.mockResolvedValue({ id: "bonus-c", code: "REF-BONUS-MEMBER2XX" });
        prismaMock.member.findUnique.mockResolvedValue({ userId: "user-2" });
        prismaMock.referral.update.mockResolvedValue({});

        await couponService.grantReferralRewards("member-2");

        expect(prismaMock.coupon.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    discountType: "PERCENTAGE",
                    discountValue: 15,
                    isReferral: true,
                    maxUsageCount: 1,
                }),
            })
        );
    });

    it("gracefully skips referrer reward when referrer has no active membership", async () => {
        mockCouponRepo.findReferralByReferredMemberId
            .mockResolvedValueOnce(makeReferral())
            .mockResolvedValueOnce(makeReferral({ refereeRewardGranted: true }));

        prismaMock.membership.findFirst.mockResolvedValue(null); // no active membership
        prismaMock.notification.create.mockResolvedValue({});
        prismaMock.coupon.create.mockResolvedValue({ id: "bonus-c", code: "REF-BONUS-XX" });
        prismaMock.member.findUnique.mockResolvedValue({ userId: "user-2" });
        prismaMock.referral.update.mockResolvedValue({});

        await expect(couponService.grantReferralRewards("member-2")).resolves.not.toThrow();
        expect(prismaMock.membership.update).not.toHaveBeenCalled();
    });
});
