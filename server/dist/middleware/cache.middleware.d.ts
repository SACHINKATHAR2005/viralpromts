import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
export declare const cacheMiddleware: (durationInSeconds: number) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const userCacheMiddleware: (durationInSeconds: number) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const cacheInvalidationMiddleware: (patterns: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const socialCacheInvalidation: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=cache.middleware.d.ts.map