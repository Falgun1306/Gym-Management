const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err);

    const statusCode = err.statusCode || 500;

    const isOperational = !!err.statusCode; 
    const message =
        isOperational || process.env.NODE_ENV !== "production"
            ? err.message || "Internal Server Error"
            : "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message,
    });
};

export default errorHandler;