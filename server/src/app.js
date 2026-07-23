import express from "express";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/errorHandler.middleware.js";

const app = express();

// ── Raw body parsing for Razorpay webhook (must come BEFORE express.json) ──
// Razorpay sends webhooks with JSON body, but HMAC verification requires
// the raw body string. We capture it only on the webhook route.
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }), (req, _res, next) => {
    // Store the raw body for HMAC verification, then parse it
    req.rawBody = req.body;
    if (Buffer.isBuffer(req.body)) {
        req.body = req.body.toString("utf8");
    }
    next();
});

app.use(express.json());
app.use(cookieParser());


app.get("/", (req,res)=>{
    res.send("server is on fire");
})

import userRouter from "./routes/user.router.js";
app.use("/api/v1/users",userRouter);

import paymentRouter from "./routes/payment.router.js";
app.use("/api/v1/payments", paymentRouter);

app.use(errorHandler);

export {app};