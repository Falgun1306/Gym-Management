import crypto from "crypto";
import PDFDocument from "pdfkit";
import prisma from "../config/prisma.js";
import razorpay from "../config/razorpay.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import { sendPaymentReceipt, sendPaymentFailureEmail } from "../services/email.service.js";
import couponService from "../services/coupon.service.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const REFUND_WINDOW_DAYS = 7;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const VALID_PAYMENT_METHODS = ["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "ONLINE"];
const VALID_PAYMENT_STATUSES = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate and sanitize a positive monetary amount.
 * Returns the amount as a number, or throws.
 */
const validateAmount = (amount) => {
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
        throw new ErrorHandler("Amount must be a positive number", 400);
    }
    // Max 2 decimal places
    if (Math.round(num * 100) / 100 !== num) {
        throw new ErrorHandler("Amount cannot have more than 2 decimal places", 400);
    }
    // Sensible upper bound guard
    if (num > 10_000_000) {
        throw new ErrorHandler("Amount exceeds maximum allowed value", 400);
    }
    return num;
};

/**
 * Validate that a string ID is non-empty and doesn't contain injection characters.
 */
const validateId = (id, fieldName = "ID") => {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
        throw new ErrorHandler(`${fieldName} is required`, 400);
    }
    // cuid format: alphanumeric, typically 25 chars
    if (!/^[a-z0-9]+$/i.test(id.trim())) {
        throw new ErrorHandler(`Invalid ${fieldName} format`, 400);
    }
    return id.trim();
};

/**
 * Parse pagination params with sane defaults and upper bounds.
 */
const parsePagination = (query) => {
    let page = Math.max(1, parseInt(query.page, 10) || 1);
    let limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE));
    return { page, limit, skip: (page - 1) * limit };
};

/**
 * Generate a sequential invoice number: GYM-INV-YYYYMMDD-NNNN
 */
const generateInvoiceNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = `GYM-INV-${dateStr}-`;

    // Find the highest invoice number for today
    const lastInvoice = await prisma.payment.findFirst({
        where: {
            invoiceNumber: { startsWith: prefix },
        },
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
    });

    let seq = 1;
    if (lastInvoice?.invoiceNumber) {
        const lastSeq = parseInt(lastInvoice.invoiceNumber.split("-").pop(), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(4, "0")}`;
};

/**
 * Check if the authenticated user owns the member record,
 * or is an ADMIN.
 */
const assertOwnershipOrAdmin = async (req, memberId) => {
    if (req.user.role === "ADMIN") return;

    const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: { userId: true },
    });

    if (!member) {
        throw new ErrorHandler("Member not found", 404);
    }

    if (member.userId !== req.user.id) {
        throw new ErrorHandler("Access denied: insufficient permissions", 403);
    }
};

// ─── 1. createPayment ────────────────────────────────────────────────────────
// Admin records a payment. For ONLINE method, creates a Razorpay order.
// For offline methods (CASH, UPI, etc.), records it directly as SUCCESS.

const createPayment = asyncHandler(async (req, res) => {
    const { memberId, membershipId, amount, paymentMethod, description } = req.body;

    // ── Validate inputs ──
    const validMemberId = validateId(memberId, "Member ID");
    const validAmount = validateAmount(amount);

    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod.toUpperCase())) {
        throw new ErrorHandler(
            `Invalid payment method. Allowed: ${VALID_PAYMENT_METHODS.join(", ")}`,
            400
        );
    }

    const method = paymentMethod.toUpperCase();

    // ── Verify member exists ──
    const member = await prisma.member.findUnique({
        where: { id: validMemberId },
        select: { id: true, firstName: true, lastName: true },
    });

    if (!member) {
        throw new ErrorHandler("Member not found", 404);
    }

    // ── If membershipId provided, verify it exists and belongs to the member ──
    let validMembershipId = null;
    if (membershipId) {
        validMembershipId = validateId(membershipId, "Membership ID");
        const membership = await prisma.membership.findUnique({
            where: { id: validMembershipId },
            select: { id: true, memberId: true },
        });
        if (!membership) {
            throw new ErrorHandler("Membership not found", 404);
        }
        if (membership.memberId !== validMemberId) {
            throw new ErrorHandler("Membership does not belong to this member", 400);
        }
    }

    // ── ONLINE: Create Razorpay order ──
    if (method === "ONLINE") {
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(validAmount * 100), // Razorpay expects paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}_${validMemberId.slice(-6)}`,
            notes: {
                memberId: validMemberId,
                membershipId: validMembershipId || "",
                description: description || "",
            },
        });

        const payment = await prisma.payment.create({
            data: {
                memberId: validMemberId,
                membershipId: validMembershipId,
                amount: validAmount,
                paymentMethod: method,
                status: "PENDING",
                razorpayOrderId: razorpayOrder.id,
                description: description?.slice(0, 500) || null,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Razorpay order created. Complete payment on the client.",
            data: {
                paymentId: payment.id,
                razorpayOrderId: razorpayOrder.id,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                amount: validAmount,
                currency: "INR",
                memberName: `${member.firstName} ${member.lastName}`,
            },
        });
    }

    // ── OFFLINE (CASH, UPI, CARD, etc.): Record directly as SUCCESS ──
    const payment = await prisma.$transaction(async (tx) => {
        const newPayment = await tx.payment.create({
            data: {
                memberId: validMemberId,
                membershipId: validMembershipId,
                amount: validAmount,
                paymentMethod: method,
                status: "SUCCESS",
                transactionId: req.body.transactionId?.trim() || null,
                description: description?.slice(0, 500) || null,
            },
        });

        // If linked to a membership, activate it
        if (validMembershipId) {
            await tx.membership.update({
                where: { id: validMembershipId },
                data: { status: "ACTIVE" },
            });
        }

        return newPayment;
    });

    // Send email receipt asynchronously (non-blocking)
    prisma.member.findUnique({
        where: { id: validMemberId },
        include: { user: { select: { email: true } } },
    }).then((m) => {
        if (m?.user?.email) {
            sendPaymentReceipt(
                { name: `${m.firstName} ${m.lastName}`, email: m.user.email },
                { amount: validAmount, transactionId: payment.id, paymentMethod: method }
            ).catch((err) => console.error("⚠️ Failed to send payment receipt email:", err.message || err));
        }
    }).catch((err) => console.error("⚠️ Member lookup for payment receipt failed:", err.message || err));

    res.status(201).json({
        success: true,
        message: "Payment recorded successfully",
        data: { paymentId: payment.id },
    });
});

// ─── 2. verifyPayment ────────────────────────────────────────────────────────
// Client-side verification after Razorpay checkout completes.
// Verifies the HMAC-SHA256 signature to ensure the response wasn't tampered with.

