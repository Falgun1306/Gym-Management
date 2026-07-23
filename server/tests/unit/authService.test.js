import { jest, describe, it, expect } from "@jest/globals";
import authService from "../../src/services/auth.service.js";
import userRepository from "../../src/repositories/user.repository.js";
import argon2 from "argon2";

describe("auth.service — AuthService", () => {
    it("should successfully register a new user", async () => {
        jest.spyOn(userRepository, "findByEmail").mockResolvedValue(null);
        jest.spyOn(userRepository, "findByUsername").mockResolvedValue(null);
        jest.spyOn(argon2, "hash").mockImplementation(async () => "hashedpass");
        jest.spyOn(userRepository, "create").mockResolvedValue({
            id: "u-1",
            username: "testuser",
            email: "test@example.com",
            role: "MEMBER",
        });

        const result = await authService.register({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
            confirmPassword: "password123",
        });

        expect(result.user.id).toBe("u-1");
        expect(result.token).toBeDefined();
    });

    it("should throw 400 if email already exists during registration", async () => {
        jest.spyOn(userRepository, "findByEmail").mockResolvedValue({ id: "u-existing", email: "existing@example.com" });

        await expect(
            authService.register({
                username: "newuser",
                email: "existing@example.com",
                password: "password123",
                confirmPassword: "password123",
            })
        ).rejects.toThrow("Email already exists");
    });
});
