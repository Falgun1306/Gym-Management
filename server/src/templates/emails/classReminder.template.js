/**
 * Generates Class Reminder Email template
 * @param {Object} data
 * @param {string} data.name - Member name
 * @param {string} data.className - Name of the class (e.g. HIIT Training, Yoga)
 * @param {string} [data.instructorName] - Instructor name
 * @param {string} data.classTime - Scheduled date and time of class
 * @param {string} [data.location] - Room / Studio location or Online link
 * @param {string} [data.joinUrl] - Link to view class details
 */
export const getClassReminderEmailTemplate = ({
    name,
    className,
    instructorName = "Gym Trainer",
    classTime,
    location = "Main Workout Studio",
    joinUrl = "#"
}) => {
    const subject = `Upcoming Class Reminder: ${className} 🏋️‍♀️`;

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
      <td style="background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">UPCOMING CLASS</h1>
        <p style="color: #c7d2fe; margin: 5px 0 0 0; font-size: 14px;">Don't forget your upcoming fitness session!</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 30px 25px;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Hi ${name},</h2>
        <p style="line-height: 1.6; color: #475569;">You have an upcoming class scheduled soon! Here are the details:</p>

        <!-- Class Details Card -->
        <table width="100%" cellspacing="0" cellpadding="12" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="color: #64748b; font-size: 14px;">Class Name:</td>
            <td style="color: #4338ca; font-weight: 700; font-size: 16px; text-align: right;">${className}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="color: #64748b; font-size: 14px;">Instructor:</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">${instructorName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="color: #64748b; font-size: 14px;">Date & Time:</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">${classTime}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 14px;">Location / Room:</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">${location}</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${joinUrl}" style="background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 2px 5px rgba(99,102,241,0.3);">View Class Details</a>
        </div>

        <p style="line-height: 1.6; color: #475569; margin-bottom: 0;">Please remember to bring your gym towel and water bottle. See you there!</p>
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

Reminder: You have an upcoming class!

Class Name: ${className}
Instructor: ${instructorName}
Time: ${classTime}
Location: ${location}

View Details: ${joinUrl}

See you there!
Gym Management Team
    `.trim();

    return { subject, html, text };
};
