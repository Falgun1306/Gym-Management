import { jest, describe, it, expect } from "@jest/globals";
import adminService from "../../src/services/admin.service.js";
import userRepository from "../../src/repositories/user.repository.js";

describe("admin.service — AdminService", () => {
    it("should return admin profile", async () => {
        const mockAdmin = { id: "a-1", username: "adminuser", role: "ADMIN" };
        jest.spyOn(userRepository, "findById").mockResolvedValue(mockAdmin);

        const profile = await adminService.getMyProfile("a-1");
        expect(profile.username).toBe("adminuser");
        expect(profile.role).toBe("ADMIN");
    });

    it("should throw 404 if admin user profile not found", async () => {
        jest.spyOn(userRepository, "findById").mockResolvedValue(null);

        await expect(adminService.getMyProfile("a-999")).rejects.toThrow("Admin not found");
    });
});
