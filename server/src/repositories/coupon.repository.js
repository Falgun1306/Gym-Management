import prisma from "../config/prisma.js";

class CouponRepository {
    // ─── Coupon CRUD ───────────────────────────────────────────────────────────

    async createCoupon(data) {
        return prisma.coupon.create({ data });
    }

    async findCouponById(id, include = null) {
        return prisma.coupon.findUnique({
            where: { id },
            ...(include && { include }),
        });
    }

    async findCouponByCode(code) {
        return prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });
    }

    async findCoupons(where = {}, skip = 0, take = 20, orderBy = { createdAt: "desc" }) {
        const [data, total] = await Promise.all([
            prisma.coupon.findMany({ where, skip, take, orderBy }),
            prisma.coupon.count({ where }),
        ]);
        return { data, total };
    }

    async updateCoupon(id, data) {
        return prisma.coupon.update({ where: { id }, data });
    }

    async incrementUsageCount(id, tx = prisma) {
        return tx.coupon.update({
            where: { id },
            data: { usageCount: { increment: 1 } },
        });
    }

    // ─── CouponUsage ──────────────────────────────────────────────────────────

    async createCouponUsage(data, tx = prisma) {
        return tx.couponUsage.create({ data, include: { coupon: true } });
    }

    async countUserUsages(couponId, memberId) {
        return prisma.couponUsage.count({
            where: { couponId, memberId },
        });
    }

    async findUsagesByMember(memberId, skip = 0, take = 20) {
        const [data, total] = await Promise.all([
            prisma.couponUsage.findMany({
                where: { memberId },
                skip,
                take,
                orderBy: { usedAt: "desc" },
                include: {
                    coupon: { select: { code: true, discountType: true, description: true } },
                    membership: { include: { plan: { select: { name: true } } } },
                },
            }),
            prisma.couponUsage.count({ where: { memberId } }),
        ]);
        return { data, total };
    }

    // ─── ReferralLink ─────────────────────────────────────────────────────────

    async findReferralLinkByMemberId(memberId) {
        return prisma.referralLink.findUnique({
            where: { memberId },
            include: {
                referrals: {
                    select: {
                        id: true,
                        referrerRewardGranted: true,
                        refereeRewardGranted: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
    }

    async findReferralLinkByCode(code) {
        return prisma.referralLink.findUnique({
            where: { code },
            include: { member: { select: { id: true, userId: true } } },
        });
    }

    async createReferralLink(data) {
        return prisma.referralLink.create({ data });
    }

    async incrementReferralCount(id, tx = prisma) {
        return tx.referralLink.update({
            where: { id },
            data: { totalReferrals: { increment: 1 } },
        });
    }

    async incrementSuccessfulReferrals(id, tx = prisma) {
        return tx.referralLink.update({
            where: { id },
            data: { successfulReferrals: { increment: 1 } },
        });
    }

    // ─── Referral ─────────────────────────────────────────────────────────────

    async createReferral(data, tx = prisma) {
        return tx.referral.create({ data });
    }

    async findReferralByReferredMemberId(referredMemberId) {
        return prisma.referral.findUnique({
            where: { referredMemberId },
            include: {
                referralLink: { include: { member: { select: { id: true, userId: true } } } },
            },
        });
    }

    async updateReferral(id, data, tx = prisma) {
        return tx.referral.update({ where: { id }, data });
    }
}

export default new CouponRepository();
