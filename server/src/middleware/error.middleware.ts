import { Request, Response, NextFunction } from 'express';

// Interface for API response
interface ApiResponse {
    success: boolean;
    message: string;
    errors?: string[];
    stack?: string;
}

// Custom error class
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public errors?: string[];

    constructor(message: string, statusCode: number = 500, errors?: string[]) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global error handling middleware
 * Must be placed after all routes
 */
export const errorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    let errors = error.errors || [];

    // Log error for debugging
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

    // Handle specific error types

    // MongoDB Validation Error
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        errors = Object.values(error.errors).map((err: any) => err.message);
    }

    // MongoDB Duplicate Key Error
    if (error.code === 11000) {
        statusCode = 409;
        const field = Object.keys(error.keyPattern)[0];
        message = `Duplicate ${field}`;
        errors = [`${field} already exists`];
    }

    // MongoDB Cast Error (Invalid ObjectId)
    if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        errors = ['Please provide a valid ID'];
    }

    // JWT Errors
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

    // Mongoose connection errors
    if (error.name === 'MongoNetworkError') {
        statusCode = 500;
        message = 'Database connection error';
        errors = ['Database temporarily unavailable'];
    }

    // Rate limiting error
    if (error.statusCode === 429) {
        statusCode = 429;
        message = 'Too many requests';
        errors = ['Please try again later'];
    }

    // Prepare response
    const response: ApiResponse = {
        success: false,
        message,
        errors: errors.length > 0 ? errors : [message]
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }

    res.status(statusCode).json(response);
};

/**
 * Middleware to handle 404 errors
 * Should be placed before the global error handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    const error = new AppError(
        `Route ${req.originalUrl} not found`,
        404,
        ['The requested endpoint does not exist']
    );
    next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Helper function to create common errors
 */
export const createError = {
    badRequest: (message: string = 'Bad request', errors?: string[]) =>
        new AppError(message, 400, errors),

    unauthorized: (message: string = 'Unauthorized', errors?: string[]) =>
        new AppError(message, 401, errors),

    forbidden: (message: string = 'Forbidden', errors?: string[]) =>
        new AppError(message, 403, errors),

    notFound: (message: string = 'Not found', errors?: string[]) =>
        new AppError(message, 404, errors),

    conflict: (message: string = 'Conflict', errors?: string[]) =>
        new AppError(message, 409, errors),

    internal: (message: string = 'Internal server error', errors?: string[]) =>
        new AppError(message, 500, errors)
};

/**
 * Middleware to log requests in development
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
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