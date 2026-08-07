import prisma from "../config/prisma.js";
import memberRepository from "../repositories/member.repository.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

class RatingService {
    /**
     * Compute the Monday of the current week (ISO week start).
     */
    _getWeekStart() {
        const now = new Date();
        const day = now.getDay(); // 0 = Sun, 1 = Mon, …, 6 = Sat
        const diff = day === 0 ? 6 : day - 1; // days since Monday
        const monday = new Date(now);
        monday.setDate(now.getDate() - diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    /**
     * Submit a weekly rating for the member's assigned trainer.
     */
    async submitRating(userId, { rating, comment }) {
        if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            throw new ErrorHandler("Rating must be an integer between 1 and 5", 400);
        }

        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }
        if (!member.trainerId) {
            throw new ErrorHandler("You do not have an assigned trainer to rate", 400);
        }

        const weekStart = this._getWeekStart();

        // Check if already rated this week
        const existing = await prisma.trainerRating.findFirst({
            where: {
                memberId: member.id,
                trainerId: member.trainerId,
                weekStart,
            },
        });

        if (existing) {
            throw new ErrorHandler("You have already rated your trainer this week. Come back next week!", 400);
        }

        // Create the rating in a transaction, then recalculate averages
        return prisma.$transaction(async (tx) => {
            const newRating = await tx.trainerRating.create({
                data: {
                    memberId: member.id,
                    trainerId: member.trainerId,
                    rating,
                    comment: comment?.trim() || null,
                    weekStart,
                },
            });

            // Recalculate trainer's averageRating and totalReviews
            const aggregate = await tx.trainerRating.aggregate({
                where: { trainerId: member.trainerId },
                _avg: { rating: true },
                _count: { rating: true },
            });

            await tx.trainer.update({
                where: { id: member.trainerId },
                data: {
                    averageRating: Math.round((aggregate._avg.rating || 0) * 10) / 10,
                    totalReviews: aggregate._count.rating || 0,
                },
            });

            return newRating;
        });
    }

    /**
     * Get all past ratings this member has given to their current trainer.
     */
    async getMyTrainerRatings(userId) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }
        if (!member.trainerId) {
            return { ratings: [], canRateThisWeek: false };
        }

        const weekStart = this._getWeekStart();

        const ratings = await prisma.trainerRating.findMany({
            where: {
                memberId: member.id,
                trainerId: member.trainerId,
            },
            orderBy: { weekStart: "desc" },
            take: 12,
        });

        const alreadyRatedThisWeek = ratings.some(
            (r) => new Date(r.weekStart).getTime() === weekStart.getTime()
        );

        return {
            ratings,
            canRateThisWeek: !alreadyRatedThisWeek,
            trainerId: member.trainerId,
        };
    }
}

export default new RatingService();
