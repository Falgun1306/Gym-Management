/**
 * Automatic mock for src/config/prisma.js
 *
 * Jest automatically picks up this file because it's in __mocks__
 * next to the real file. When any module imports "../config/prisma.js",
 * Jest will use this mock instead during tests.
 *
 * Usage in tests:
 *   import prisma from "../../src/config/prisma.js";
 *   // prisma is now this mock object
 *   prisma.user.findUnique.mockResolvedValue({ ... });
 */
import { jest } from "@jest/globals";

const createModelMock = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
});

const prismaMock = {
    user: createModelMock(),
    member: createModelMock(),
    trainer: createModelMock(),
    trainerApplication: createModelMock(),
    membership: createModelMock(),
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
    notification: createModelMock(),
    complaint: createModelMock(),
    $transaction: jest.fn((fn) => (typeof fn === "function" ? fn(prismaMock) : Promise.all(fn))),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
};

export default prismaMock;
