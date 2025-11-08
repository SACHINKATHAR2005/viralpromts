"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleMiddleware = exports.uploadDocumentationMiddleware = exports.uploadPromptProofMiddleware = exports.uploadProfilePhotoMiddleware = exports.documentationSecurityMiddleware = exports.promptProofSecurityMiddleware = exports.profilePhotoSecurityMiddleware = void 0;
const cloudinary_1 = require("../config/cloudinary");
const fileSecurity_util_1 = require("../utils/fileSecurity.util");
exports.profilePhotoSecurityMiddleware = fileSecurity_util_1.FileSecurityUtil.createSecurityMiddleware([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
]);
exports.promptProofSecurityMiddleware = fileSecurity_util_1.FileSecurityUtil.createSecurityMiddleware([
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
exports.documentationSecurityMiddleware = fileSecurity_util_1.FileSecurityUtil.createSecurityMiddleware([
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
const uploadProfilePhotoMiddleware = (req, res, next) => {
    cloudinary_1.uploadProfilePhoto.single('profilePhoto')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({
                    success: false,
                    message: 'File too large',
                    errors: ['Profile photo must be less than 5MB']
                });
                return;
            }
            if (err.message === 'Only image files are allowed!') {
                res.status(400).json({
                    success: false,
                    message: 'Invalid file type',
                    errors: ['Only image files (JPEG, PNG, WebP) are allowed for profile photos']
                });
                return;
            }
            res.status(400).json({
                success: false,
                message: 'File upload error',
                errors: [err.message || 'Unknown upload error']
            });
            return;
        }
        next();
    });
};
exports.uploadProfilePhotoMiddleware = uploadProfilePhotoMiddleware;
const uploadPromptProofMiddleware = (req, res, next) => {
    cloudinary_1.uploadPromptProof.array('proofImages', 10)(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({
                    success: false,
                    message: 'File too large',
                    errors: ['Each proof file must be less than 100MB']
                });
                return;
            }
            if (err.message && err.message.includes('Only image files')) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid file type',
                    errors: ['Only image files (JPEG, PNG, WebP) and video files (MP4, MOV, AVI, MKV, WebM) are allowed for proof files']
                });
                return;
            }
            res.status(400).json({
                success: false,
                message: 'File upload error',
                errors: [err.message || 'Unknown upload error']
            });
            return;
        }
        next();
    });
};
exports.uploadPromptProofMiddleware = uploadPromptProofMiddleware;
const uploadDocumentationMiddleware = (req, res, next) => {
    cloudinary_1.uploadDocumentation.single('documentation')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({
                    success: false,
                    message: 'File too large',
                    errors: ['Documentation file must be less than 50MB']
                });
                return;
            }
            if (err.message && err.message.includes('Only image files')) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid file type',
                    errors: ['Only image files (JPEG, PNG, WebP), PDF files, and document files (DOC, DOCX, TXT, RTF) are allowed for documentation']
                });
                return;
            }
            res.status(400).json({
                success: false,
                message: 'File upload error',
                errors: [err.message || 'Unknown upload error']
            });
            return;
        }
        next();
    });
};
exports.uploadDocumentationMiddleware = uploadDocumentationMiddleware;
const uploadMultipleMiddleware = (req, res, next) => {
    const upload = cloudinary_1.uploadPromptProof.fields([
        { name: 'proofImages', maxCount: 5 },
        { name: 'documentation', maxCount: 1 }
    ]);
    upload(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({
                    success: false,
                    message: 'File too large',
                    errors: ['Files must be within size limits']
                });
                return;
            }
            res.status(400).json({
                success: false,
                message: 'File upload error',
                errors: [err.message || 'Unknown upload error']
            });
            return;
        }
        next();
    });
};
exports.uploadMultipleMiddleware = uploadMultipleMiddleware;
//# sourceMappingURL=upload.middleware.js.map