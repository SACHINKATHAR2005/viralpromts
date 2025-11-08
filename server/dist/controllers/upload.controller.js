"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUploadedFile = exports.uploadDocumentation = exports.uploadPromptProof = exports.uploadProfilePhoto = void 0;
const User_1 = require("../models/User");
const cloudinary_1 = require("../config/cloudinary");
const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'No file uploaded',
                errors: ['Profile photo file is required']
            });
            return;
        }
        const file = req.file;
        const imageUrl = file.path;
        const user = await User_1.User.findById(req.authenticatedUser.userId);
        if (!user) {
            try {
                await (0, cloudinary_1.deleteFromCloudinary)((0, cloudinary_1.extractPublicId)(imageUrl));
            }
            catch (error) {
                console.error('Error deleting orphaned image:', error);
            }
            res.status(404).json({
                success: false,
                message: 'User not found',
                errors: ['Invalid user']
            });
            return;
        }
        if (user.profilePicture) {
            try {
                const oldPublicId = (0, cloudinary_1.extractPublicId)(user.profilePicture);
                await (0, cloudinary_1.deleteFromCloudinary)(oldPublicId);
            }
            catch (error) {
                console.error('Error deleting old profile picture:', error);
            }
        }
        user.profilePicture = imageUrl;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'Profile photo uploaded successfully',
            data: {
                profilePicture: imageUrl
            }
        });
    }
    catch (error) {
        console.error('Profile photo upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to upload profile photo']
        });
    }
};
exports.uploadProfilePhoto = uploadProfilePhoto;
const uploadPromptProof = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({
                success: false,
                message: 'No files uploaded',
                errors: ['At least one proof image is required']
            });
            return;
        }
        const files = req.files;
        const imageUrls = files.map(file => file.path);
        res.status(200).json({
            success: true,
            message: 'Proof images uploaded successfully',
            data: {
                proofImages: imageUrls
            }
        });
    }
    catch (error) {
        console.error('Prompt proof upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to upload proof images']
        });
    }
};
exports.uploadPromptProof = uploadPromptProof;
const uploadDocumentation = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'No file uploaded',
                errors: ['Documentation file is required']
            });
            return;
        }
        const file = req.file;
        const fileUrl = file.path;
        res.status(200).json({
            success: true,
            message: 'Documentation uploaded successfully',
            data: {
                documentationUrl: fileUrl,
                fileName: file.originalname,
                fileType: file.mimetype
            }
        });
    }
    catch (error) {
        console.error('Documentation upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to upload documentation']
        });
    }
};
exports.uploadDocumentation = uploadDocumentation;
const deleteUploadedFile = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const { fileUrl } = req.body;
        if (!fileUrl) {
            res.status(400).json({
                success: false,
                message: 'File URL required',
                errors: ['Please provide the file URL to delete']
            });
            return;
        }
        try {
            const publicId = (0, cloudinary_1.extractPublicId)(fileUrl);
            await (0, cloudinary_1.deleteFromCloudinary)(publicId);
            res.status(200).json({
                success: true,
                message: 'File deleted successfully'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: 'Failed to delete file',
                errors: ['File may not exist or URL is invalid']
            });
        }
    }
    catch (error) {
        console.error('File deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to delete file']
        });
    }
};
exports.deleteUploadedFile = deleteUploadedFile;
//# sourceMappingURL=upload.controller.js.map