import prisma from "../config/prisma.js";
import couponRepository from "../repositories/coupon.repository.js";
import memberRepository from "../repositories/member.repository.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const REFERRAL_BONUS_DAYS = 15;
const REFEREE_DISCOUNT_PERCENT = 15;
const REF_CODE_PREFIX = "REF";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculate the actual discount INR amount given a coupon and a purchase amount.
 * Returns { discountAmount, extraDays } where extraDays is only set for FREE_DAYS.
 */
function computeDiscount(coupon, purchaseAmount) {
    const value = parseFloat(coupon.discountValue);

    if (coupon.discountType === "PERCENTAGE") {
        let discount = (purchaseAmount * value) / 100;
        if (coupon.maxDiscountAmount) {
            discount = Math.min(discount, parseFloat(coupon.maxDiscountAmount));
        }
        return { discountAmount: Math.round(discount * 100) / 100, extraDays: null };
    }

    if (coupon.discountType === "FIXED_AMOUNT") {
        const discount = Math.min(value, purchaseAmount); // can't exceed purchase
        return { discountAmount: discount, extraDays: null };
    }

    if (coupon.discountType === "FREE_DAYS") {
        return { discountAmount: 0, extraDays: Math.floor(value) };
    }

    return { discountAmount: 0, extraDays: null };
}

// ─── CouponService ────────────────────────────────────────────────────────────

class CouponService {

    // ─── ADMIN: Coupon Management ────────────────────────────────────────────

