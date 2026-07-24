import argon2 from "argon2";
import jwt from "jsonwebtoken";
import userRepository from "../repositories/user.repository.js";
import generateToken from "../utility/generateToken.utility.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "./email.service.js";

class AuthService {
    async register(body) {
        const { username, password, confirmPassword, confirmpassword, email } = body;
        const passConfirm = confirmPassword || confirmpassword;

        if (!username || !email || !password) {
            throw new ErrorHandler("All fields are required", 400);
        }

        if (passConfirm && password !== passConfirm) {
            throw new ErrorHandler("Passwords do not match", 400);
        }

        const userWithEmail = await userRepository.findByEmail(email);
        if (userWithEmail) {
            throw new ErrorHandler("Email already exists", 400);
        }

        const userWithUsername = await userRepository.findByUsername(username);
        if (userWithUsername) {
            throw new ErrorHandler("Username already exists", 400);
        }

        const hashedPassword = await argon2.hash(password);

        const newUser = await userRepository.create({
            username,
            email,
            password: hashedPassword,
        });

        const token = generateToken({
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
        });

        // Trigger welcome email asynchronously (non-blocking)
        sendWelcomeEmail({
            name: newUser.username,
            email: newUser.email,
            role: newUser.role,
        }).catch((err) => {
            console.error("⚠️ Failed to send welcome email upon registration:", err.message || err);
        });

        return { user: newUser, token };
    }

    async login(body) {
        const { username, email, password } = body;

        if ((!username && !email) || !password) {
            throw new ErrorHandler("Username or Email and password are required", 400);
        }

        const user = await userRepository.findByEmailOrUsername(email, username);
        if (!user) {
            throw new ErrorHandler("Invalid username/email or password", 401);
        }

        const isValidPassword = await argon2.verify(user.password, password);
        if (!isValidPassword) {
            throw new ErrorHandler("Invalid username/email or password", 401);
        }

        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role,
        });

        return { user, token };
    }

    async forgotPassword(email) {
        if (!email) {
            throw new ErrorHandler("Email is required", 400);
        }

        const user = await userRepository.findByEmail(email);
        if (!user) {
            return { message: "If an account with that email exists, a password reset link has been sent." };
        }

        const resetToken = jwt.sign(
            { id: user.id, email: user.email, type: "password_reset" },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
        const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

        sendPasswordResetEmail(user, {
            resetToken,
            resetUrl,
            expiresInMinutes: 15,
        }).catch((err) => {
            console.error("⚠️ Failed to send password reset email:", err.message || err);
        });

        return { message: "If an account with that email exists, a password reset link has been sent." };
    }

    async resetPassword(body) {
        const { token, newPassword, confirmPassword, password } = body;
        const targetPassword = newPassword || password;

        if (!token || !targetPassword) {
            throw new ErrorHandler("Reset token and new password are required", 400);
        }

        if (confirmPassword && targetPassword !== confirmPassword) {
            throw new ErrorHandler("Passwords do not match", 400);
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            throw new ErrorHandler("Invalid or expired reset token", 400);
        }

        if (decoded.type !== "password_reset") {
            throw new ErrorHandler("Invalid token type", 400);
        }

        const user = await userRepository.findById(decoded.id);
        if (!user) {
            throw new ErrorHandler("User not found", 404);
        }

        const hashedPassword = await argon2.hash(targetPassword);
        await userRepository.update(user.id, { password: hashedPassword });

        return { message: "Password reset successful. You can now log in with your new password." };
    }
}

export default new AuthService();
