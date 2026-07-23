/**
 * Unit Tests for Utility Functions:
 *  - ErrorHandler.utility.js
 *  - generateToken.utility.js
 *  - cookieOptions.utility.js
 */
import { describe, it, expect } from "@jest/globals";
import ErrorHandler from "../../src/utility/ErrorHandler.utility.js";
import generateToken from "../../src/utility/generateToken.utility.js";
import cookieOptions from "../../src/utility/cookieOptions.utility.js";
import jwt from "jsonwebtoken";

describe("ErrorHandler Utility (ErrorHandler.utility.js)", () => {
    it("should instantiate Error with message and statusCode", () => {
        const err = new ErrorHandler("Resource not found", 404);

        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Resource not found");
        expect(err.statusCode).toBe(404);
        expect(err.stack).toBeDefined();
    });

    it("should set custom status codes correctly", () => {
        const err = new ErrorHandler("Conflict occurred", 409);
        expect(err.statusCode).toBe(409);
    });
});

describe("Generate Token Utility (generateToken.utility.js)", () => {
    it("should generate a valid signed JWT with provided payload", () => {
        const payload = { id: "u-123", username: "john", role: "MEMBER" };
        const token = generateToken(payload);

        expect(typeof token).toBe("string");

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        expect(decoded.id).toBe("u-123");
        expect(decoded.username).toBe("john");
        expect(decoded.role).toBe("MEMBER");
    });
});

describe("Cookie Options Utility (cookieOptions.utility.js)", () => {
    it("should export correct cookie configurations", () => {
        expect(cookieOptions.httpOnly).toBe(true);
        expect(cookieOptions.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
        expect(["lax", "none"]).toContain(cookieOptions.sameSite);
    });
});
