const getPaymentFailureEmailTemplate = (data) => {
    const { name, amount, orderId } = data;
    const formattedAmount = `₹${Number(amount).toFixed(2)}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Failed</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #ef4444; padding: 30px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px; }
        .content { padding: 40px; }
        .content p { color: #475569; line-height: 1.6; margin-bottom: 20px; font-size: 16px; }
        .details-box { background-color: #f1f5f9; border-radius: 8px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 12px; }
        .details-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
        .label { color: #64748b; font-weight: 500; font-size: 14px; }
        .value { color: #0f172a; font-weight: 700; font-size: 14px; }
        .btn-container { text-align: center; margin-top: 30px; }
        .btn { display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; }
        .footer { background-color: #f8fafc; padding: 25px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #94a3b8; font-size: 13px; margin: 0 0 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Failed</h1>
        </div>
        
        <div class="content">
            <p>Hi ${name},</p>
            <p>We encountered an issue while processing your recent online payment. No charges were successfully captured.</p>
            
            <div class="details-box">
                <div class="details-row">
                    <span class="label">Amount Attempted:</span>
                    <span class="value">${formattedAmount}</span>
                </div>
                <div class="details-row">
                    <span class="label">Order / Payment ID:</span>
                    <span class="value">#${orderId || "N/A"}</span>
                </div>
                <div class="details-row">
                    <span class="label">Status:</span>
                    <span class="value" style="color: #ef4444;">Failed</span>
                </div>
            </div>

            <p>If you'd like to try again, you can easily retry this payment directly from your Member Portal dashboard.</p>
            
            <div class="btn-container">
                <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/members/my-membership" class="btn">Retry Payment</a>
            </div>
        </div>

        <div class="footer">
            <p>If you believe this is an error or need assistance, please contact the front desk.</p>
            <p>&copy; ${new Date().getFullYear()} Gym Management System</p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Hi ${name},

We encountered an issue while processing your recent online payment of ${formattedAmount}. No charges were successfully captured.

Order ID: #${orderId || "N/A"}
Status: Failed

If you'd like to try again, you can retry this payment directly from your Member Portal dashboard.

If you believe this is an error or need assistance, please contact the front desk.
    `.trim();

    return {
        subject: `Payment Failed - Retry Required`,
        html,
        text,
    };
};

export { getPaymentFailureEmailTemplate };
