import complaintRepository from "../repositories/complaint.repository.js";
import memberRepository from "../repositories/member.repository.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

class ComplaintService {
    async createComplaint(userId, body) {
        const { subject, description } = body;

        if (!subject || !description) {
            throw new ErrorHandler("subject and description are required", 400);
        }

        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        return complaintRepository.create({
            memberId: member.id,
            subject,
            description,
            status: "OPEN",
        });
    }

    async listComplaints(user, query) {
        const { page = 1, limit = 20, status } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (user.role === "MEMBER") {
            const member = await memberRepository.findByUserId(user.id);
            if (!member) {
                throw new ErrorHandler("Member profile not found", 404);
            }
            where.memberId = member.id;
        }

        if (status) {
            where.status = status;
        }

        const include = {
            member: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                },
            },
        };

        const { data, total } = await complaintRepository.findMany(
            where,
            skip,
            limitNum,
            { createdAt: "desc" },
            include
        );

        return {
            complaints: data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async getComplaintById(user, id) {
        const complaint = await complaintRepository.findById(id, {
            member: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                },
            },
        });

        if (!complaint) {
            throw new ErrorHandler("Complaint not found", 404);
        }

        if (user.role === "MEMBER") {
            const member = await memberRepository.findByUserId(user.id);
            if (!member || complaint.memberId !== member.id) {
                throw new ErrorHandler("Access denied", 403);
            }
        }

        return complaint;
    }

    async resolveComplaint(id, status) {
        const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"];
        if (!status || !validStatuses.includes(status)) {
            throw new ErrorHandler(
                `status is required and must be one of: ${validStatuses.join(", ")}`,
                400
            );
        }

        const complaint = await complaintRepository.findById(id);
        if (!complaint) {
            throw new ErrorHandler("Complaint not found", 404);
        }

        const include = {
            member: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        };

        return complaintRepository.update(id, { status }, include);
    }

    async deleteComplaint(id) {
        const complaint = await complaintRepository.findById(id);
        if (!complaint) {
            throw new ErrorHandler("Complaint not found", 404);
        }

        return complaintRepository.delete(id);
    }
}

export default new ComplaintService();
