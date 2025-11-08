import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
export declare class CommunityCallController {
    static createCall(req: AuthRequest, res: Response): Promise<Response>;
    static getCalls(req: AuthRequest, res: Response): Promise<Response>;
    static getCall(req: AuthRequest, res: Response): Promise<Response>;
    static registerForCall(req: AuthRequest, res: Response): Promise<Response>;
    static unregisterFromCall(req: AuthRequest, res: Response): Promise<Response>;
    static markAttendance(req: AuthRequest, res: Response): Promise<Response>;
    static addFeedback(req: AuthRequest, res: Response): Promise<Response>;
    static updateCall(req: AuthRequest, res: Response): Promise<Response>;
    static cancelCall(req: AuthRequest, res: Response): Promise<Response>;
    static getUserCalls(req: AuthRequest, res: Response): Promise<Response>;
    static startCall(req: AuthRequest, res: Response): Promise<Response>;
    static endCall(req: AuthRequest, res: Response): Promise<Response>;
}
//# sourceMappingURL=communityCall.controller.d.ts.map