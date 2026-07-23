import attendanceRepository from "../repositories/attendance.repository.js";
import memberRepository from "../repositories/member.repository.js";
import trainerRepository from "../repositories/trainer.repository.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

class AttendanceService {
    async checkIn(userId) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await attendanceRepository.findActiveCheckIn(member.id, today, tomorrow);
        if (existing) {
            throw new ErrorHandler("Member is already checked in for today", 400);
        }

        return attendanceRepository.create({
            memberId: member.id,
            checkIn: new Date(),
            date: new Date(),
        });
    }

    async checkOut(userId) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeCheckIn = await attendanceRepository.findActiveCheckIn(member.id, today, tomorrow);
        if (!activeCheckIn) {
            throw new ErrorHandler("No active check-in found for today to check out", 404);
        }

        return attendanceRepository.update(activeCheckIn.id, {
            checkOut: new Date(),
        });
    }

    async getMyAttendanceHistory(userId, query) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const { page = 1, limit = 20 } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const { data, total } = await attendanceRepository.findMany(
            { memberId: member.id },
            skip,
            limitNum
        );

        return {
            history: data,
            totalVisits: total,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async getMemberAttendanceByTrainer(userId, memberId, query) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        const member = await memberRepository.findById(memberId);
        if (!member || member.trainerId !== trainer.id) {
            throw new ErrorHandler("Member not found or not assigned to you", 404);
        }

        const { page = 1, limit = 20 } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const { data, total } = await attendanceRepository.findMany(
            { memberId: member.id },
            skip,
            limitNum
        );

        return {
            attendances: data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async markMemberAttendanceByTrainer(userId, memberId) {
        const trainer = await trainerRepository.findByUserId(userId);
        if (!trainer) {
            throw new ErrorHandler("Trainer profile not found", 404);
        }

        const member = await memberRepository.findById(memberId);
        if (!member || member.trainerId !== trainer.id) {
            throw new ErrorHandler("Member not found or not assigned to you", 404);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await attendanceRepository.findActiveCheckIn(member.id, today, tomorrow);
        if (existing) {
            return {
                action: "CHECK_OUT",
                attendance: await attendanceRepository.update(existing.id, { checkOut: new Date() }),
            };
        }

        return {
            action: "CHECK_IN",
            attendance: await attendanceRepository.create({
                memberId: member.id,
                checkIn: new Date(),
                date: new Date(),
            }),
        };
    }

    async listAttendance(query) {
        const { page = 1, limit = 20, date, memberId } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (date) {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            where.checkIn = { gte: dayStart, lt: dayEnd };
        }

        if (memberId) {
            where.memberId = memberId;
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

        const { data, total } = await attendanceRepository.findMany(where, skip, limitNum, { checkIn: "desc" }, include);

        return {
            attendances: data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async getAttendanceReport() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [todayTotalVisits, currentlyCheckedIn] = await Promise.all([
            attendanceRepository.count({ checkIn: { gte: today, lt: tomorrow } }),
            attendanceRepository.count({ checkIn: { gte: today, lt: tomorrow }, checkOut: null }),
        ]);

        return {
            todayTotalVisits,
            currentlyCheckedIn,
        };
    }
}

export default new AttendanceService();