const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ErrorHandler("Missing payment verification parameters", 400);
    }

    // ── Find the pending payment by Razorpay order ID ──
    const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
    });

    if (!payment) {
        throw new ErrorHandler("Payment record not found", 404);
    }

    // ── Replay attack prevention ──
    if (payment.status === "SUCCESS") {
        return res.status(200).json({
            success: true,
            message: "Payment already verified",
            data: { paymentId: payment.id },
        });
    }

    if (payment.status !== "PENDING") {
        throw new ErrorHandler("Payment cannot be verified in its current state", 400);
    }

    // ── HMAC-SHA256 signature verification ──
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(razorpay_signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
        // Mark as FAILED to prevent reuse
        await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
        });
        throw new ErrorHandler("Payment verification failed: invalid signature", 400);
    }

    // ── Atomically update payment + activate membership ──
    await prisma.$transaction(async (tx) => {
        let couponUsageId = null;

        // Consume coupon AFTER successful payment verification
        if (payment.appliedCouponCode && !payment.couponUsageId) {
            try {
                const usage = await couponService.applyCoupon(
                    payment.appliedCouponCode,
                    payment.memberId,
                    payment.membershipId,
                    payment.amount,
                    tx
                );
                couponUsageId = usage.id;
            } catch (err) {
                console.error("⚠️ Failed to consume coupon post-payment verification:", err.message || err);
            }
        }

        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: "SUCCESS",
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                paidAt: new Date(),
                ...(couponUsageId ? { couponUsageId } : {}),
            },
        });

        let planName = "Membership Plan";
        if (payment.membershipId) {
            const updatedMem = await tx.membership.update({
                where: { id: payment.membershipId },
                data: { status: "ACTIVE" },
                include: { plan: { select: { name: true } } },
            });
            if (updatedMem?.plan?.name) planName = updatedMem.plan.name;
        }

        // Clean up pending payment notifications & post success notification
        const member = await tx.member.findUnique({
            where: { id: payment.memberId },
            select: { userId: true },
        });

        if (member?.userId) {
            await tx.notification.deleteMany({
                where: {
                    userId: member.userId,
                    title: { in: ["Payment Required", "Membership Pending Approval"] },
                },
            });

            await tx.notification.create({
                data: {
                    userId: member.userId,
                    title: "🎉 Payment Successful",
                    message: `Your payment of ₹${payment.amount} for the ${planName} was verified successfully. Your membership is now ACTIVE!`,
                    type: "PAYMENT",
                },
            });
        }
    });

    // Send email receipt asynchronously (non-blocking)
    prisma.member.findUnique({
        where: { id: payment.memberId },
        include: { user: { select: { email: true } } },
    }).then((m) => {
        if (m?.user?.email) {
            sendPaymentReceipt(
                { name: `${m.firstName} ${m.lastName}`, email: m.user.email },
                { amount: payment.amount, transactionId: razorpay_payment_id || payment.id, paymentMethod: payment.paymentMethod }
            ).catch((err) => console.error("⚠️ Failed to send payment receipt email:", err.message || err));
        }
    }).catch((err) => console.error("⚠️ Member lookup for payment receipt failed:", err.message || err));

    // Grant referral rewards (fire-and-forget — non-blocking)
    couponService.grantReferralRewards(payment.memberId)
        .catch((err) => console.error("⚠️ Referral reward grant failed:", err.message || err));

    res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: { paymentId: payment.id },
    });
});

// ─── 3. webhook ──────────────────────────────────────────────────────────────
// Razorpay server-to-server webhook for reliable payment status updates.
// No auth middleware — secured via HMAC-SHA256 signature from Razorpay.
// IMPORTANT: Expects raw body (configured in app.js).

