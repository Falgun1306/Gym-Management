/**
 * Unit Tests for Job Scheduler
 *
 * Source: src/config/jobScheduler.js
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock node-cron before importing the scheduler
const mockTaskStop = jest.fn();
const mockSchedule = jest.fn(() => ({ stop: mockTaskStop }));

jest.unstable_mockModule("node-cron", () => ({
    default: { schedule: mockSchedule },
}));

// Mock all job modules to prevent Prisma imports during testing
jest.unstable_mockModule(resolve(__dirname, "../../../src/jobs/membershipExpiry.job.js"), () => ({
    runMembershipExpiryJob: jest.fn(),
}));
jest.unstable_mockModule(resolve(__dirname, "../../../src/jobs/paymentReminder.job.js"), () => ({
    runPaymentReminderJob: jest.fn(),
}));
jest.unstable_mockModule(resolve(__dirname, "../../../src/jobs/classReminder.job.js"), () => ({
    runClassReminderJob: jest.fn(),
}));
jest.unstable_mockModule(resolve(__dirname, "../../../src/jobs/notificationCleanup.job.js"), () => ({
    runNotificationCleanupJob: jest.fn(),
}));
jest.unstable_mockModule(resolve(__dirname, "../../../src/jobs/attendanceCleanup.job.js"), () => ({
    runAttendanceCleanupJob: jest.fn(),
}));
jest.unstable_mockModule(resolve(__dirname, "../../../src/jobs/equipmentMaintenance.job.js"), () => ({
    runEquipmentMaintenanceJob: jest.fn(),
}));
jest.unstable_mockModule(resolve(__dirname, "../../../src/jobs/noShowMarker.job.js"), () => ({
    runNoShowMarkerJob: jest.fn(),
}));

const { initializeJobs, shutdownJobs } = await import("../../../src/config/jobScheduler.js");

describe("JobScheduler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        shutdownJobs();
    });

    it("should register all 7 cron jobs when initializeJobs() is called", () => {
        initializeJobs();

        expect(mockSchedule).toHaveBeenCalledTimes(7);
    });

    it("should use Asia/Kolkata timezone for all jobs", () => {
        initializeJobs();

        for (const call of mockSchedule.mock.calls) {
            const options = call[2];
            expect(options.timezone).toBe("Asia/Kolkata");
        }
    });

    it("should register correct cron schedules", () => {
        initializeJobs();

        const registeredSchedules = mockSchedule.mock.calls.map((call) => call[0]);

        expect(registeredSchedules).toContain("0 0 * * *");     // MembershipExpiry — midnight
        expect(registeredSchedules).toContain("0 9 * * *");     // PaymentReminder — 9 AM
        expect(registeredSchedules).toContain("0 20 * * *");    // ClassReminder — 8 PM
        expect(registeredSchedules).toContain("0 3 * * 0");     // NotificationCleanup — Sun 3 AM
        expect(registeredSchedules).toContain("59 23 * * *");   // AttendanceCleanup — 11:59 PM
        expect(registeredSchedules).toContain("0 7 * * *");     // EquipmentMaintenance — 7 AM
        expect(registeredSchedules).toContain("0 23 * * *");    // NoShowMarker — 11 PM
    });

    it("should stop all running tasks when shutdownJobs() is called", () => {
        initializeJobs();

        shutdownJobs();

        expect(mockTaskStop).toHaveBeenCalledTimes(7);
    });

    it("should handle multiple init/shutdown cycles correctly", () => {
        initializeJobs();
        shutdownJobs();

        jest.clearAllMocks();

        initializeJobs();
        expect(mockSchedule).toHaveBeenCalledTimes(7);

        shutdownJobs();
        expect(mockTaskStop).toHaveBeenCalledTimes(7);
    });

    it("should not fail when shutdownJobs() is called without prior init", () => {
        expect(() => shutdownJobs()).not.toThrow();
    });
});
