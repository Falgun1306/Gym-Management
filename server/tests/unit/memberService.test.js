import { jest, describe, it, expect } from "@jest/globals";
import memberService from "../../src/services/member.service.js";
import memberRepository from "../../src/repositories/member.repository.js";

describe("member.service — MemberService", () => {
    it("should return member profile by ID", async () => {
        const mockMember = { id: "m-1", firstName: "Alice", lastName: "Smith" };
        jest.spyOn(memberRepository, "findById").mockResolvedValue(mockMember);

        const member = await memberService.getMemberById("m-1");
        expect(member.id).toBe("m-1");
        expect(member.firstName).toBe("Alice");
    });

    it("should throw 404 if member is not found by ID", async () => {
        jest.spyOn(memberRepository, "findById").mockResolvedValue(null);

        await expect(memberService.getMemberById("m-999")).rejects.toThrow("Member not found");
    });
});
