import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
declare class AdminController {
    getAllUsers(req: AuthRequest, res: Response): Promise<void>;
    getUserById(req: AuthRequest, res: Response): Promise<void>;
    toggleUserStatus(req: AuthRequest, res: Response): Promise<void>;
    toggleMonetization(req: AuthRequest, res: Response): Promise<void>;
    toggleUserVerification(req: AuthRequest, res: Response): Promise<void>;
    getAllPrompts(req: AuthRequest, res: Response): Promise<void>;
    togglePromptStatus(req: AuthRequest, res: Response): Promise<void>;
    getPlatformStats(req: AuthRequest, res: Response): Promise<void>;
    deleteUser(req: AuthRequest, res: Response): Promise<void>;
}
export declare const adminController: AdminController;
export {};
//# sourceMappingURL=admin.controller.d.ts.map