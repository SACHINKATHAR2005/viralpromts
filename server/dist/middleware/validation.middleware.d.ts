import { Request, Response, NextFunction } from 'express';
export declare const validateRegister: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateLogin: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateProfileUpdate: (req: Request, res: Response, next: NextFunction) => void;
export declare const validatePromptCreate: (req: Request, res: Response, next: NextFunction) => void;
export declare const validatePromptUpdate: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateObjectId: (paramName?: string) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.middleware.d.ts.map