/**
 * Generates Payment Receipt Email template
 * @param {Object} data
 * @param {string} data.name - Member name
 * @param {number|string} data.amount - Amount paid
 * @param {string} [data.currency="INR"] - Currency code (e.g. INR or USD)
 * @param {string} data.transactionId - Transaction or Payment ID
 * @param {string} [data.paymentDate] - Date of payment
 * @param {string} [data.paymentMethod] - Method of payment (e.g. Card, UPI, Netbanking)
 * @param {string} [data.planName] - Item or Plan description
 * @param {string} [data.receiptUrl] - Link to view/download receipt PDF
 */
export const getPaymentReceiptEmailTemplate = ({
    name,
    amount,
    currency = "INR",
    transactionId,
    paymentDate = new Date().toLocaleDateString(),
    paymentMethod = "Online Payment",
    planName = "Gym Membership / Services",
    receiptUrl = "#"
}) => {
    const formattedAmount = typeof amount === "number" ? `${currency} ${amount.toLocaleString()}` : `${currency} ${amount}`;
    const subject = `Payment Confirmation - ${transactionId} - Gym Management`;

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
      <td style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">PAYMENT RECEIVED</h1>
        <p style="color: #a7f3d0; margin: 5px 0 0 0; font-size: 14px;">Thank you for your payment!</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 30px 25px;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Hi ${name},</h2>
        <p style="line-height: 1.6; color: #475569;">We successfully received your payment. Below is your payment summary:</p>

        <!-- Receipt Table -->
        <table width="100%" cellspacing="0" cellpadding="12" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="color: #64748b; font-size: 14px;">Transaction ID:</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 14px; text-align: right; font-family: monospace;">${transactionId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="color: #64748b; font-size: 14px;">Description:</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">${planName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="color: #64748b; font-size: 14px;">Payment Date:</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">${paymentDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="color: #64748b; font-size: 14px;">Payment Method:</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="color: #0f172a; font-weight: 700; font-size: 16px;">Total Paid:</td>
            <td style="color: #059669; font-weight: 700; font-size: 18px; text-align: right;">${formattedAmount}</td>
          </tr>
        </table>

        ${receiptUrl !== '#' ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${receiptUrl}" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 2px 5px rgba(16,185,129,0.3);">View Receipt</a>
        </div>` : ''}

        <p style="line-height: 1.6; color: #475569; margin-bottom: 0;">If you have any questions regarding this invoice, please reach out to our support team.</p>
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

Thank you for your payment!

Payment Summary:
Transaction ID: ${transactionId}
Description: ${planName}
Date: ${paymentDate}
Method: ${paymentMethod}
Total Amount: ${formattedAmount}

Best regards,
Gym Management Billing Team
    `.trim();

    return { subject, html, text };
};