const webhook = asyncHandler(async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("RAZORPAY_WEBHOOK_SECRET not configured");
        return res.status(500).json({ success: false });
    }

    // ── Verify webhook signature ──
    const receivedSignature = req.headers["x-razorpay-signature"];

    if (!receivedSignature) {
        return res.status(400).json({ success: false, message: "Missing signature" });
    }

    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(req.rawBody || req.body)
        .digest("hex");

    const receivedBuffer = Buffer.from(receivedSignature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
        receivedBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
        return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // ── Parse and process the event ──
    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const eventType = event?.event;

    if (eventType === "payment.captured") {
        const rpPayment = event.payload?.payment?.entity;
        if (!rpPayment?.order_id) {
            return res.status(200).json({ success: true }); // Acknowledge but skip
        }

        const payment = await prisma.payment.findUnique({
            where: { razorpayOrderId: rpPayment.order_id },
        });

        // Idempotency: skip if already processed or not found
        if (!payment || payment.status === "SUCCESS") {
            return res.status(200).json({ success: true });
        }

        await prisma.$transaction(async (tx) => {
            let couponUsageId = null;

            if (payment.appliedCouponCode && !payment.couponUsageId) {
                try {
                    const usage = await couponService.applyCoupon(
                        payment.appliedCouponCode,
                        payment.memberId,
                        payment.membershipId,
                        payment.amount,
                        tx
                    );
                    couponUsageId = usage.id;
                } catch (err) {
                    console.error("⚠️ Failed to consume coupon in webhook:", err.message || err);
                }
            }

            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: "SUCCESS",
                    razorpayPaymentId: rpPayment.id,
                    paidAt: new Date(),
                    ...(couponUsageId ? { couponUsageId } : {}),
                },
            });

            let planName = "Membership Plan";
            if (payment.membershipId) {
                const updatedMem = await tx.membership.update({
                    where: { id: payment.membershipId },
                    data: { status: "ACTIVE" },
                    include: { plan: { select: { name: true } } },
                });
                if (updatedMem?.plan?.name) planName = updatedMem.plan.name;
            }

            const member = await tx.member.findUnique({
                where: { id: payment.memberId },
                select: { userId: true },
            });

            if (member?.userId) {
                await tx.notification.deleteMany({
                    where: {
                        userId: member.userId,
                        title: { in: ["Payment Required", "Membership Pending Approval"] },
                    },
                });

                await tx.notification.create({
                    data: {
                        userId: member.userId,
                        title: "🎉 Payment Successful",
                        message: `Your payment of ₹${payment.amount} for the ${planName} was processed successfully. Your membership is now ACTIVE!`,
                        type: "PAYMENT",
                    },
                });
            }
        });

        // Grant referral rewards (fire-and-forget)
        couponService.grantReferralRewards(payment.memberId)
            .catch((err) => console.error("⚠️ Referral reward grant failed (webhook):", err.message || err));

        // Send success email
        prisma.member.findUnique({
            where: { id: payment.memberId },
            include: { user: { select: { email: true } } },
        }).then((m) => {
            if (m?.user?.email) {
                sendPaymentReceipt(
                    { name: `${m.firstName} ${m.lastName}`, email: m.user.email },
                    { amount: payment.amount, transactionId: rpPayment.id || payment.id, paymentMethod: payment.paymentMethod }
                ).catch((err) => console.error("⚠️ Failed to send payment receipt email (webhook):", err.message || err));
            }
        }).catch((err) => console.error("⚠️ Member lookup for payment receipt failed (webhook):", err.message || err));
    } else if (eventType === "payment.failed") {
        const rpPayment = event.payload?.payment?.entity;
        if (rpPayment?.order_id) {
            const paymentsToFail = await prisma.payment.findMany({
                where: {
                    razorpayOrderId: rpPayment.order_id,
                    status: "PENDING",
                },
                include: {
                    member: {
                        include: { user: { select: { email: true } } },
                    },
                },
            });

            if (paymentsToFail.length > 0) {
                await prisma.payment.updateMany({
                    where: { id: { in: paymentsToFail.map(p => p.id) } },
                    data: { status: "FAILED" },
                });

                // Send failure email
                paymentsToFail.forEach(p => {
                    if (p.member?.user?.email) {
                        sendPaymentFailureEmail(
                            { name: `${p.member.firstName} ${p.member.lastName}`, email: p.member.user.email },
                            { amount: p.amount, orderId: rpPayment.order_id || p.id }
                        ).catch(err => console.error("⚠️ Failed to send payment failure email:", err));
                    }
                });
            }
        }
    } else if (eventType === "refund.processed") {
        const rpRefund = event.payload?.refund?.entity;
        if (rpRefund?.payment_id) {
            await prisma.payment.updateMany({
                where: {
                    razorpayPaymentId: rpRefund.payment_id,
                    status: { not: "REFUNDED" },
                },
                data: {
                    status: "REFUNDED",
                    refundId: rpRefund.id,
                    refundedAmount: rpRefund.amount / 100,
                    refundedAt: new Date(),
                },
            });
        }
    }

    // Always return 200 to acknowledge receipt (Razorpay retries on non-2xx)
    res.status(200).json({ success: true });
});

const failPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    let payment = await prisma.payment.findUnique({
        where: { id },
        include: { member: { include: { user: { select: { email: true } } } } },
    });

    if (!payment) {
        payment = await prisma.payment.findFirst({
            where: {
                OR: [{ razorpayOrderId: id }, { membershipId: id }],
            },
            include: { member: { include: { user: { select: { email: true } } } } },
        });
    }

    if (!payment) {
        throw new ErrorHandler("Payment record not found", 404);
    }

    if (payment.status === "FAILED") {
        return res.status(200).json(new ApiResponse(200, payment, "Payment is already marked as failed"));
    }

    if (payment.status !== "PENDING") {
        throw new ErrorHandler("Only PENDING payments can be marked as FAILED", 400);
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
        const updated = await tx.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
        });

        if (payment.membershipId) {
            await tx.membership.update({
                where: { id: payment.membershipId },
                data: { status: "CANCELLED" },
            }).catch(() => {});
        }

        if (payment.member?.userId) {
            await tx.notification.deleteMany({
                where: {
                    userId: payment.member.userId,
                    title: { in: ["Payment Required", "Membership Pending Approval"] },
                },
            });
        }

        return updated;
    });

    // Send failure email (non-blocking)
    if (payment.member?.user?.email) {
        sendPaymentFailureEmail(
            { name: `${payment.member.firstName} ${payment.member.lastName}`, email: payment.member.user.email },
            { amount: payment.amount, orderId: payment.razorpayOrderId || payment.id }
        ).catch((err) => console.error("⚠️ Failed to send payment failure email:", err));
    }

    res.status(200).json(new ApiResponse(200, updatedPayment, "Payment marked as failed"));
});

const retryPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: { membership: { include: { plan: true } } }
    });

    if (!payment) {
        throw new ErrorHandler("Payment not found", 404);
    }
    if (payment.status !== "FAILED") {
        throw new ErrorHandler("Only FAILED payments can be retried", 400);
    }
    if (!payment.membership) {
        throw new ErrorHandler("No membership associated with this payment", 400);
    }

    // Generate new Razorpay order
    const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(payment.amount * 100), // paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}_${payment.memberId.slice(-6)}`,
        notes: {
            memberId: payment.memberId,
            description: `Retry Payment - ${payment.membership.plan.name}`,
        },
    });

    const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
            status: "PENDING",
            razorpayOrderId: razorpayOrder.id,
        },
    });

    res.status(200).json(new ApiResponse(200, {
        payment: updatedPayment,
        razorpayOrderId: razorpayOrder.id,
        amount: Math.round(payment.amount * 100),
        key_id: process.env.RAZORPAY_KEY_ID,
    }, "Retry payment initiated"));
});

// ─── 4. refundPayment ────────────────────────────────────────────────────────
// Admin-only. Initiates a full or partial refund.
// Enforces 7-day refund window from payment date.

const refundPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, amount: refundAmountInput } = req.body;

    const validId = validateId(id, "Payment ID");

    const payment = await prisma.payment.findUnique({
        where: { id: validId },
        include: {
            member: { select: { firstName: true, lastName: true } },
        },
    });

    if (!payment) {
        throw new ErrorHandler("Payment not found", 404);
    }

    if (payment.status !== "SUCCESS") {
        throw new ErrorHandler("Only successful payments can be refunded", 400);
    }

    if (payment.refundId) {
        throw new ErrorHandler("Payment has already been refunded", 400);
    }

    // ── 7-day refund window ──
    const daysSincePayment = (Date.now() - new Date(payment.paidAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePayment > REFUND_WINDOW_DAYS) {
        throw new ErrorHandler(
            `Refund window expired. Refunds are only allowed within ${REFUND_WINDOW_DAYS} days of payment`,
            400
        );
    }

    // ── Validate refund amount ──
    const paidAmount = Number(payment.amount);
    let refundAmount = paidAmount; // Default: full refund

    if (refundAmountInput !== undefined && refundAmountInput !== null) {
        refundAmount = validateAmount(refundAmountInput);
        if (refundAmount > paidAmount) {
            throw new ErrorHandler("Refund amount cannot exceed paid amount", 400);
        }
    }

    // ── Process refund ──
    let refundData = {
        status: "REFUNDED",
        refundedAmount: refundAmount,
        refundReason: reason?.slice(0, 500) || "Admin initiated refund",
        refundedAt: new Date(),
    };

    // If it was an online payment, initiate refund via Razorpay
    if (payment.razorpayPaymentId) {
        const rpRefund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(refundAmount * 100), // Razorpay expects paise
            notes: {
                reason: reason || "Admin initiated refund",
                paymentId: payment.id,
            },
        });

        refundData.refundId = rpRefund.id;
    } else {
        // Offline payment — just mark as refunded
        refundData.refundId = `offline_refund_${Date.now()}`;
    }

    await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: { id: validId },
            data: refundData,
        });

        // If linked to a membership, suspend it
        if (payment.membershipId) {
            await tx.membership.update({
                where: { id: payment.membershipId },
                data: { status: "FROZEN" },
            });
        }
    });

    res.status(200).json({
        success: true,
        message: `Refund of ₹${refundAmount} processed successfully`,
        data: {
            paymentId: payment.id,
            refundId: refundData.refundId,
            refundedAmount: refundAmount,
        },
    });
});

