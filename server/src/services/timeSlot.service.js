import memberTimeSlotRepository from "../repositories/memberTimeSlot.repository.js";
import memberRepository from "../repositories/member.repository.js";
import trainerRepository from "../repositories/trainer.repository.js";
import notificationService from "./notification.service.js";
import prisma from "../config/prisma.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

const DEFAULT_PRESET_SLOTS = [
    { startTime: "06:00", endTime: "07:00", label: "Early Morning (6:00 AM - 7:00 AM)" },
    { startTime: "07:00", endTime: "08:00", label: "Morning Prime (7:00 AM - 8:00 AM)" },
    { startTime: "08:00", endTime: "09:00", label: "Morning Peak (8:00 AM - 9:00 AM)" },
    { startTime: "09:00", endTime: "10:00", label: "Late Morning (9:00 AM - 10:00 AM)" },
    { startTime: "10:00", endTime: "11:00", label: "Mid Day (10:00 AM - 11:00 AM)" },
    { startTime: "16:00", endTime: "17:00", label: "Afternoon (4:00 PM - 5:00 PM)" },
    { startTime: "17:00", endTime: "18:00", label: "Evening Rush (5:00 PM - 6:00 PM)" },
    { startTime: "18:00", endTime: "19:00", label: "Evening Prime (6:00 PM - 7:00 PM)" },
    { startTime: "19:00", endTime: "20:00", label: "Night Rush (7:00 PM - 8:00 PM)" },
    { startTime: "20:00", endTime: "21:00", label: "Late Night (8:00 PM - 9:00 PM)" },
];

