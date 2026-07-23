/**
 * Unit Tests for createTrainerFromMember Service
 *
 * Source: src/services/trainer.service.js
 */
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { createTrainerFromMember } from "../../src/services/trainer.service.js";

describe("trainer.service — createTrainerFromMember", () => {
    let mockTx;

    beforeEach(() => {
        mockTx = {
            member: {
                findUnique: jest.fn(),
            },
            user: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            trainer: {
                findUnique: jest.fn(),
                create: jest.fn(),
            },
        };
    });

    it("should successfully create a trainer from a member record and update user role to TRAINER", async () => {
        const memberData = {
            id: "m-100",
            userId: "u-100",
            firstName: "John",
            lastName: "Doe",
            phone: "9876543210",
            gender: "MALE",
        };
        const userData = { id: "u-100", role: "MEMBER" };
        const createdTrainerData = {
            id: "t-100",
            userId: "u-100",
            firstName: "John",
            lastName: "Doe",
            specialization: "WEIGHT_LOSS",
            salary: 20000,
        };

        mockTx.member.findUnique.mockResolvedValue(memberData);
        mockTx.user.findUnique.mockResolvedValue(userData);
        mockTx.trainer.findUnique.mockResolvedValue(null);
        mockTx.trainer.create.mockResolvedValue(createdTrainerData);
        mockTx.user.update.mockResolvedValue({ ...userData, role: "TRAINER" });

        const result = await createTrainerFromMember(mockTx, {
            userId: "u-100",
            specialization: "WEIGHT_LOSS",
            salary: 20000,
            experience: 4,
            bio: "Experienced trainer",
            certifications: ["CertA"],
            joiningDate: "2026-01-01",
        });

        expect(result).toEqual(createdTrainerData);
        expect(mockTx.member.findUnique).toHaveBeenCalledWith({ where: { userId: "u-100" } });
        expect(mockTx.user.findUnique).toHaveBeenCalledWith({ where: { id: "u-100" } });
        expect(mockTx.trainer.findUnique).toHaveBeenCalledWith({ where: { userId: "u-100" } });
        expect(mockTx.trainer.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: "u-100",
                firstName: "John",
                lastName: "Doe",
                phone: "9876543210",
                gender: "MALE",
                specialization: "WEIGHT_LOSS",
                salary: 20000,
                experience: 4,
                bio: "Experienced trainer",
                certifications: ["CertA"],
            }),
        });
        expect(mockTx.user.update).toHaveBeenCalledWith({
            where: { id: "u-100" },
            data: { role: "TRAINER" },
        });
    });

    it("should throw 400 ErrorHandler if member profile does not exist", async () => {
        mockTx.member.findUnique.mockResolvedValue(null);

        await expect(
            createTrainerFromMember(mockTx, {
                userId: "u-nonexistent",
                specialization: "BODYBUILDING",
            })
        ).rejects.toThrow("Member profile not found");
    });

    it("should throw 404 ErrorHandler if user does not exist", async () => {
        mockTx.member.findUnique.mockResolvedValue({ id: "m-1" });
        mockTx.user.findUnique.mockResolvedValue(null);

        await expect(
            createTrainerFromMember(mockTx, {
                userId: "u-ghost",
                specialization: "BODYBUILDING",
            })
        ).rejects.toThrow("User not found");
    });

    it("should throw 400 ErrorHandler if user is already a TRAINER or ADMIN", async () => {
        mockTx.member.findUnique.mockResolvedValue({ id: "m-1" });
        mockTx.user.findUnique.mockResolvedValue({ id: "u-1", role: "TRAINER" });

        await expect(
            createTrainerFromMember(mockTx, {
                userId: "u-1",
                specialization: "BODYBUILDING",
            })
        ).rejects.toThrow("User is already a TRAINER");
    });

    it("should throw 409 ErrorHandler if trainer profile already exists for user", async () => {
        mockTx.member.findUnique.mockResolvedValue({ id: "m-1" });
        mockTx.user.findUnique.mockResolvedValue({ id: "u-1", role: "MEMBER" });
        mockTx.trainer.findUnique.mockResolvedValue({ id: "t-existing" });

        await expect(
            createTrainerFromMember(mockTx, {
                userId: "u-1",
                specialization: "BODYBUILDING",
            })
        ).rejects.toThrow("Trainer profile already exists for this user");
    });
});