// ─── 5. downloadInvoice ──────────────────────────────────────────────────────
// Generate and stream a PDF invoice for a successful payment.
// Members can only download their own invoices.

const downloadInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validId = validateId(id, "Payment ID");

    const payment = await prisma.payment.findUnique({
        where: { id: validId },
        include: {
            member: {
                select: {
                    firstName: true,
                    lastName: true,
                    phone: true,
                    user: { select: { email: true } },
                },
            },
            membership: {
                include: {
                    plan: { select: { name: true, durationMonths: true } },
                },
            },
        },
    });

    if (!payment) {
        throw new ErrorHandler("Payment not found", 404);
    }

    // ── Ownership check ──
    await assertOwnershipOrAdmin(req, payment.memberId);

    if (payment.status !== "SUCCESS" && payment.status !== "REFUNDED") {
        throw new ErrorHandler("Invoice can only be generated for completed payments", 400);
    }

    // ── Auto-generate invoice number on first download ──
    let invoiceNumber = payment.invoiceNumber;
    if (!invoiceNumber) {
        invoiceNumber = await generateInvoiceNumber();
        await prisma.payment.update({
            where: { id: validId },
            data: { invoiceNumber },
        });
    }

    // ── Build PDF ──
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${invoiceNumber}.pdf"`
    );

    doc.pipe(res);

    // ── Header ──
    doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("GYM MANAGEMENT", { align: "center" })
        .fontSize(10)
        .font("Helvetica")
        .text("Tax Invoice / Receipt", { align: "center" })
        .moveDown(0.5);

    // Divider
    doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor("#333333")
        .lineWidth(2)
        .stroke()
        .moveDown(1);

    // ── Invoice Details ──
    const startY = doc.y;

    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Invoice Number:", 50, startY)
        .font("Helvetica")
        .text(invoiceNumber, 160, startY);

    doc
        .font("Helvetica-Bold")
        .text("Date:", 50, startY + 18)
        .font("Helvetica")
        .text(new Date(payment.paidAt).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }), 160, startY + 18);

    doc
        .font("Helvetica-Bold")
        .text("Status:", 50, startY + 36)
        .font("Helvetica")
        .text(payment.status, 160, startY + 36);

    // ── Member Details (right side) ──
    doc
        .font("Helvetica-Bold")
        .text("Bill To:", 350, startY)
        .font("Helvetica")
        .text(`${payment.member.firstName} ${payment.member.lastName}`, 350, startY + 18)
        .text(payment.member.user?.email || "", 350, startY + 36)
        .text(payment.member.phone || "", 350, startY + 54);

    doc.moveDown(5);

    // ── Items Table ──
    const tableTop = doc.y;
    const tableHeaders = ["Description", "Method", "Amount (₹)"];
    const colWidths = [250, 120, 125];
    const colX = [50, 300, 420];

    // Table header background
    doc
        .rect(50, tableTop, 495, 25)
        .fillColor("#2c3e50")
        .fill();

    // Table header text
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    tableHeaders.forEach((header, i) => {
        doc.text(header, colX[i] + 8, tableTop + 7, {
            width: colWidths[i],
            align: i === 2 ? "right" : "left",
        });
    });

    // Table row
    const rowY = tableTop + 30;
    doc.fillColor("#000000").font("Helvetica").fontSize(10);

    const itemDescription = payment.membership?.plan
        ? `${payment.membership.plan.name} (${payment.membership.plan.durationMonths} months)`
        : payment.description || "Gym Payment";

    doc.text(itemDescription, colX[0] + 8, rowY, { width: colWidths[0] });
    doc.text(payment.paymentMethod.replace(/_/g, " "), colX[1] + 8, rowY, {
        width: colWidths[1],
    });
    doc.text(`₹${Number(payment.amount).toFixed(2)}`, colX[2] + 8, rowY, {
        width: colWidths[2],
        align: "right",
    });

    // ── Total ──
    const totalY = rowY + 35;
    doc
        .moveTo(50, totalY)
        .lineTo(545, totalY)
        .strokeColor("#333333")
        .lineWidth(1)
        .stroke();

    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Total:", colX[1] + 8, totalY + 10, { width: colWidths[1] })
        .text(`₹${Number(payment.amount).toFixed(2)}`, colX[2] + 8, totalY + 10, {
            width: colWidths[2],
            align: "right",
        });

    // ── Refund info (if applicable) ──
    if (payment.status === "REFUNDED" && payment.refundedAmount) {
        doc
            .moveDown(2)
            .fillColor("#c0392b")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text(`Refunded: ₹${Number(payment.refundedAmount).toFixed(2)}`, 50)
            .font("Helvetica")
            .text(`Reason: ${payment.refundReason || "N/A"}`, 50)
            .text(
                `Refunded on: ${new Date(payment.refundedAt).toLocaleDateString("en-IN")}`,
                50
            );
    }

    // ── Footer ──
    doc
        .fillColor("#888888")
        .fontSize(8)
        .font("Helvetica")
        .text(
            "This is a computer-generated invoice and does not require a physical signature.",
            50,
            750,
            { align: "center", width: 495 }
        );

    doc.end();
});

