import Razorpay from "razorpay";
import "dotenv/config";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn(
        "⚠️  RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Online payments will fail."
    );
}

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpayInstance;
