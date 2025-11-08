import { Router, Express } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    uploadProfilePhotoMiddleware,
    uploadPromptProofMiddleware,
    uploadDocumentationMiddleware,
    profilePhotoSecurityMiddleware,
    promptProofSecurityMiddleware,
    documentationSecurityMiddleware
} from '../middleware/upload.middleware';
import {
    uploadProfilePhoto,
    uploadPromptProof,
    uploadDocumentation,
    deleteUploadedFile
} from '../controllers/upload.controller';

const router: Router = Router();

/**
 * @route   POST /api/upload/profile-photo
 * @desc    Upload user profile photo
 * @access  Private
 */
router.post(
    '/profile-photo',
    authenticate,
    uploadProfilePhotoMiddleware,
    profilePhotoSecurityMiddleware,
    uploadProfilePhoto
);

/**
 * @route   POST /api/upload/prompt-proof
 * @desc    Upload prompt proof images (multiple files)
 * @access  Private
 */
router.post(
    '/prompt-proof',
    authenticate,
    uploadPromptProofMiddleware,
    promptProofSecurityMiddleware,
    uploadPromptProof
);

/**
 * @route   POST /api/upload/documentation
 * @desc    Upload documentation file
 * @access  Private
 */
router.post(
    '/documentation',
    authenticate,
    uploadDocumentationMiddleware,
    documentationSecurityMiddleware,
    uploadDocumentation
);

/**
 * @route   DELETE /api/upload/delete
 * @desc    Delete uploaded file from Cloudinary
 * @access  Private
 */
router.delete(
    '/delete',
    authenticate,
    deleteUploadedFile
);

export default router;