// ─── 6. getRevenueReport ─────────────────────────────────────────────────────
// Admin-only. Revenue analytics grouped by day/week/month.
// Supports date range filtering.

const getRevenueReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, groupBy = "month" } = req.query;

    if (!["day", "week", "month"].includes(groupBy)) {
        throw new ErrorHandler("groupBy must be 'day', 'week', or 'month'", 400);
    }

    // ── Build date filter ──
    const dateFilter = {};
    if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) throw new ErrorHandler("Invalid startDate", 400);
        dateFilter.gte = start;
    }
    if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) throw new ErrorHandler("Invalid endDate", 400);
        // Include the entire end day
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
    }

    const where = {
        status: "SUCCESS",
        ...(Object.keys(dateFilter).length > 0 && { paidAt: dateFilter }),
    };

    // ── Aggregate totals ──
    const [totalRevenue, totalPayments, methodBreakdown, statusBreakdown] = await Promise.all([
        prisma.payment.aggregate({
            where,
            _sum: { amount: true },
            _count: { id: true },
            _avg: { amount: true },
        }),
        prisma.payment.count({ where: { ...(Object.keys(dateFilter).length > 0 && { paidAt: dateFilter }) } }),
        prisma.payment.groupBy({
            by: ["paymentMethod"],
            where,
            _sum: { amount: true },
            _count: { id: true },
        }),
        prisma.payment.groupBy({
            by: ["status"],
            where: {
                ...(Object.keys(dateFilter).length > 0 && { paidAt: dateFilter }),
            },
            _count: { id: true },
        }),
    ]);

    // ── Fetch successful payments for time-series grouping ──
    const payments = await prisma.payment.findMany({
        where,
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: "asc" },
    });

    // ── Group by time period ──
    const grouped = {};
    for (const p of payments) {
        const date = new Date(p.paidAt);
        let key;
        if (groupBy === "day") {
            key = date.toISOString().slice(0, 10);
        } else if (groupBy === "week") {
            // ISO week start (Monday)
            const d = new Date(date);
            d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
            key = `Week of ${d.toISOString().slice(0, 10)}`;
        } else {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        }

        if (!grouped[key]) {
            grouped[key] = { period: key, revenue: 0, count: 0 };
        }
        grouped[key].revenue += Number(p.amount);
        grouped[key].count += 1;
    }

    res.status(200).json({
        success: true,
        data: {
            summary: {
                totalRevenue: Number(totalRevenue._sum.amount || 0),
                successfulPayments: totalRevenue._count.id,
                totalPayments,
                averagePayment: Number(totalRevenue._avg.amount || 0),
            },
            byMethod: methodBreakdown.map((m) => ({
                method: m.paymentMethod,
                revenue: Number(m._sum.amount),
                count: m._count.id,
            })),
            byStatus: statusBreakdown.map((s) => ({
                status: s.status,
                count: s._count.id,
            })),
            timeSeries: Object.values(grouped),
        },
    });
});

