import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth.types';
export declare const createPrompt: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPrompts: (req: Request, res: Response) => Promise<void>;
export declare const getPromptById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePrompt: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deletePrompt: (req: AuthRequest, res: Response) => Promise<void>;
export declare const copyPrompt: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMyPrompts: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=prompt.controller.d.ts.map