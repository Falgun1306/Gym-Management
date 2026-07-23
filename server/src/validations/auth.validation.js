export const validateRegister = (req) => {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password) {
        return "All fields are required";
    }

    if (confirmPassword && password !== confirmPassword) {
        return "Passwords do not match";
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