    async createCoupon(body) {
        const {
            code, description, discountType, discountValue,
            minPurchaseAmount, maxDiscountAmount, maxUsageCount,
            perUserLimit, applicablePlanIds, startDate, expiresAt,
        } = body;

        if (!code || !discountType || !discountValue) {
            throw new ErrorHandler("code, discountType, and discountValue are required", 400);
        }

        const VALID_TYPES = ["PERCENTAGE", "FIXED_AMOUNT", "FREE_DAYS"];
        if (!VALID_TYPES.includes(discountType.toUpperCase())) {
            throw new ErrorHandler(`discountType must be one of: ${VALID_TYPES.join(", ")}`, 400);
        }

        const upperCode = code.toUpperCase().trim();
        const existing = await couponRepository.findCouponByCode(upperCode);
        if (existing) {
            throw new ErrorHandler(`Coupon code "${upperCode}" already exists`, 409);
        }

        if (discountType === "PERCENTAGE" && (parseFloat(discountValue) <= 0 || parseFloat(discountValue) > 100)) {
            throw new ErrorHandler("Percentage discount must be between 1 and 100", 400);
        }

        const start = startDate ? new Date(startDate) : new Date();
        const expires = expiresAt ? new Date(expiresAt) : null;
        if (expires && expires <= start) {
            throw new ErrorHandler("expiresAt must be after startDate", 400);
        }

        const coupon = await couponRepository.createCoupon({
            code: upperCode,
            description: description || null,
            discountType: discountType.toUpperCase(),
            discountValue: parseFloat(discountValue),
            minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
            maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
            maxUsageCount: maxUsageCount ? parseInt(maxUsageCount) : null,
            perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
            applicablePlanIds: Array.isArray(applicablePlanIds) ? applicablePlanIds : [],
            startDate: start,
            expiresAt: expires,
        });

        // ── Notify all member users about the new coupon code ──
        try {
            const memberUsers = (await prisma.user.findMany({
                where: { role: "MEMBER" },
                select: { id: true },
            })) || [];

            if (Array.isArray(memberUsers) && memberUsers.length > 0) {
                const discountText =
                    coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}% OFF${coupon.maxDiscountAmount ? ` (Max Cap: ₹${coupon.maxDiscountAmount})` : ""}`
                        : coupon.discountType === "FIXED_AMOUNT"
                        ? `₹${coupon.discountValue} OFF`
                        : `+${coupon.discountValue} Extra Free Days`;

                const limitRules = [
                    `Per-member limit: ${coupon.perUserLimit} use(s)`,
                    coupon.maxUsageCount ? `Total limit: ${coupon.maxUsageCount} uses` : "Total limit: Unlimited",
                    coupon.minPurchaseAmount ? `Min purchase: ₹${coupon.minPurchaseAmount}` : "Min purchase: None",
                ].join(" • ");

                const startStr = new Date(coupon.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                const durationText = coupon.expiresAt
                    ? `Valid from ${startStr} to ${new Date(coupon.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                    : `Valid from ${startStr} (No expiration)`;

                const notifTitle = `🎁 New Coupon Available: ${coupon.code}!`;
                const notifMessage = `Use coupon code '${coupon.code}' to get ${discountText} on membership!\n\n📌 Rules: ${limitRules}\n📅 Duration: ${durationText}${coupon.description ? `\n\nInfo: ${coupon.description}` : ""}`;

                const notificationsData = memberUsers.map((u) => ({
                    userId: u.id,
                    title: notifTitle,
                    message: notifMessage,
                    type: "GENERAL",
                }));

                await prisma.notification.createMany({
                    data: notificationsData,
                });
            }
        } catch (err) {
            console.error("⚠️ Failed to send coupon creation notifications to members:", err.message || err);
        }

        return coupon;
    }

    async listCoupons(query) {
        const { page = 1, limit = 20, status, type } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (status) where.status = status.toUpperCase();
        if (type) where.discountType = type.toUpperCase();

        const { data, total } = await couponRepository.findCoupons(where, skip, limitNum);

        return {
            coupons: data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async getCouponById(id) {
        const coupon = await couponRepository.findCouponById(id, {
            usages: { orderBy: { usedAt: "desc" }, take: 10 },
        });
        if (!coupon) throw new ErrorHandler("Coupon not found", 404);
        return coupon;
    }

    async updateCoupon(id, body) {
        const coupon = await couponRepository.findCouponById(id);
        if (!coupon) throw new ErrorHandler("Coupon not found", 404);

        const allowed = [
            "description", "minPurchaseAmount", "maxDiscountAmount",
            "maxUsageCount", "perUserLimit", "applicablePlanIds", "expiresAt", "status", "startDate",
        ];
        const updateData = {};
        for (const field of allowed) {
            if (body[field] !== undefined) updateData[field] = body[field];
        }

        // Coerce numeric fields
        if (updateData.minPurchaseAmount !== undefined) updateData.minPurchaseAmount = updateData.minPurchaseAmount ? parseFloat(updateData.minPurchaseAmount) : null;
        if (updateData.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = updateData.maxDiscountAmount ? parseFloat(updateData.maxDiscountAmount) : null;
        if (updateData.maxUsageCount !== undefined) updateData.maxUsageCount = updateData.maxUsageCount ? parseInt(updateData.maxUsageCount) : null;
        if (updateData.perUserLimit !== undefined) updateData.perUserLimit = parseInt(updateData.perUserLimit);
        if (updateData.applicablePlanIds !== undefined && !Array.isArray(updateData.applicablePlanIds)) {
            updateData.applicablePlanIds = [];
        }
        if (updateData.expiresAt !== undefined) updateData.expiresAt = updateData.expiresAt ? new Date(updateData.expiresAt) : null;
        if (updateData.startDate !== undefined) updateData.startDate = new Date(updateData.startDate);

        if (Object.keys(updateData).length === 0) {
            throw new ErrorHandler("No valid fields provided to update", 400);
        }

        return couponRepository.updateCoupon(id, updateData);
    }

    async deactivateCoupon(id) {
        const coupon = await couponRepository.findCouponById(id);
        if (!coupon) throw new ErrorHandler("Coupon not found", 404);
        const newStatus = coupon.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        return couponRepository.updateCoupon(id, { status: newStatus });
    }

    async getCouponUsagesAdmin(couponId, query = {}) {
        let coupon = await couponRepository.findCouponById(couponId);
        if (!coupon) {
            coupon = await couponRepository.findCouponByCode(couponId);
        }
        if (!coupon) throw new ErrorHandler("Coupon not found", 404);

        // Auto-sync/backfill any SUCCESS payments that applied this coupon code but lack a CouponUsage record
        try {
            const unlinkedPayments = await prisma.payment.findMany({
                where: {
                    appliedCouponCode: { equals: coupon.code, mode: 'insensitive' },
                    status: "SUCCESS",
                    couponUsageId: null,
                },
            });

            for (const p of unlinkedPayments) {
                try {
                    await prisma.$transaction(async (tx) => {
                        const usage = await this.applyCoupon(coupon.code, p.memberId, p.membershipId, p.amount, tx);
                        await tx.payment.update({
                            where: { id: p.id },
                            data: { couponUsageId: usage.id },
                        });
                    });
                } catch (e) {
                    console.error(`⚠️ Auto-sync coupon usage failed for payment ${p.id}:`, e.message || e);
                }
            }
        } catch (err) {
            console.error("⚠️ Error checking unlinked payments for coupon:", err.message || err);
        }

        const { page = 1, limit = 20 } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const { data, total } = await couponRepository.findUsagesByCouponId(coupon.id, skip, limitNum);
        return {
            usages: data,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        };
    }

    // ─── MEMBER: Validate Coupon (Checkout Preview) ───────────────────────────

    async validateCoupon(code, memberId, purchaseAmount = 0, planId = null) {
        const coupon = await couponRepository.findCouponByCode(code);
        if (!coupon) throw new ErrorHandler("Coupon not found", 404);

        if (coupon.status !== "ACTIVE") {
            throw new ErrorHandler("Coupon is no longer active", 400);
        }

        const now = new Date();
        if (coupon.startDate > now) {
            throw new ErrorHandler("Coupon is not yet active", 400);
        }
        if (coupon.expiresAt && coupon.expiresAt < now) {
            throw new ErrorHandler("Coupon has expired", 400);
        }

        // Global usage cap
        if (coupon.maxUsageCount !== null && coupon.usageCount >= coupon.maxUsageCount) {
            throw new ErrorHandler("Coupon usage limit has been reached", 400);
        }

        // Per-user limit
        const userUsages = await couponRepository.countUserUsages(coupon.id, memberId);
        if (userUsages >= coupon.perUserLimit) {
            throw new ErrorHandler("You have already used this coupon the maximum number of times", 409);
        }

        // Applicable membership plans check
        if (Array.isArray(coupon.applicablePlanIds) && coupon.applicablePlanIds.length > 0) {
            if (!planId || !coupon.applicablePlanIds.includes(planId)) {
                throw new ErrorHandler("This coupon is not applicable to the selected membership plan", 400);
            }
        }

        // Minimum purchase check (skip for FREE_DAYS)
        const amount = parseFloat(purchaseAmount) || 0;
        if (coupon.discountType !== "FREE_DAYS" && coupon.minPurchaseAmount) {
            const minAmount = parseFloat(coupon.minPurchaseAmount);
            if (amount < minAmount) {
                throw new ErrorHandler(`Minimum purchase amount of ₹${minAmount} required for this coupon`, 400);
            }
        }

        const { discountAmount, extraDays } = computeDiscount(coupon, amount);
        const finalAmount = Math.max(0, amount - discountAmount);

        return {
            valid: true,
            couponId: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: parseFloat(coupon.discountValue),
            discountAmount,
            extraDays,
            finalAmount,
        };
    }

    /**
     * Apply a coupon atomically inside an existing Prisma transaction.
     * Must be called from within a prisma.$transaction() block.
     *
     * @param {string} code         - Coupon code
     * @param {string} memberId     - Member id
     * @param {string} membershipId - Membership id being created/activated
     * @param {number} purchaseAmount
     * @param {object} tx           - Prisma transaction client
     * @returns {Promise<CouponUsage>}
     */
    async applyCoupon(code, memberId, membershipId, purchaseAmount, tx) {
        // Re-validate inside the transaction to prevent race conditions
        const coupon = await tx.coupon.findUnique({ where: { code: code.toUpperCase() } });
        if (!coupon) throw new ErrorHandler("Coupon not found", 404);

        if (coupon.status !== "ACTIVE") throw new ErrorHandler("Coupon is no longer active", 400);

        const now = new Date();
        if (coupon.expiresAt && coupon.expiresAt < now) throw new ErrorHandler("Coupon has expired", 400);

        if (coupon.maxUsageCount !== null && coupon.usageCount >= coupon.maxUsageCount) {
            throw new ErrorHandler("Coupon usage limit has been reached", 400);
        }

        const userUsages = await tx.couponUsage.count({ where: { couponId: coupon.id, memberId } });
        if (userUsages >= coupon.perUserLimit) {
            throw new ErrorHandler("You have already used this coupon the maximum number of times", 409);
        }

        // Applicable plans check
        if (Array.isArray(coupon.applicablePlanIds) && coupon.applicablePlanIds.length > 0 && membershipId) {
            const m = await tx.membership.findUnique({ where: { id: membershipId }, select: { planId: true } });
            if (m?.planId && !coupon.applicablePlanIds.includes(m.planId)) {
                throw new ErrorHandler("This coupon is not applicable to the selected membership plan", 400);
            }
        }

        let baseAmount = parseFloat(purchaseAmount) || 0;
        if (membershipId) {
            const m = await tx.membership.findUnique({
                where: { id: membershipId },
                include: { plan: { select: { price: true } } },
            });
            if (m?.plan?.price) {
                baseAmount = parseFloat(m.plan.price);
            }
        }

        if (coupon.discountType !== "FREE_DAYS" && coupon.minPurchaseAmount) {
            if (baseAmount < parseFloat(coupon.minPurchaseAmount)) {
                throw new ErrorHandler(`Minimum purchase amount of ₹${parseFloat(coupon.minPurchaseAmount)} required`, 400);
            }
        }

        const { discountAmount, extraDays } = computeDiscount(coupon, baseAmount);

        // Idempotency check: if coupon usage for this membership already exists, return it
        if (membershipId) {
            const existingUsage = await tx.couponUsage.findFirst({
                where: { couponId: coupon.id, membershipId },
            });
            if (existingUsage) return existingUsage;
        }

        // Create usage record
        const usage = await tx.couponUsage.create({
            data: {
                couponId: coupon.id,
                memberId,
                membershipId: membershipId || null,
                discountApplied: discountAmount,
                extraDaysGranted: extraDays,
            },
        });

        // Increment global usage counter
        await tx.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } },
        });

        // For FREE_DAYS: extend membership end date
        if (extraDays && membershipId) {
            await tx.membership.update({
                where: { id: membershipId },
                data: {
                    endDate: {
                        set: await (async () => {
                            const m = await tx.membership.findUnique({ where: { id: membershipId }, select: { endDate: true } });
                            const newEnd = new Date(m.endDate);
                            newEnd.setDate(newEnd.getDate() + extraDays);
                            return newEnd;
                        })(),
                    },
                },
            });
        }

        return usage;
    }

