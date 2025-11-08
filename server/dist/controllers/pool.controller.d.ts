import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
export declare class PoolController {
    static createPool(req: AuthRequest, res: Response): Promise<Response>;
    static getPools(req: AuthRequest, res: Response): Promise<Response>;
    static getPool(req: AuthRequest, res: Response): Promise<Response>;
    static joinPool(req: AuthRequest, res: Response): Promise<Response>;
    static leavePool(req: AuthRequest, res: Response): Promise<Response>;
    static addPromptToPool(req: AuthRequest, res: Response): Promise<Response>;
    static updatePool(req: AuthRequest, res: Response): Promise<Response>;
    static deletePool(req: AuthRequest, res: Response): Promise<Response>;
    static getMyPools(req: AuthRequest, res: Response): Promise<Response>;
    static getUserPools(req: AuthRequest, res: Response): Promise<Response>;
}
//# sourceMappingURL=pool.controller.d.ts.map