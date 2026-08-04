/**
 * Unit Tests for Membership Freeze / Pause Functionality
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createModelMock = () => ({
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    count: jest.fn(), aggregate: jest.fn(), upsert: jest.fn(),
    deleteMany: jest.fn(), updateMany: jest.fn(), createMany: jest.fn(),
});

const prismaMock = {
    user: createModelMock(), member: createModelMock(), trainer: createModelMock(),
    membership: createModelMock(), membershipPlan: createModelMock(),
    notification: createModelMock(),
    $transaction: jest.fn((fn) => (typeof fn === "function" ? fn(prismaMock) : Promise.all(fn))),
    $connect: jest.fn(), $disconnect: jest.fn(),
};

jest.unstable_mockModule(resolve(__dirname, "../../src/config/prisma.js"), () => ({
    default: prismaMock,
}));

const { default: memberService } = await import("../../src/services/member.service.js");
const { default: adminService } = await import("../../src/services/admin.service.js");
const { default: memberRepository } = await import("../../src/repositories/member.repository.js");

describe("Membership Freeze / Pause Functionality", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("memberService.freezeMembership", () => {
        it("should successfully freeze an ACTIVE membership for valid duration (7-28 days)", async () => {
            const userId = "u-1";
            const membershipId = "ms-1";
            const memberMock = { id: "m-1", userId };
            const membershipMock = {
                id: membershipId,
                memberId: "m-1",
                status: "ACTIVE",
                freezeCount: 0,
                plan: { name: "Gold Plan" },
            };

            jest.spyOn(memberRepository, "findByUserId").mockResolvedValue(memberMock);
            prismaMock.membership.findUnique.mockResolvedValue(membershipMock);
            prismaMock.membership.update.mockResolvedValue({
                ...membershipMock,
                status: "FROZEN",
                freezeCount: 1,
            });
            prismaMock.notification.create.mockResolvedValue({ id: "notif-1" });

            const result = await memberService.freezeMembership(userId, membershipId, {
                durationDays: 14,
                reason: "Vacation",
            });

            expect(prismaMock.membership.update).toHaveBeenCalledWith({
                where: { id: membershipId },
                data: {
                    status: "FROZEN",
                    frozenAt: expect.any(Date),
                    freezeDurationDays: 14,
                    freezeReason: "Vacation",
                    freezeCount: { increment: 1 },
                },
                include: { plan: true },
            });
            expect(prismaMock.notification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: "u-1",
                    title: "Membership Frozen",
                    type: "MEMBERSHIP",
                }),
            });
            expect(result.status).toBe("FROZEN");
        });

        it("should throw 404 if member profile does not exist", async () => {
            jest.spyOn(memberRepository, "findByUserId").mockResolvedValue(null);

            await expect(
                memberService.freezeMembership("u-999", "ms-1", { durationDays: 14 })
            ).rejects.toThrow("Member profile not found");
        });

        it("should throw 404 if membership is not found", async () => {
            jest.spyOn(memberRepository, "findByUserId").mockResolvedValue({ id: "m-1" });
            prismaMock.membership.findUnique.mockResolvedValue(null);

            await expect(
                memberService.freezeMembership("u-1", "ms-999", { durationDays: 14 })
            ).rejects.toThrow("Membership not found");
        });

        it("should throw 403 if membership belongs to another member", async () => {
            jest.spyOn(memberRepository, "findByUserId").mockResolvedValue({ id: "m-1" });
            prismaMock.membership.findUnique.mockResolvedValue({
                id: "ms-1",
                memberId: "m-other",
            });

            await expect(
                memberService.freezeMembership("u-1", "ms-1", { durationDays: 14 })
            ).rejects.toThrow("This membership does not belong to you");
        });

        it("should throw 400 if membership is not ACTIVE", async () => {
            jest.spyOn(memberRepository, "findByUserId").mockResolvedValue({ id: "m-1" });
            prismaMock.membership.findUnique.mockResolvedValue({
                id: "ms-1",
                memberId: "m-1",
                status: "EXPIRED",
            });

            await expect(
                memberService.freezeMembership("u-1", "ms-1", { durationDays: 14 })
            ).rejects.toThrow("Cannot freeze a membership with status EXPIRED");
        });

        it("should throw 400 if membership has already been frozen once (freezeCount >= 1)", async () => {
            jest.spyOn(memberRepository, "findByUserId").mockResolvedValue({ id: "m-1" });
            prismaMock.membership.findUnique.mockResolvedValue({
                id: "ms-1",
                memberId: "m-1",
                status: "ACTIVE",
                freezeCount: 1,
            });

            await expect(
                memberService.freezeMembership("u-1", "ms-1", { durationDays: 14 })
            ).rejects.toThrow("This membership has already been frozen once. Each membership can only be paused 1 time.");
        });

        it("should throw 400 if freeze duration is less than 7 days", async () => {
            jest.spyOn(memberRepository, "findByUserId").mockResolvedValue({ id: "m-1" });
            prismaMock.membership.findUnique.mockResolvedValue({
                id: "ms-1",
                memberId: "m-1",
                status: "ACTIVE",
                freezeCount: 0,
            });

            await expect(
                memberService.freezeMembership("u-1", "ms-1", { durationDays: 5 })
            ).rejects.toThrow("Freeze duration must be between 7 and 28 days");
        });

        it("should throw 400 if freeze duration is greater than 28 days", async () => {
            jest.spyOn(memberRepository, "findByUserId").mockResolvedValue({ id: "m-1" });
            prismaMock.membership.findUnique.mockResolvedValue({
                id: "ms-1",
                memberId: "m-1",
                status: "ACTIVE",
                freezeCount: 0,
            });

            await expect(
                memberService.freezeMembership("u-1", "ms-1", { durationDays: 30 })
            ).rejects.toThrow("Freeze duration must be between 7 and 28 days");
        });
    });

    describe("memberService.unfreezeMembership", () => {
        it("should successfully unfreeze a FROZEN membership and extend endDate", async () => {
            const userId = "u-1";
            const membershipId = "ms-1";
            const frozenAt = new Date();
            frozenAt.setDate(frozenAt.getDate() - 10); // frozen 10 days ago

            const initialEndDate = new Date();
            initialEndDate.setDate(initialEndDate.getDate() + 20);

            const memberMock = { id: "m-1", userId };
            const membershipMock = {
                id: membershipId,
                memberId: "m-1",
                status: "FROZEN",
                frozenAt,
                endDate: initialEndDate,
                plan: { name: "Gold Plan" },
            };

            jest.spyOn(memberRepository, "findByUserId").mockResolvedValue(memberMock);
            prismaMock.membership.findUnique.mockResolvedValue(membershipMock);
            prismaMock.membership.update.mockImplementation(({ data }) => Promise.resolve({
                ...membershipMock,
                status: data.status,
                endDate: data.endDate,
            }));
            prismaMock.notification.create.mockResolvedValue({ id: "notif-2" });

            const result = await memberService.unfreezeMembership(userId, membershipId);

            expect(result.status).toBe("ACTIVE");
            expect(prismaMock.membership.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: membershipId },
                    data: expect.objectContaining({
                        status: "ACTIVE",
                        frozenAt: null,
                    }),
                })
            );
            expect(prismaMock.notification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: "u-1",
                    title: "Membership Resumed",
                }),
            });
        });

        it("should throw 400 if membership is not currently frozen", async () => {
            jest.spyOn(memberRepository, "findByUserId").mockResolvedValue({ id: "m-1" });
            prismaMock.membership.findUnique.mockResolvedValue({
                id: "ms-1",
                memberId: "m-1",
                status: "ACTIVE",
                frozenAt: null,
            });

            await expect(
                memberService.unfreezeMembership("u-1", "ms-1")
            ).rejects.toThrow("This membership is not currently frozen");
        });
    });

    describe("adminService.unfreezeMembership", () => {
        it("should allow admin to unfreeze a FROZEN membership", async () => {
            const membershipId = "ms-1";
            const frozenAt = new Date();
            frozenAt.setDate(frozenAt.getDate() - 5);

            const membershipMock = {
                id: membershipId,
                memberId: "m-1",
                status: "FROZEN",
                frozenAt,
                endDate: new Date(),
                plan: { name: "Platinum Plan" },
                member: { userId: "u-1", firstName: "Alice" },
            };

            prismaMock.membership.findUnique.mockResolvedValue(membershipMock);
            prismaMock.membership.update.mockResolvedValue({
                ...membershipMock,
                status: "ACTIVE",
            });
            prismaMock.notification.create.mockResolvedValue({ id: "notif-3" });

            const result = await adminService.unfreezeMembership(membershipId);

            expect(result.status).toBe("ACTIVE");
            expect(prismaMock.notification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: "u-1",
                    title: "Membership Resumed by Admin",
                }),
            });
        });
    });
});