    async getMyCouponUsages(userId, query) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) throw new ErrorHandler("Member profile not found", 404);

        const { page = 1, limit = 20 } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const { data, total } = await couponRepository.findUsagesByMember(member.id, skip, limitNum);
        return {
            usages: data,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        };
    }

    // ─── Referral Link ────────────────────────────────────────────────────────

    async getMyReferralLink(userId) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) throw new ErrorHandler("Member profile not found", 404);

        // Return existing if already created
        const existing = await couponRepository.findReferralLinkByMemberId(member.id);
        if (existing) return { referralLink: existing, created: false };

        // Lazy-create a referral link
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        const baseCode = `${REF_CODE_PREFIX}-${user.username.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;

        // Ensure uniqueness by appending a short suffix if needed
        let code = baseCode;
        let attempt = 0;
        while (await couponRepository.findReferralLinkByCode(code)) {
            attempt++;
            code = `${baseCode}-${attempt}`;
        }

        const link = await couponRepository.createReferralLink({
            memberId: member.id,
            code,
        });

        return { referralLink: link, created: true };
    }

    /**
     * Called at user registration when a referral code is provided.
     * Silently skips (no throw) if the code is invalid — registration must not fail.
     */
    async trackReferralSignup(referralCode, newMemberId) {
        try {
            const referralLink = await couponRepository.findReferralLinkByCode(referralCode);
            if (!referralLink) return null; // Invalid code — skip silently

            // Self-referral guard
            if (referralLink.memberId === newMemberId) {
                throw new ErrorHandler("You cannot refer yourself", 400);
            }

            // Check if this member has already been referred
            const existingReferral = await couponRepository.findReferralByReferredMemberId(newMemberId);
            if (existingReferral) return null; // Already referred — skip

            await prisma.$transaction(async (tx) => {
                await couponRepository.createReferral({ referralLinkId: referralLink.id, referredMemberId: newMemberId }, tx);
                await couponRepository.incrementReferralCount(referralLink.id, tx);
            });

            return referralLink;
        } catch (err) {
            // Only re-throw self-referral; all other errors are swallowed
            if (err instanceof ErrorHandler && err.message === "You cannot refer yourself") throw err;
            console.error("⚠️ Referral tracking failed silently:", err.message);
            return null;
        }
    }

    /**
     * Grant referral rewards after a member's FIRST successful payment.
     * Safe to call multiple times — idempotent.
     *
     * Referrer: +REFERRAL_BONUS_DAYS days on their active membership
     * Referee:  A personal one-time PERCENTAGE coupon
     */
    async grantReferralRewards(referredMemberId) {
        const referral = await couponRepository.findReferralByReferredMemberId(referredMemberId);
        if (!referral) return null; // Not a referred member

        // Idempotency guard — already processed
        if (referral.referrerRewardGranted && referral.refereeRewardGranted) return referral;

        const referrerMember = referral.referralLink.member;

        await prisma.$transaction(async (tx) => {
            const updateData = { rewardGrantedAt: new Date() };

            // ── Referrer reward: +15 days ──────────────────────────────────
            if (!referral.referrerRewardGranted) {
                const activeMembership = await tx.membership.findFirst({
                    where: { memberId: referrerMember.id, status: "ACTIVE" },
                    orderBy: { endDate: "desc" },
                });

                if (activeMembership) {
                    const newEnd = new Date(activeMembership.endDate);
                    newEnd.setDate(newEnd.getDate() + REFERRAL_BONUS_DAYS);

                    await tx.membership.update({
                        where: { id: activeMembership.id },
                        data: { endDate: newEnd },
                    });

                    // Notify referrer
                    await tx.notification.create({
                        data: {
                            userId: referrerMember.userId,
                            title: "🎉 Referral Reward!",
                            message: `Your referral joined! You've earned ${REFERRAL_BONUS_DAYS} extra days on your membership.`,
                            type: "MEMBERSHIP",
                        },
                    });

                    updateData.referrerRewardGranted = true;
                    updateData.referrerMembershipId = activeMembership.id;
                } else {
                    // Referrer has no active membership right now — skip gracefully
                    console.warn(`⚠️ Referrer (memberId: ${referrerMember.id}) has no active membership. Referrer reward skipped.`);
                }
            }

            // ── Referee reward: personal coupon ───────────────────────────
            if (!referral.refereeRewardGranted) {
                // Create a personal one-time coupon for the referee
                const couponCode = `REF-BONUS-${referredMemberId.slice(-8).toUpperCase()}`;
                const refereeCoupon = await tx.coupon.create({
                    data: {
                        code: couponCode,
                        description: `Welcome bonus! ${REFEREE_DISCOUNT_PERCENT}% off for being a referred member.`,
                        discountType: "PERCENTAGE",
                        discountValue: REFEREE_DISCOUNT_PERCENT,
                        maxUsageCount: 1,
                        perUserLimit: 1,
                        isReferral: true,
                        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                    },
                });

                // Notify referee
                const refereeMember = await tx.member.findUnique({
                    where: { id: referredMemberId },
                    select: { userId: true },
                });
                if (refereeMember) {
                    await tx.notification.create({
                        data: {
                            userId: refereeMember.userId,
                            title: "🎁 Welcome Bonus!",
                            message: `You've received a ${REFEREE_DISCOUNT_PERCENT}% discount coupon: ${couponCode}. Valid for 90 days!`,
                            type: "MEMBERSHIP",
                        },
                    });
                }

                updateData.refereeRewardGranted = true;
                updateData.refereeCouponId = refereeCoupon.id;
            }

            await tx.referral.update({ where: { id: referral.id }, data: updateData });
            await couponRepository.incrementSuccessfulReferrals(referral.referralLinkId, tx);
        });

        return await couponRepository.findReferralByReferredMemberId(referredMemberId);
    }
}

export default new CouponService();
