import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    errors?: string[];
    constructor(message: string, statusCode?: number, errors?: string[]);
}
export declare const errorHandler: (error: any, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createError: {
    badRequest: (message?: string, errors?: string[]) => AppError;
    unauthorized: (message?: string, errors?: string[]) => AppError;
    forbidden: (message?: string, errors?: string[]) => AppError;
    notFound: (message?: string, errors?: string[]) => AppError;
    conflict: (message?: string, errors?: string[]) => AppError;
    internal: (message?: string, errors?: string[]) => AppError;
};
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.middleware.d.ts.map