import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
export declare const uploadProfilePhoto: (req: AuthRequest, res: Response) => Promise<void>;
export declare const uploadPromptProof: (req: AuthRequest, res: Response) => Promise<void>;
export declare const uploadDocumentation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteUploadedFile: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=upload.controller.d.ts.map