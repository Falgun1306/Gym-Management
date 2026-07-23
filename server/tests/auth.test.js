/**
 * Auth Controller Tests — register, login, logout
 *
 * Routes:
 *   POST /api/v1/users/register
 *   POST /api/v1/users/login
 *   POST /api/v1/users/logout  (auth required)
 */
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Prisma mock ────────────────────────────────────────────────────────────

const createModelMock = () => ({
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    count: jest.fn(), aggregate: jest.fn(), upsert: jest.fn(),
    deleteMany: jest.fn(), updateMany: jest.fn(),
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

// ─── Argon2 mock ────────────────────────────────────────────────────────────

const argon2Mock = {
    hash: jest.fn(),
    verify: jest.fn(),
};

jest.unstable_mockModule("argon2", () => ({
    default: argon2Mock,
}));

// ─── Dynamic imports ────────────────────────────────────────────────────────

const { app } = await import(resolve(__dirname, "../src/app.js"));
const supertest = (await import("supertest")).default;
const jwt = (await import("jsonwebtoken")).default;

const request = supertest(app);

// ─── Helpers ────────────────────────────────────────────────────────────────

const generateTestToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

const resetAllMocks = () => {
    for (const model of Object.values(prismaMock)) {
        if (typeof model === "object" && model !== null) {
            for (const method of Object.values(model)) {
                if (typeof method?.mockReset === "function") method.mockReset();
            }
        }
    }
    prismaMock.$transaction.mockImplementation((fn) =>
        typeof fn === "function" ? fn(prismaMock) : Promise.all(fn)
    );
    argon2Mock.hash.mockReset();
    argon2Mock.verify.mockReset();
};

// ═════════════════════════════════════════════════════════════════════════════
// REGISTER
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/v1/users/register", () => {
    beforeEach(() => resetAllMocks());

    it("should register a new user successfully", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null); // no existing email/username
        argon2Mock.hash.mockResolvedValue("hashed_password");
        prismaMock.user.create.mockResolvedValue({
            id: "new-user-id",
            username: "testuser",
            email: "test@example.com",
            role: "MEMBER",
        });

        const res = await request.post("/api/v1/users/register").send({
            username: "testuser",
            email: "test@example.com",
            password: "Password123",
            confirmpassword: "Password123",
        });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("User created successfully");
        // Should set a cookie
        expect(res.headers["set-cookie"]).toBeDefined();
        expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
        expect(argon2Mock.hash).toHaveBeenCalledWith("Password123");
    });

    it("should reject if required fields are missing", async () => {
        const res = await request.post("/api/v1/users/register").send({
            username: "testuser",
            // missing email, password, confirmpassword
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("All fields are required");
    });

    it("should reject if passwords do not match", async () => {
        const res = await request.post("/api/v1/users/register").send({
            username: "testuser",
            email: "test@example.com",
            password: "Password123",
            confirmpassword: "DifferentPassword",
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("Passwords do not match");
    });

    it("should reject if email already exists", async () => {
        prismaMock.user.findUnique
            .mockResolvedValueOnce({ id: "existing", email: "test@example.com" }); // email exists

        const res = await request.post("/api/v1/users/register").send({
            username: "testuser",
            email: "test@example.com",
            password: "Password123",
            confirmpassword: "Password123",
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("Email already exists");
    });

    it("should reject if username already exists", async () => {
        prismaMock.user.findUnique
            .mockResolvedValueOnce(null) // email check passes
            .mockResolvedValueOnce({ id: "existing", username: "testuser" }); // username exists

        const res = await request.post("/api/v1/users/register").send({
            username: "testuser",
            email: "test@example.com",
            password: "Password123",
            confirmpassword: "Password123",
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("Username already exists");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/v1/users/login", () => {
    beforeEach(() => resetAllMocks());

    it("should login with username successfully", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: "user-1",
            username: "testuser",
            email: "test@example.com",
            password: "hashed_password",
            role: "MEMBER",
        });
        argon2Mock.verify.mockResolvedValue(true);

        const res = await request.post("/api/v1/users/login").send({
            username: "testuser",
            password: "Password123",
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("logged in successfully");
        expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should login with email successfully", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: "user-1",
            username: "testuser",
            email: "test@example.com",
            password: "hashed_password",
            role: "MEMBER",
        });
        argon2Mock.verify.mockResolvedValue(true);

        const res = await request.post("/api/v1/users/login").send({
            email: "test@example.com",
            password: "Password123",
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("should reject if no username/email or password", async () => {
        const res = await request.post("/api/v1/users/login").send({
            password: "Password123",
            // no username or email
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("Username or Email and password are required");
    });

    it("should reject if user not found", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const res = await request.post("/api/v1/users/login").send({
            username: "nonexistent",
            password: "Password123",
        });

        expect(res.status).toBe(401);
        expect(res.body.message).toContain("Invalid username/email or password");
    });

    it("should reject if password is invalid", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: "user-1",
            username: "testuser",
            password: "hashed_password",
        });
        argon2Mock.verify.mockResolvedValue(false);

        const res = await request.post("/api/v1/users/login").send({
            username: "testuser",
            password: "WrongPassword",
        });

        expect(res.status).toBe(401);
        expect(res.body.message).toContain("Invalid username/email or password");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// LOGOUT
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/v1/users/logout", () => {
    beforeEach(() => resetAllMocks());

    it("should logout successfully with valid token", async () => {
        const user = { id: "user-1", username: "testuser", role: "MEMBER" };
        prismaMock.user.findUnique.mockResolvedValue(user);
        const token = generateTestToken({ id: user.id });

        const res = await request
            .post("/api/v1/users/logout")
            .set("Cookie", [`token=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("logged out successfully");
    });

    it("should reject logout without authentication", async () => {
        const res = await request.post("/api/v1/users/logout");

        expect(res.status).toBe(401);
    });
});