// ─── 7. getMemberPayments ────────────────────────────────────────────────────
// Payment history for a specific member.
// Members can only view their own; admins can view any member's.

const getMemberPayments = asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    const validMemberId = validateId(memberId, "Member ID");

    // ── Ownership check ──
    await assertOwnershipOrAdmin(req, validMemberId);

    const { page, limit, skip } = parsePagination(req.query);
    const { status, method } = req.query;

    // ── Build filters ──
    const where = { memberId: validMemberId };
    if (status && VALID_PAYMENT_STATUSES.includes(status.toUpperCase())) {
        where.status = status.toUpperCase();
    }
    if (method && VALID_PAYMENT_METHODS.includes(method.toUpperCase())) {
        where.paymentMethod = method.toUpperCase();
    }

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            include: {
                membership: {
                    include: { plan: { select: { name: true } } },
                },
            },
            orderBy: { paidAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.payment.count({ where }),
    ]);

    res.status(200).json({
        success: true,
        data: {
            payments: payments.map((p) => ({
                ...p,
                amount: Number(p.amount),
                refundedAmount: p.refundedAmount ? Number(p.refundedAmount) : null,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
    });
});

// ─── 8. getAllPayments ────────────────────────────────────────────────────────
// Admin-only. Paginated list of all payments with filters.

const getAllPayments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const { status, method, startDate, endDate, search } = req.query;

    // ── Build filters ──
    const where = {};

    if (status && VALID_PAYMENT_STATUSES.includes(status.toUpperCase())) {
        where.status = status.toUpperCase();
    }
    if (method && VALID_PAYMENT_METHODS.includes(method.toUpperCase())) {
        where.paymentMethod = method.toUpperCase();
    }
    if (startDate || endDate) {
        where.paidAt = {};
        if (startDate) {
            const start = new Date(startDate);
            if (!isNaN(start.getTime())) where.paidAt.gte = start;
        }
        if (endDate) {
            const end = new Date(endDate);
            if (!isNaN(end.getTime())) {
                end.setHours(23, 59, 59, 999);
                where.paidAt.lte = end;
            }
        }
    }

    // ── Optional search by member name ──
    if (search && typeof search === "string" && search.trim().length > 0) {
        const sanitized = search.trim().slice(0, 100);
        where.member = {
            OR: [
                { firstName: { contains: sanitized, mode: "insensitive" } },
                { lastName: { contains: sanitized, mode: "insensitive" } },
            ],
        };
    }

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            include: {
                member: {
                    select: { firstName: true, lastName: true, phone: true },
                },
                membership: {
                    include: { plan: { select: { name: true } } },
                },
            },
            orderBy: { paidAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.payment.count({ where }),
    ]);

    res.status(200).json({
        success: true,
        data: {
            payments: payments.map((p) => ({
                ...p,
                amount: Number(p.amount),
                refundedAmount: p.refundedAmount ? Number(p.refundedAmount) : null,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
    });
});

// ─── 9. getPaymentById ───────────────────────────────────────────────────────
// View a single payment. Members can only see their own.

const getPaymentById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validId = validateId(id, "Payment ID");

    const payment = await prisma.payment.findUnique({
        where: { id: validId },
        include: {
            member: {
                select: {
                    firstName: true,
                    lastName: true,
                    phone: true,
                    user: { select: { email: true } },
                },
            },
            membership: {
                include: {
                    plan: {
                        select: { name: true, durationMonths: true, price: true },
                    },
                },
            },
        },
    });

    if (!payment) {
        throw new ErrorHandler("Payment not found", 404);
    }

    // ── Ownership check ──
    await assertOwnershipOrAdmin(req, payment.memberId);

    res.status(200).json({
        success: true,
        data: {
            ...payment,
            amount: Number(payment.amount),
            refundedAmount: payment.refundedAmount ? Number(payment.refundedAmount) : null,
        },
    });
});

// ─── Exports ─────────────────────────────────────────────────────────────────

export {
    createPayment,
    verifyPayment,
    webhook,
    failPayment,
    retryPayment,
    refundPayment,
    downloadInvoice,
    getRevenueReport,
    getMemberPayments,
    getAllPayments,
    getPaymentById,
};
