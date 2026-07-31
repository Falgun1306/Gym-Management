export const validateRegister = (req) => {
    const { username, email, password, confirmPassword, gender } = req.body;

    if (!username || !email || !password) {
        return "All fields are required";
    }

    if (confirmPassword && password !== confirmPassword) {
        return "Passwords do not match";
    }

    if (gender && !["MALE", "FEMALE", "OTHER"].includes(gender.toUpperCase())) {
        return "Invalid gender specified";
    }

    return null;
};

export const validateLogin = (req) => {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
        return "Username or Email and password are required";
    }

    return null;
};
