import { Request, Response, NextFunction } from 'express';
import { uploadProfilePhoto, uploadPromptProof, uploadDocumentation } from '../config/cloudinary';
import { FileSecurityUtil } from '../utils/fileSecurity.util';

// Interface for API response
interface ApiResponse {
    success: boolean;
    message: string;
    errors?: string[];
}

// Security middleware for profile photos
export const profilePhotoSecurityMiddleware = FileSecurityUtil.createSecurityMiddleware([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
]);

// Security middleware for prompt proof images and videos  
export const promptProofSecurityMiddleware = FileSecurityUtil.createSecurityMiddleware([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm'
]);

// Security middleware for documentation files
export const documentationSecurityMiddleware = FileSecurityUtil.createSecurityMiddleware([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf'
]);

// Interface for API response  
interface ApiResponse {
    success: boolean;
    message: string;
    errors?: string[];
}

// Middleware wrapper for profile photo upload
export const uploadProfilePhotoMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    uploadProfilePhoto.single('profilePhoto')(req, res, (err: any) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({
                    success: false,
                    message: 'File too large',
                    errors: ['Profile photo must be less than 5MB']
                } as ApiResponse);
                return;
            }

            if (err.message === 'Only image files are allowed!') {
                res.status(400).json({
                    success: false,
                    message: 'Invalid file type',
                    errors: ['Only image files (JPEG, PNG, WebP) are allowed for profile photos']
                } as ApiResponse);
                return;
            }

            res.status(400).json({
                success: false,
                message: 'File upload error',
                errors: [err.message || 'Unknown upload error']
            } as ApiResponse);
            return;
        }
        next();
    });
};

// Middleware wrapper for prompt proof images and videos upload (multiple files)
export const uploadPromptProofMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    uploadPromptProof.array('proofImages', 10)(req, res, (err: any) => { // Max 10 proof files
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({
                    success: false,
                    message: 'File too large',
                    errors: ['Each proof file must be less than 100MB']
                } as ApiResponse);
                return;
            }

            if (err.message && err.message.includes('Only image files')) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid file type',
                    errors: ['Only image files (JPEG, PNG, WebP) and video files (MP4, MOV, AVI, MKV, WebM) are allowed for proof files']
                } as ApiResponse);
                return;
            }

            res.status(400).json({
                success: false,
                message: 'File upload error',
                errors: [err.message || 'Unknown upload error']
            } as ApiResponse);
            return;
        }
        next();
    });
};

// Middleware wrapper for documentation upload
export const uploadDocumentationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    uploadDocumentation.single('documentation')(req, res, (err: any) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({
                    success: false,
                    message: 'File too large',
                    errors: ['Documentation file must be less than 50MB']
                } as ApiResponse);
                return;
            }

            if (err.message && err.message.includes('Only image files')) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid file type',
                    errors: ['Only image files (JPEG, PNG, WebP), PDF files, and document files (DOC, DOCX, TXT, RTF) are allowed for documentation']
                } as ApiResponse);
                return;
            }

            res.status(400).json({
                success: false,
                message: 'File upload error',
                errors: [err.message || 'Unknown upload error']
            } as ApiResponse);
            return;
        }
        next();
    });
};

// Optional middleware for handling multiple file types in one request
export const uploadMultipleMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const upload = uploadPromptProof.fields([
        { name: 'proofImages', maxCount: 5 },
        { name: 'documentation', maxCount: 1 }
    ]);

    upload(req, res, (err: any) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({
                    success: false,
                    message: 'File too large',
                    errors: ['Files must be within size limits']
                } as ApiResponse);
                return;
            }

            res.status(400).json({
                success: false,
                message: 'File upload error',
                errors: [err.message || 'Unknown upload error']
            } as ApiResponse);
            return;
        }
        next();
    });
};