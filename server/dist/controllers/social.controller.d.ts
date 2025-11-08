import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
export declare const likePrompt: (req: AuthRequest, res: Response) => Promise<void>;
export declare const unlikePrompt: (req: AuthRequest, res: Response) => Promise<void>;
export declare const addComment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getComments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const followUser: (req: AuthRequest, res: Response) => Promise<void>;
export declare const unfollowUser: (req: AuthRequest, res: Response) => Promise<void>;
export declare const savePrompt: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=social.controller.d.ts.map