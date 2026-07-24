/**
 * Unit Tests for Equipment Maintenance Job
 *
 * Source: src/jobs/equipmentMaintenance.job.js
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

jest.unstable_mockModule(resolve(__dirname, "../../../src/config/prisma.js"), () => ({
    default: prismaMock,
}));

const { runEquipmentMaintenanceJob } = await import("../../../src/jobs/equipmentMaintenance.job.js");

describe("EquipmentMaintenance Job", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should send maintenance alerts to admins for equipment due within 3 days", async () => {
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

        prismaMock.equipment.findMany.mockResolvedValue([
            { id: "eq-1", name: "Treadmill X100", maintenanceDate: twoDaysFromNow, status: "AVAILABLE" },
        ]);
        prismaMock.user.findMany.mockResolvedValue([{ id: "admin-1" }]);
        prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

        await runEquipmentMaintenanceJob();

        expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
            data: [
                expect.objectContaining({
                    userId: "admin-1",
                    title: "Equipment Maintenance Due Soon",
                    type: "GENERAL",
                }),
            ],
        });
    });

    it("should send overdue alerts with different title when maintenance date has passed", async () => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        prismaMock.equipment.findMany.mockResolvedValue([
            { id: "eq-1", name: "Bench Press", maintenanceDate: threeDaysAgo, status: "AVAILABLE" },
        ]);
        prismaMock.user.findMany.mockResolvedValue([{ id: "admin-1" }]);
        prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

        await runEquipmentMaintenanceJob();

        expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
            data: [
                expect.objectContaining({
                    userId: "admin-1",
                    title: "Equipment Maintenance Overdue!",
                }),
            ],
        });
    });

    it("should do nothing when no equipment is due for maintenance", async () => {
        prismaMock.equipment.findMany.mockResolvedValue([]);

        await runEquipmentMaintenanceJob();

        expect(prismaMock.user.findMany).not.toHaveBeenCalled();
        expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
    });

    it("should do nothing when no admin users exist", async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        prismaMock.equipment.findMany.mockResolvedValue([
            { id: "eq-1", name: "Dumbbell Set", maintenanceDate: tomorrow, status: "AVAILABLE" },
        ]);
        prismaMock.user.findMany.mockResolvedValue([]);

        await runEquipmentMaintenanceJob();

        expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
    });

    it("should send notifications to all admins for each equipment (cartesian)", async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        prismaMock.equipment.findMany.mockResolvedValue([
            { id: "eq-1", name: "Treadmill", maintenanceDate: tomorrow, status: "AVAILABLE" },
            { id: "eq-2", name: "Rower", maintenanceDate: tomorrow, status: "IN_USE" },
        ]);
        prismaMock.user.findMany.mockResolvedValue([{ id: "admin-1" }, { id: "admin-2" }]);
        prismaMock.notification.createMany.mockResolvedValue({ count: 4 });

        await runEquipmentMaintenanceJob();

        const createManyCall = prismaMock.notification.createMany.mock.calls[0][0];
        expect(createManyCall.data).toHaveLength(4);
    });

    it("should handle database errors gracefully without throwing", async () => {
        prismaMock.equipment.findMany.mockRejectedValue(new Error("Query error"));

        await expect(runEquipmentMaintenanceJob()).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledWith(
            "[EquipmentMaintenance] Error:",
            "Query error"
        );
    });
});
