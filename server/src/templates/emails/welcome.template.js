/**
 * Generates Welcome Email template
 * @param {Object} data
 * @param {string} data.name - Recipient's name
 * @param {string} [data.email] - Recipient's email
 * @param {string} [data.role] - Recipient's role (Member/Trainer)
 * @param {string} [data.loginUrl] - Portal login URL
 */
export const getWelcomeEmailTemplate = ({ name, email, role = "Member", loginUrl = "#" }) => {
    const subject = `Welcome to Gym Management, ${name}! 🏋️‍♂️`;

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
        <h1 style="color: #38bdf8; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">GYM MANAGEMENT</h1>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Your Fitness Journey Starts Here</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 30px 25px;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Welcome aboard, ${name}! 👋</h2>
        <p style="line-height: 1.6; color: #475569;">We are thrilled to have you join our community as a <strong>${role}</strong>. Get ready to push your boundaries, track your progress, and reach your fitness goals with us.</p>
        
        ${email ? `<div style="background-color: #f8fafc; border-left: 4px solid #38bdf8; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #334155; font-size: 14px;"><strong>Account Email:</strong> ${email}</p>
        </div>` : ''}

        <p style="line-height: 1.6; color: #475569;">You can now log in to your account, manage your membership, book classes, and view your personalized workout & diet plans.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 2px 5px rgba(2,132,199,0.3);">Go to Portal</a>
        </div>

        <p style="line-height: 1.6; color: #475569; margin-bottom: 0;">If you have any questions or need assistance, feel free to reply to this email or speak to our front desk team.</p>
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
Welcome to Gym Management, ${name}!

We are thrilled to have you join our community as a ${role}. Get ready to push your boundaries and achieve your fitness goals with us.

${email ? `Account Email: ${email}\n` : ''}
Log in to your account to view your dashboard: ${loginUrl}

Best regards,
Gym Management Team
    `.trim();

    return { subject, html, text };
};
