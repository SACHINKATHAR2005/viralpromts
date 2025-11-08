import { Request, Response } from 'express';
import { IUser } from '../types/user.types';
import { AuthRequest } from '../types/auth.types';
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const getMe: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const logout: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map