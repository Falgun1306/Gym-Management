import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import memberRepository from "../repositories/member.repository.js";
import membershipRepository from "../repositories/membership.repository.js";
import attendanceRepository from "../repositories/attendance.repository.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

class QrCheckinService {
    /**
     * Generate a QR code for the authenticated member.
     * The QR encodes a short-lived JWT token that a trainer can scan.
     */
    async generateQrCode(userId) {
        const member = await memberRepository.findByUserId(userId);
        if (!member) {
            throw new ErrorHandler("Member profile not found", 404);
        }

        // Verify the member has an active membership
        const activeMembership = await this.#getActiveMembership(member.id);
        if (!activeMembership) {
            throw new ErrorHandler(
                "No active membership found. QR code cannot be generated",
                403
            );
        }

        const secret = process.env.QR_TOKEN_SECRET || process.env.JWT_SECRET;
        const expiryMinutes = parseInt(process.env.QR_TOKEN_EXPIRY_MINUTES) || 5;

        // Create a short-lived token with member info
        const qrToken = jwt.sign(
            {
                memberId: member.id,
                purpose: "gym-checkin",
            },
            secret,
            { expiresIn: `${expiryMinutes}m` }
        );

        // Generate QR code as data-URL (PNG)
        const qrCodeDataUrl = await QRCode.toDataURL(qrToken, {
            width: 300,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
        });

        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        return {
            qrCodeDataUrl,
            qrCodeUrl: qrCodeDataUrl,
            token: qrToken,
            qrToken,
            expiresAt,
            memberName: `${member.firstName} ${member.lastName}`,
        };
    }

    /**
     * Scan a QR token (submitted by a trainer) to check the member in or out.
     * Toggle logic: if already checked in today → check out, otherwise → check in.
     */
    async scanQrCode(qrToken) {
        if (!qrToken) {
            throw new ErrorHandler("QR token is required", 400);
        }

        const secret = process.env.QR_TOKEN_SECRET || process.env.JWT_SECRET;

        // Verify the token
        let decoded;
        try {
            decoded = jwt.verify(qrToken, secret);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new ErrorHandler(
                    "QR code has expired. Please generate a new one",
                    401
                );
            }
            throw new ErrorHandler("Invalid QR code", 401);
        }

        // Validate the token purpose
        if (decoded.purpose !== "gym-checkin") {
            throw new ErrorHandler("Invalid QR code: wrong token type", 400);
        }

        const { memberId } = decoded;

        // Verify the member exists
        const member = await memberRepository.findById(memberId);
        if (!member) {
            throw new ErrorHandler("Member not found", 404);
        }

        // Verify active membership
        const activeMembership = await this.#getActiveMembership(memberId);
        if (!activeMembership) {
            throw new ErrorHandler(
                "Member does not have an active membership",
                403
            );
        }

        // Toggle check-in / check-out
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await attendanceRepository.findActiveCheckIn(
            memberId,
            today,
            tomorrow
        );

        if (existing) {
            // Already checked in → check out
            const attendance = await attendanceRepository.update(existing.id, {
                checkOut: new Date(),
            });
            return {
                action: "CHECK_OUT",
                attendance,
                memberName: `${member.firstName} ${member.lastName}`,
            };
        }

        // No active check-in → check in
        const attendance = await attendanceRepository.create({
            memberId,
            checkIn: new Date(),
            date: new Date(),
            checkInMethod: "QR_CODE",
        });

        return {
            action: "CHECK_IN",
            attendance,
            memberName: `${member.firstName} ${member.lastName}`,
        };
    }

    /**
     * Find an active membership for a member.
     * @private
     */
    async #getActiveMembership(memberId) {
        const { data } = await membershipRepository.findMemberships(
            {
                memberId,
                status: { in: ["ACTIVE", "PENDING", "FROZEN"] },
                endDate: { gte: new Date() },
            },
            0,
            1
        );
        if (data.length > 0) {
            if (data[0].status === "PENDING") {
                return membershipRepository.update(data[0].id, { status: "ACTIVE" });
            }
            return data[0];
        }
        return null;
    }
}

export default new QrCheckinService();
