import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { User } from '../models/User';
import { deleteFromCloudinary, extractPublicId } from '../config/cloudinary';

// Interface for API response
interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
}

// Interface for uploaded file with Cloudinary data
interface CloudinaryFile extends Express.Multer.File {
    path: string;
    filename: string;
}

/**
 * Upload profile photo
 * POST /api/upload/profile-photo
 */
export const uploadProfilePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'No file uploaded',
                errors: ['Profile photo file is required']
            } as ApiResponse);
            return;
        }

        const file = req.file as CloudinaryFile;
        const imageUrl = file.path;

        // Update user's profile photo
        const user = await User.findById(req.authenticatedUser.userId);
        if (!user) {
            // Delete uploaded file if user not found
            try {
                await deleteFromCloudinary(extractPublicId(imageUrl));
            } catch (error) {
                console.error('Error deleting orphaned image:', error);
            }

            res.status(404).json({
                success: false,
                message: 'User not found',
                errors: ['Invalid user']
            } as ApiResponse);
            return;
        }

        // Delete old profile picture if exists
        if (user.profilePicture) {
            try {
                const oldPublicId = extractPublicId(user.profilePicture);
                await deleteFromCloudinary(oldPublicId);
            } catch (error) {
                console.error('Error deleting old profile picture:', error);
                // Continue even if deletion fails
            }
        }

        // Update user with new profile picture URL
        user.profilePicture = imageUrl;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile photo uploaded successfully',
            data: {
                profilePicture: imageUrl
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Profile photo upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to upload profile photo']
        } as ApiResponse);
    }
};

/**
 * Upload prompt proof images
 * POST /api/upload/prompt-proof
 */
export const uploadPromptProof = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({
                success: false,
                message: 'No files uploaded',
                errors: ['At least one proof image is required']
            } as ApiResponse);
            return;
        }

        const files = req.files as CloudinaryFile[];
        const imageUrls = files.map(file => file.path);

        res.status(200).json({
            success: true,
            message: 'Proof images uploaded successfully',
            data: {
                proofImages: imageUrls
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Prompt proof upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to upload proof images']
        } as ApiResponse);
    }
};

/**
 * Upload documentation file
 * POST /api/upload/documentation
 */
export const uploadDocumentation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'No file uploaded',
                errors: ['Documentation file is required']
            } as ApiResponse);
            return;
        }

        const file = req.file as CloudinaryFile;
        const fileUrl = file.path;

        res.status(200).json({
            success: true,
            message: 'Documentation uploaded successfully',
            data: {
                documentationUrl: fileUrl,
                fileName: file.originalname,
                fileType: file.mimetype
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Documentation upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to upload documentation']
        } as ApiResponse);
    }
};

/**
 * Delete uploaded file
 * DELETE /api/upload/delete
 */
export const deleteUploadedFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        const { fileUrl } = req.body;

        if (!fileUrl) {
            res.status(400).json({
                success: false,
                message: 'File URL required',
                errors: ['Please provide the file URL to delete']
            } as ApiResponse);
            return;
        }

        try {
            const publicId = extractPublicId(fileUrl);
            await deleteFromCloudinary(publicId);

            res.status(200).json({
                success: true,
                message: 'File deleted successfully'
            } as ApiResponse);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Failed to delete file',
                errors: ['File may not exist or URL is invalid']
            } as ApiResponse);
        }

    } catch (error: any) {
        console.error('File deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to delete file']
        } as ApiResponse);
    }
};