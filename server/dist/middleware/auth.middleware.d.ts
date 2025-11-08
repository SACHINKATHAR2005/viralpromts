import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireVerified: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireMonetization: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map