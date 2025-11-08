import { Request, Response, NextFunction } from 'express';
export declare const profilePhotoSecurityMiddleware: (req: Request, res: any, next: any) => any;
export declare const promptProofSecurityMiddleware: (req: Request, res: any, next: any) => any;
export declare const documentationSecurityMiddleware: (req: Request, res: any, next: any) => any;
export declare const uploadProfilePhotoMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const uploadPromptProofMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const uploadDocumentationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const uploadMultipleMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=upload.middleware.d.ts.map