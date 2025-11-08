import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
export declare const ratePrompt: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateRating: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPromptRatings: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteRating: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markReviewHelpful: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=rating.controller.d.ts.map