/**
 * Unit Tests for Middlewares:
 *  - auth.middleware.js
 *  - authorize.middleware.js
 *  - asyncHandler.middleware.js
 */
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import ErrorHandler from "../../src/utility/ErrorHandler.utility.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Prisma Mock ────────────────────────────────────────────────────────────

const prismaMock = {
    user: {
        findUnique: jest.fn(),
    },
};

jest.unstable_mockModule(resolve(__dirname, "../../src/config/prisma.js"), () => ({
    default: prismaMock,
}));

// ─── Dynamic imports ────────────────────────────────────────────────────────

const { default: auth } = await import("../../src/middlewares/auth.middleware.js");
const { default: authorize } = await import("../../src/middlewares/authorize.middleware.js");
const { default: asyncHandler } = await import("../../src/middlewares/asyncHandler.middleware.js");
const jwt = (await import("jsonwebtoken")).default;

describe("Auth Middleware (auth.middleware.js)", () => {
    let req, res, next;

    beforeEach(() => {
        req = { cookies: {}, headers: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        prismaMock.user.findUnique.mockReset();
    });

    it("should pass req.user and call next() when valid token is in cookie", async () => {
        const token = jwt.sign({ id: "user-123" }, process.env.JWT_SECRET || "secret");
        req.cookies.token = token;

        const fakeUser = { id: "user-123", username: "john", role: "MEMBER" };
        prismaMock.user.findUnique.mockResolvedValue(fakeUser);

        await auth(req, res, next);

        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-123" } });
        expect(req.user).toEqual(fakeUser);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should pass req.user when valid token is in Authorization header", async () => {
        const token = jwt.sign({ id: "user-456" }, process.env.JWT_SECRET || "secret");
        req.headers.authorization = `Bearer ${token}`;

        const fakeUser = { id: "user-456", username: "alice", role: "ADMIN" };
        prismaMock.user.findUnique.mockResolvedValue(fakeUser);

        await auth(req, res, next);

        expect(req.user).toEqual(fakeUser);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should pass 401 ErrorHandler to next() if no token is provided", async () => {
        await auth(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Authentication required",
                statusCode: 401,
            })
        );
    });

    it("should pass 401 ErrorHandler to next() if token is invalid or expired", async () => {
        req.cookies.token = "invalid.jwt.token";

        await auth(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Invalid or expired token",
                statusCode: 401,
            })
        );
    });

    it("should pass 401 ErrorHandler to next() if user no longer exists in database", async () => {
        const token = jwt.sign({ id: "ghost-user" }, process.env.JWT_SECRET || "secret");
        req.cookies.token = token;
        prismaMock.user.findUnique.mockResolvedValue(null);

        await auth(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "User no longer exists",
                statusCode: 401,
            })
        );
    });
});

describe("Authorize Middleware (authorize.middleware.js)", () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {};
        next = jest.fn();
    });

    it("should call next() if req.user role is included in allowed roles", () => {
        req.user = { id: "u1", role: "ADMIN" };
        const middleware = authorize("ADMIN", "TRAINER");

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should pass 401 ErrorHandler to next() if req.user is undefined", () => {
        const middleware = authorize("ADMIN");

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(ErrorHandler);
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe("Authentication required");
    });

    it("should pass 403 ErrorHandler to next() if req.user role is not in allowed roles", () => {
        req.user = { id: "u1", role: "MEMBER" };
        const middleware = authorize("ADMIN", "TRAINER");

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(ErrorHandler);
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe("Access denied: insufficient permissions");
    });
});

describe("AsyncHandler Middleware (asyncHandler.middleware.js)", () => {
    it("should resolve async function and call next() with error if thrown", async () => {
        const error = new Error("Async failure");
        const asyncFn = async () => { throw error; };

        const wrapped = asyncHandler(asyncFn);
        const req = {}, res = {}, next = jest.fn();

        wrapped(req, res, next);

        // Wait for promise tick
        await new Promise((r) => setTimeout(r, 10));

        expect(next).toHaveBeenCalledWith(error);
    });
});
