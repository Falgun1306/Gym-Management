/**
 * Generates Password Reset Email template
 * @param {Object} data
 * @param {string} data.name - Recipient's name
 * @param {string} [data.resetToken] - Password reset token
 * @param {string} data.resetUrl - Full password reset URL
 * @param {number} [data.expiresInMinutes=15] - Expiry time in minutes
 */
export const getPasswordResetEmailTemplate = ({ name, resetUrl, expiresInMinutes = 15 }) => {
    const subject = "Password Reset Request - Gym Management";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; color: #333333;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: #ef4444; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">GYM MANAGEMENT</h1>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Password Reset Request</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 30px 25px;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Hello ${name},</h2>
        <p style="line-height: 1.6; color: #475569;">We received a request to reset your password for your Gym Management account. Click the button below to reset it:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 2px 5px rgba(239,68,68,0.3);">Reset Password</a>
        </div>

        <p style="line-height: 1.6; color: #475569; font-size: 14px;">This link will expire in <strong>${expiresInMinutes} minutes</strong>.</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        
        <p style="line-height: 1.5; color: #94a3b8; font-size: 13px; margin-bottom: 0;">If you did not request a password reset, please ignore this email or contact support immediately. Your password will remain unchanged.</p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Gym Management System. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Hello ${name},

We received a request to reset your password for your Gym Management account.

Reset Link: ${resetUrl}

This link is valid for ${expiresInMinutes} minutes. If you did not request this, please ignore this message.

Best regards,
Gym Management Security Team
    `.trim();

    return { subject, html, text };
};
