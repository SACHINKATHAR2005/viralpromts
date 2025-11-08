"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.createError = exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, errors) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (error, req, res, next) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    let errors = error.errors || [];
    console.error('Error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        timestamp: new Date().toISOString()
    });
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        errors = Object.values(error.errors).map((err) => err.message);
    }
    if (error.code === 11000) {
        statusCode = 409;
        const field = Object.keys(error.keyPattern)[0];
        message = `Duplicate ${field}`;
        errors = [`${field} already exists`];
    }
    if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        errors = ['Please provide a valid ID'];
    }
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        errors = ['Authentication failed'];
    }
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        errors = ['Please login again'];
    }
    if (error.name === 'MongoNetworkError') {
        statusCode = 500;
        message = 'Database connection error';
        errors = ['Database temporarily unavailable'];
    }
    if (error.statusCode === 429) {
        statusCode = 429;
        message = 'Too many requests';
        errors = ['Please try again later'];
    }
    const response = {
        success: false,
        message,
        errors: errors.length > 0 ? errors : [message]
    };
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404, ['The requested endpoint does not exist']);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
exports.createError = {
    badRequest: (message = 'Bad request', errors) => new AppError(message, 400, errors),
    unauthorized: (message = 'Unauthorized', errors) => new AppError(message, 401, errors),
    forbidden: (message = 'Forbidden', errors) => new AppError(message, 403, errors),
    notFound: (message = 'Not found', errors) => new AppError(message, 404, errors),
    conflict: (message = 'Conflict', errors) => new AppError(message, 409, errors),
    internal: (message = 'Internal server error', errors) => new AppError(message, 500, errors)
};
const requestLogger = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
            body: req.body,
            params: req.params,
            query: req.query,
            headers: {
                'content-type': req.headers['content-type'],
                'authorization': req.headers.authorization ? 'Bearer ***' : undefined
            }
        });
    }
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=error.middleware.js.map