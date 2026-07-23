import argon2 from "argon2";
import userRepository from "../repositories/user.repository.js";
import generateToken from "../utility/generateToken.utility.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

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
}

export default new AuthService();