class TimeSlotService {
    /**
     * Get member's time slots
     */
    async getMyTimeSlots(userId) {
        const member = await memberRepository.findByUserId(userId, {
            trainer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                    user: { select: { id: true, email: true } },
                },
            },
        });

        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const timeSlots = await memberTimeSlotRepository.findSlotsByMemberId(member.id);

        return {
            memberId: member.id,
            trainer: member.trainer,
            timeSlots,
            presetSlots: DEFAULT_PRESET_SLOTS,
        };
    }

    /**
     * Member sets a new time slot
     */
    async setMyTimeSlot(userId, data) {
        const { dayOfWeek = -1, startTime, endTime, notes } = data;

        const member = await memberRepository.findByUserId(userId, {
            trainer: {
                include: { user: true },
            },
        });

        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const slot = await memberTimeSlotRepository.createSlot({
            memberId: member.id,
            dayOfWeek: parseInt(dayOfWeek),
            startTime,
            endTime,
            notes: notes || null,
        });

        // Notify ALL trainers so all trainers can manage member availability
        const dayLabel = dayOfWeek === -1 ? "Daily" : `Day ${dayOfWeek}`;
        await notificationService.sendBulkNotification({
            role: "TRAINER",
            title: "Member Time Slot Set",
            message: `Member ${member.firstName} ${member.lastName} set their workout slot to ${startTime} - ${endTime} (${dayLabel}).`,
            type: "TIME_SLOT",
        }).catch((err) => console.error("Notification creation error:", err));

        return slot;
    }

    /**
     * Member updates an existing time slot
     */
    async updateMyTimeSlot(userId, slotId, data) {
        const member = await memberRepository.findByUserId(userId, {
            trainer: {
                include: { user: true },
            },
        });

        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const existingSlot = await memberTimeSlotRepository.findSlotById(slotId);
        if (!existingSlot) {
            throw new ErrorHandler("Time slot not found", 404);
        }

        if (existingSlot.memberId !== member.id) {
            throw new ErrorHandler("Access denied", 403);
        }

        const updatedSlot = await memberTimeSlotRepository.updateSlot(slotId, {
            ...(data.dayOfWeek !== undefined && { dayOfWeek: parseInt(data.dayOfWeek) }),
            ...(data.startTime && { startTime: data.startTime }),
            ...(data.endTime && { endTime: data.endTime }),
            ...(data.notes !== undefined && { notes: data.notes }),
            ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        });

        // Notify ALL trainers
        const dayLabel = updatedSlot.dayOfWeek === -1 ? "Daily" : `Day ${updatedSlot.dayOfWeek}`;
        await notificationService.sendBulkNotification({
            role: "TRAINER",
            title: "Member Time Slot Changed",
            message: `Member ${member.firstName} ${member.lastName} changed their preferred workout slot to ${updatedSlot.startTime} - ${updatedSlot.endTime} (${dayLabel}).`,
            type: "TIME_SLOT",
        }).catch((err) => console.error("Notification creation error:", err));

        return updatedSlot;
    }

    /**
     * Member deletes a time slot
     */
    async deleteMyTimeSlot(userId, slotId) {
        const member = await memberRepository.findByUserId(userId, {
            trainer: {
                include: { user: true },
            },
        });

        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        const existingSlot = await memberTimeSlotRepository.findSlotById(slotId);
        if (!existingSlot) {
            throw new ErrorHandler("Time slot not found", 404);
        }

        if (existingSlot.memberId !== member.id) {
            throw new ErrorHandler("Access denied", 403);
        }

        await memberTimeSlotRepository.deleteSlot(slotId);

        // Notify ALL trainers
        await notificationService.sendBulkNotification({
            role: "TRAINER",
            title: "Member Cancelled Time Slot",
            message: `Member ${member.firstName} ${member.lastName} removed their time slot (${existingSlot.startTime} - ${existingSlot.endTime}).`,
            type: "TIME_SLOT",
        }).catch((err) => console.error("Notification creation error:", err));

        return { message: "Time slot deleted successfully" };
    }

    /**
     * Trainer / Admin overview of all time slots, gym space capacity & equipment availabilities
     */
    async getTrainerTimeSlotOverview(user, query = {}) {
        const { dayOfWeek } = query;

        const whereFilter = {};
        if (dayOfWeek !== undefined && dayOfWeek !== "" && dayOfWeek !== "-1") {
            whereFilter.OR = [
                { dayOfWeek: parseInt(dayOfWeek) },
                { dayOfWeek: -1 },
            ];
        }

        const [allSlots, equipmentItems, advisories, activeAttendances] = await Promise.all([
            memberTimeSlotRepository.findAllActiveSlots(whereFilter),
            prisma.equipment.findMany({
                where: { status: "AVAILABLE" },
                select: { id: true, name: true, category: true, quantity: true, status: true },
            }),
            memberTimeSlotRepository.findAdvisories(),
            prisma.attendance.findMany({
                where: { checkOut: null }, // Currently checked in members attending gym session!
                include: {
                    member: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            trainerId: true,
                            trainer: { select: { id: true, firstName: true, lastName: true } },
                        },
                    },
                },
            }),
        ]);

        const activeMemberIdMap = new Map();
        activeAttendances.forEach((att) => {
            activeMemberIdMap.set(att.memberId, att.checkIn);
        });

        // Calculate total available equipment quantity
        const totalEquipmentUnits = equipmentItems.reduce((acc, eq) => acc + (eq.quantity || 1), 0);

        // Build slot windows aggregation
        const slotWindows = DEFAULT_PRESET_SLOTS.map((preset) => {
            const matchingMembers = allSlots.filter((slot) => {
                // Check if slot falls in or overlaps this preset range
                return slot.startTime === preset.startTime || (slot.startTime <= preset.startTime && slot.endTime >= preset.endTime);
            });

            const memberCount = matchingMembers.length;

            // Live checked-in members count for this slot window
            const liveCheckedInCount = matchingMembers.filter((s) => activeMemberIdMap.has(s.member.id)).length;

            // Determine crowd / space status based on active + scheduled load
            let occupancyLevel = "LOW"; // LOW, MODERATE, PEAK
            const totalLoad = Math.max(memberCount, liveCheckedInCount);
            if (totalLoad >= 20) {
                occupancyLevel = "PEAK";
            } else if (totalLoad >= 10) {
                occupancyLevel = "MODERATE";
            }

            // Equipment availability score (equipment units per member ratio)
            const ratio = totalLoad > 0 ? (totalEquipmentUnits / totalLoad).toFixed(1) : totalEquipmentUnits;
            let equipmentAvailability = "HIGH"; // HIGH, MEDIUM, CONGESTED
            if (totalLoad > totalEquipmentUnits) {
                equipmentAvailability = "CONGESTED";
            } else if (totalLoad > totalEquipmentUnits * 0.6) {
                equipmentAvailability = "MEDIUM";
            }

            return {
                startTime: preset.startTime,
                endTime: preset.endTime,
                label: preset.label,
                memberCount,
                liveCheckedInCount,
                occupancyLevel,
                equipmentAvailability,
                equipmentRatio: ratio,
                members: matchingMembers.map((s) => ({
                    slotId: s.id,
                    dayOfWeek: s.dayOfWeek,
                    memberId: s.member.id,
                    memberName: `${s.member.firstName} ${s.member.lastName}`,
                    phone: s.member.phone,
                    trainerName: s.member.trainer ? `${s.member.trainer.firstName} ${s.member.trainer.lastName}` : "Unassigned",
                    isMyClient: user.role === "TRAINER" && s.member.trainerId === user.trainerId,
                    isCheckedInLive: activeMemberIdMap.has(s.member.id),
                    checkInTime: activeMemberIdMap.get(s.member.id) || null,
                    notes: s.notes,
                })),
            };
        });

        // Group equipment by category with availabilities
        const equipmentByCategory = equipmentItems.reduce((acc, eq) => {
            if (!acc[eq.category]) {
                acc[eq.category] = { category: eq.category, totalQuantity: 0, items: [] };
            }
            acc[eq.category].totalQuantity += eq.quantity || 1;
            acc[eq.category].items.push(eq);
            return acc;
        }, {});

        return {
            slotWindows,
            totalActiveSlots: allSlots.length,
            totalLiveCheckedIn: activeAttendances.length, // Currently attending members inside gym
            liveCheckedInMembers: activeAttendances.map((a) => ({
                attendanceId: a.id,
                memberId: a.member.id,
                memberName: `${a.member.firstName} ${a.member.lastName}`,
                phone: a.member.phone,
                trainerName: a.member.trainer ? `${a.member.trainer.firstName} ${a.member.trainer.lastName}` : "Unassigned",
                checkInTime: a.checkIn,
            })),
            totalEquipmentUnits,
            equipmentByCategory: Object.values(equipmentByCategory),
            advisories,
        };
    }

    /**
     * Trainer creates a Gym Space / Equipment Advisory for a slot
     */
    async createAdvisory(user, data) {
        const { startTime, endTime, dayOfWeek = -1, title, description, maxCapacity } = data;

        let trainerId = user.trainerId;
        if (!trainerId) {
            const trainer = await trainerRepository.findByUserId(user.id);
            if (!trainer) {
                throw new ErrorHandler("Trainer profile not found", 404);
            }
            trainerId = trainer.id;
        }

        return memberTimeSlotRepository.createAdvisory({
            trainerId,
            startTime,
            endTime,
            dayOfWeek: parseInt(dayOfWeek),
            title,
            description: description || null,
            maxCapacity: maxCapacity ? parseInt(maxCapacity) : 30,
        });
    }

    /**
     * Trainer deletes an Advisory
     */
    async deleteAdvisory(user, advisoryId) {
        const advisory = await memberTimeSlotRepository.findAdvisoryById(advisoryId);
        if (!advisory) {
            throw new ErrorHandler("Advisory not found", 404);
        }

        // Admins can delete any, trainer can delete their own
        if (user.role !== "ADMIN") {
            const trainer = await trainerRepository.findByUserId(user.id);
            if (!trainer || advisory.trainerId !== trainer.id) {
                throw new ErrorHandler("Access denied", 403);
            }
        }

        await memberTimeSlotRepository.deleteAdvisory(advisoryId);
        return { message: "Advisory deleted successfully" };
    }
}

export default new TimeSlotService();
