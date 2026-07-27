-- ─── New Enums ────────────────────────────────────────────────────────────────

CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DAYS');
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- ─── Coupon ───────────────────────────────────────────────────────────────────

CREATE TABLE "Coupon" (
    "id"                TEXT NOT NULL,
    "code"              TEXT NOT NULL,
    "description"       TEXT,
    "discountType"      "DiscountType" NOT NULL,
    "discountValue"     DECIMAL(65,30) NOT NULL,
    "minPurchaseAmount" DECIMAL(65,30),
    "maxDiscountAmount" DECIMAL(65,30),
    "maxUsageCount"     INTEGER,
    "usageCount"        INTEGER NOT NULL DEFAULT 0,
    "perUserLimit"      INTEGER NOT NULL DEFAULT 1,
    "isReferral"        BOOLEAN NOT NULL DEFAULT false,
    "startDate"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"         TIMESTAMP(3),
    "status"            "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX "Coupon_status_idx" ON "Coupon"("status");
CREATE INDEX "Coupon_expiresAt_idx" ON "Coupon"("expiresAt");

-- ─── CouponUsage ──────────────────────────────────────────────────────────────

CREATE TABLE "CouponUsage" (
    "id"               TEXT NOT NULL,
    "couponId"         TEXT NOT NULL,
    "memberId"         TEXT NOT NULL,
    "membershipId"     TEXT,
    "discountApplied"  DECIMAL(65,30) NOT NULL,
    "extraDaysGranted" INTEGER,
    "usedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CouponUsage_membershipId_key" ON "CouponUsage"("membershipId");
CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");
CREATE INDEX "CouponUsage_memberId_idx" ON "CouponUsage"("memberId");

-- ─── ReferralLink ─────────────────────────────────────────────────────────────

CREATE TABLE "ReferralLink" (
    "id"                  TEXT NOT NULL,
    "memberId"            TEXT NOT NULL,
    "code"                TEXT NOT NULL,
    "totalReferrals"      INTEGER NOT NULL DEFAULT 0,
    "successfulReferrals" INTEGER NOT NULL DEFAULT 0,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralLink_memberId_key" ON "ReferralLink"("memberId");
CREATE UNIQUE INDEX "ReferralLink_code_key" ON "ReferralLink"("code");
CREATE INDEX "ReferralLink_code_idx" ON "ReferralLink"("code");

-- ─── Referral ─────────────────────────────────────────────────────────────────

CREATE TABLE "Referral" (
    "id"                    TEXT NOT NULL,
    "referralLinkId"        TEXT NOT NULL,
    "referredMemberId"      TEXT NOT NULL,
    "referrerRewardGranted" BOOLEAN NOT NULL DEFAULT false,
    "refereeRewardGranted"  BOOLEAN NOT NULL DEFAULT false,
    "referrerMembershipId"  TEXT,
    "refereeCouponId"       TEXT,
    "rewardGrantedAt"       TIMESTAMP(3),
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Referral_referredMemberId_key" ON "Referral"("referredMemberId");
CREATE INDEX "Referral_referralLinkId_idx" ON "Referral"("referralLinkId");
CREATE INDEX "Referral_referredMemberId_idx" ON "Referral"("referredMemberId");

-- ─── Extend Membership ────────────────────────────────────────────────────────

ALTER TABLE "Membership" ADD COLUMN "couponId" TEXT;

-- ─── Extend Payment ───────────────────────────────────────────────────────────

ALTER TABLE "Payment" ADD COLUMN "couponUsageId" TEXT;
CREATE UNIQUE INDEX "Payment_couponUsageId_key" ON "Payment"("couponUsageId");

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────

ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReferralLink" ADD CONSTRAINT "ReferralLink_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referralLinkId_fkey"
    FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredMemberId_fkey"
    FOREIGN KEY ("referredMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeCouponId_fkey"
    FOREIGN KEY ("refereeCouponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_couponUsageId_fkey"
    FOREIGN KEY ("couponUsageId") REFERENCES "CouponUsage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
