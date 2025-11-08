import { Request, Response, NextFunction } from 'express';
interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
}
export declare class RateLimitService {
    private static getRedis;
    static createRateLimit(options: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    static globalLimit: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    static authLimit: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    static socialLimit: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    static uploadLimit: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    static searchLimit: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    static commentLimit: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    static creationLimit: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    static isRateLimited(userId: string, action: string, maxRequests: number, windowMs: number): Promise<boolean>;
    static incrementCounter(userId: string, action: string, windowMs: number): Promise<void>;
    static getRemainingRequests(userId: string, action: string, maxRequests: number, windowMs: number): Promise<number>;
    static resetRateLimit(userId: string, action: string): Promise<void>;
}
export {};
//# sourceMappingURL=rateLimit.middleware.d.ts.map