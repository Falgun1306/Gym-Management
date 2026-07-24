import nodemailer from "nodemailer";
import { google } from "googleapis";
import "dotenv/config";

const OAuth2 = google.auth.OAuth2;

/**
 * Creates and returns a Nodemailer transporter configured with Google OAuth2 or SMTP authentication.
 */
export const createTransporter = async () => {
    const user = process.env.GMAIL_USER;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    const host = process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = Number(process.env.EMAIL_PORT) || 587;

    if (user && clientId && clientSecret && refreshToken) {
        try {
            const oauth2Client = new OAuth2(
                clientId,
                clientSecret,
                "https://developers.google.com/oauthplayground"
            );

            oauth2Client.setCredentials({
                refresh_token: refreshToken,
            });

            const accessToken = await new Promise((resolve, reject) => {
                oauth2Client.getAccessToken((err, token) => {
                    if (err) {
                        return reject("Failed to get OAuth2 access token: " + err);
                    }
                    resolve(token);
                });
            });

            return nodemailer.createTransport({
                service: "gmail",
                auth: {
                    type: "OAuth2",
                    user: user,
                    clientId: clientId,
                    clientSecret: clientSecret,
                    refreshToken: refreshToken,
                    accessToken: accessToken,
                },
            });
        } catch (error) {
            console.warn("⚠️ Google OAuth2 token creation warning:", error);
            console.warn("⚠️ Falling back to direct SMTP transporter configuration.");
        }
    }

    // Fallback to standard SMTP transport configuration
    return nodemailer.createTransport({
        host: host,
        port: port,
        secure: port === 465,
        auth: user ? { user } : undefined,
    });
};

/**
 * Default Sender Address
 */
export const getEmailFrom = () => {
    return process.env.EMAIL_FROM || `"Gym Management" <${process.env.GMAIL_USER || "noreply@gymmanagement.com"}>`;
};
