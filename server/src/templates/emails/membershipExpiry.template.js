/**
 * Generates Membership Expiry Reminder Email template
 * @param {Object} data
 * @param {string} data.name - Member name
 * @param {string} data.planName - Membership plan name (e.g. Premium Monthly)
 * @param {string} data.expiryDate - Expiry date string
 * @param {number} [data.daysRemaining] - Days remaining until expiry
 * @param {string} [data.renewUrl] - Membership renewal link
 */
export const getMembershipExpiryEmailTemplate = ({
    name,
    planName = "Gym Membership",
    expiryDate,
    daysRemaining,
    renewUrl = "#"
}) => {
    const isExpired = typeof daysRemaining === 'number' && daysRemaining <= 0;
    const subject = isExpired
        ? `Urgent: Your ${planName} Has Expired - Gym Management`
        : `Reminder: Your ${planName} Expires Soon (${daysRemaining ? daysRemaining + ' days left' : expiryDate})`;

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
        <h1 style="color: #f59e0b; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">GYM MANAGEMENT</h1>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Membership Status Notification</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 30px 25px;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Hi ${name},</h2>
        
        ${isExpired ? `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 0; color: #991b1b; font-weight: 600;">Your membership expired on ${expiryDate}.</p>
        </div>
        <p style="line-height: 1.6; color: #475569;">To keep enjoying uninterrupted access to gym facilities, equipment, and classes, please renew your membership plan today.</p>
        ` : `
        <p style="line-height: 1.6; color: #475569;">This is a friendly reminder that your <strong>${planName}</strong> is set to expire on <strong>${expiryDate}</strong>${typeof daysRemaining === 'number' ? ` (${daysRemaining} days remaining)` : ''}.</p>
        <p style="line-height: 1.6; color: #475569;">Renew early to ensure your fitness routine stays right on track!</p>
        `}
        
        <!-- Details Box -->
        <table width="100%" cellspacing="0" cellpadding="10" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin: 20px 0;">
          <tr>
            <td style="color: #64748b; font-size: 14px;">Plan:</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">${planName}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 14px;">Expiration Date:</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">${expiryDate}</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${renewUrl}" style="background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 2px 5px rgba(245,158,11,0.3);">Renew Membership Now</a>
        </div>

        <p style="line-height: 1.6; color: #475569; margin-bottom: 0;">If you have already renewed your membership, please disregard this email.</p>
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
Hi ${name},

${isExpired
            ? `Your ${planName} expired on ${expiryDate}. Please renew to maintain access.`
            : `Your ${planName} is set to expire on ${expiryDate}${typeof daysRemaining === 'number' ? ` (${daysRemaining} days remaining)` : ''}.`}

Renew link: ${renewUrl}

Best regards,
Gym Management Team
    `.trim();

    return { subject, html, text };
};
