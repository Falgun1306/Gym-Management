import { createTransporter, getEmailFrom } from "../config/email.js";
import { getWelcomeEmailTemplate } from "../templates/emails/welcome.template.js";
import { getPasswordResetEmailTemplate } from "../templates/emails/passwordReset.template.js";
import { getMembershipExpiryEmailTemplate } from "../templates/emails/membershipExpiry.template.js";
import { getPaymentReceiptEmailTemplate } from "../templates/emails/paymentReceipt.template.js";
import { getClassReminderEmailTemplate } from "../templates/emails/classReminder.template.js";
import { getPaymentFailureEmailTemplate } from "../templates/emails/paymentFailure.template.js";

/**
 * Base method to send any email
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content of the email
 * @param {string} [options.text] - Plain text content of the email
 * @param {string} [options.from] - Custom sender address
 * @returns {Promise<Object>} nodemailer send info
 */
export const sendEmail = async ({ to, subject, html, text, from }) => {
    try {
        if (!to) {
            throw new Error("Recipient 'to' email address is required.");
        }

        const transporter = await createTransporter();
        const mailOptions = {
            from: from || getEmailFrom(),
            to,
            subject,
            html,
            text: text || "",
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email sent successfully to ${to} (Message ID: ${info.messageId})`);
        return info;
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        throw error;
    }
};

/**
 * Send Welcome Email to a newly registered user or member
 * @param {Object} user - User/Member object (must have email & name)
 * @param {Object} [options] - Additional template parameters
 */
export const sendWelcomeEmail = async (user, options = {}) => {
    const templateData = {
        name: user.name || user.firstName || "Member",
        email: user.email,
        role: user.role || options.role || "Member",
        loginUrl: options.loginUrl || process.env.CLIENT_URL || "#",
    };

    const { subject, html, text } = getWelcomeEmailTemplate(templateData);

    return await sendEmail({
        to: user.email,
        subject,
        html,
        text,
    });
};

/**
 * Send Password Reset Email with reset token or link
 * @param {Object} user - User object containing email & name
 * @param {Object} resetDetails
 * @param {string} [resetDetails.resetToken] - Password reset token
 * @param {string} resetDetails.resetUrl - Full reset link URL
 * @param {number} [resetDetails.expiresInMinutes=15] - Token validity in minutes
 */
export const sendPasswordResetEmail = async (user, resetDetails = {}) => {
    const templateData = {
        name: user.name || user.firstName || "User",
        resetToken: resetDetails.resetToken,
        resetUrl: resetDetails.resetUrl || "#",
        expiresInMinutes: resetDetails.expiresInMinutes || 15,
    };

    const { subject, html, text } = getPasswordResetEmailTemplate(templateData);

    return await sendEmail({
        to: user.email,
        subject,
        html,
        text,
    });
};

/**
 * Send Membership Expiry Reminder Email
 * @param {Object} member - Member object containing email & name
 * @param {Object} membershipDetails
 * @param {string} [membershipDetails.planName] - Name of the membership plan
 * @param {string} membershipDetails.expiryDate - Formatted expiry date string
 * @param {number} [membershipDetails.daysRemaining] - Days remaining before expiration
 * @param {string} [membershipDetails.renewUrl] - Renewal URL
 */
export const sendMembershipExpiryReminder = async (member, membershipDetails = {}) => {
    const templateData = {
        name: member.name || member.firstName || "Member",
        planName: membershipDetails.planName || "Gym Membership",
        expiryDate: membershipDetails.expiryDate,
        daysRemaining: membershipDetails.daysRemaining,
        renewUrl: membershipDetails.renewUrl || "#",
    };

    const { subject, html, text } = getMembershipExpiryEmailTemplate(templateData);

    return await sendEmail({
        to: member.email,
        subject,
        html,
        text,
    });
};

/**
 * Send Payment Receipt Email
 * @param {Object} member - Member object containing email & name
 * @param {Object} paymentDetails
 * @param {number|string} paymentDetails.amount - Payment amount
 * @param {string} [paymentDetails.currency="INR"] - Currency unit
 * @param {string} paymentDetails.transactionId - Transaction ID / Payment ID
 * @param {string} [paymentDetails.paymentDate] - Date of transaction
 * @param {string} [paymentDetails.paymentMethod] - Method (Card, UPI, cash, etc.)
 * @param {string} [paymentDetails.planName] - Description of items/plan
 * @param {string} [paymentDetails.receiptUrl] - Receipt link
 */
export const sendPaymentReceipt = async (member, paymentDetails = {}) => {
    const templateData = {
        name: member.name || member.firstName || "Valued Customer",
        amount: paymentDetails.amount,
        currency: paymentDetails.currency || "INR",
        transactionId: paymentDetails.transactionId,
        paymentDate: paymentDetails.paymentDate || new Date().toLocaleDateString(),
        paymentMethod: paymentDetails.paymentMethod || "Online Payment",
        planName: paymentDetails.planName || "Gym Membership",
        receiptUrl: paymentDetails.receiptUrl || "#",
    };

    const { subject, html, text } = getPaymentReceiptEmailTemplate(templateData);

    return await sendEmail({
        to: member.email,
        subject,
        html,
        text,
    });
};

/**
 * Send Class Reminder Email
 * @param {Object} member - Member object containing email & name
 * @param {Object} classDetails
 * @param {string} classDetails.className - Title of class
 * @param {string} [classDetails.instructorName] - Trainer's name
 * @param {string} classDetails.classTime - Scheduled time of class
 * @param {string} [classDetails.location] - Room or studio location
 * @param {string} [classDetails.joinUrl] - Link to view class details
 */
export const sendClassReminder = async (member, classDetails = {}) => {
    const templateData = {
        name: member.name || member.firstName || "Member",
        className: classDetails.className,
        instructorName: classDetails.instructorName || "Gym Instructor",
        classTime: classDetails.classTime,
        location: classDetails.location || "Main Studio",
        joinUrl: classDetails.joinUrl || "#",
    };

    const { subject, html, text } = getClassReminderEmailTemplate(templateData);

    return await sendEmail({
        to: member.email,
        subject,
        html,
        text,
    });
};

/**
 * Send Payment Failure Notification
 * @param {Object} member - User object with email and name
 * @param {Object} paymentDetails - amount and orderId
 */
export const sendPaymentFailureEmail = async (member, paymentDetails) => {
    const { subject, html, text } = getPaymentFailureEmailTemplate({
        name: member.name || member.firstName || "Valued Member",
        ...paymentDetails,
    });

    return await sendEmail({
        to: member.email,
        subject,
        html,
        text,
    });
};

export default {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendMembershipExpiryReminder,
    sendPaymentReceipt,
    sendClassReminder,
    sendPaymentFailureEmail,
};
