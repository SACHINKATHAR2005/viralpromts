import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
export declare const requireRole: (roles: string | string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireUser: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=role.middleware.d.ts.map