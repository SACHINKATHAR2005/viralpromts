"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.extractPublicId = exports.deleteFromCloudinary = exports.uploadDocumentation = exports.uploadPromptProof = exports.uploadProfilePhoto = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const profilePhotoStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'viral-prompts/profile-photos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { flags: 'strip_profile' },
            { format: 'jpg' }
        ],
    },
});
const promptProofStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: (req, file) => {
        if (file.mimetype.startsWith('video/')) {
            return {
                folder: 'viral-prompts/prompt-proofs',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'webm'],
                resource_type: 'video',
                transformation: [
                    { quality: 'auto' },
                    { flags: 'strip_profile' },
                    { format: 'mp4' }
                ]
            };
        }
        else {
            return {
                folder: 'viral-prompts/prompt-proofs',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'webm'],
                resource_type: 'auto',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto' },
                    { flags: 'strip_profile' },
                    { format: 'jpg' }
                ]
            };
        }
    },
});
const documentationStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: (req, file) => {
        if (file.mimetype.startsWith('image/')) {
            return {
                folder: 'viral-prompts/documentation',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'txt', 'rtf'],
                resource_type: 'auto',
                transformation: [
                    { quality: 'auto' },
                    { flags: 'strip_profile' },
                    { format: 'jpg' }
                ]
            };
        }
        else {
            return {
                folder: 'viral-prompts/documentation',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'txt', 'rtf'],
                resource_type: 'auto'
            };
        }
    },
});
const sanitizeFilename = (originalName) => {
    const sanitized = originalName
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${randomStr}_${sanitized}`;
};
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        file.originalname = sanitizeFilename(file.originalname);
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed!'), false);
    }
};
const proofFileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        file.originalname = sanitizeFilename(file.originalname);
        cb(null, true);
    }
    else {
        cb(new Error('Only image files (JPEG, PNG, WebP) and video files (MP4, MOV, AVI, MKV, WebM) are allowed!'), false);
    }
};
const documentFileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        file.originalname = sanitizeFilename(file.originalname);
        cb(null, true);
    }
    else {
        cb(new Error('Only image files (JPEG, PNG, WebP), PDF files, and document files (DOC, DOCX, TXT, RTF) are allowed!'), false);
    }
};
exports.uploadProfilePhoto = (0, multer_1.default)({
    storage: profilePhotoStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
exports.uploadPromptProof = (0, multer_1.default)({
    storage: promptProofStorage,
    fileFilter: proofFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 10,
    },
});
exports.uploadDocumentation = (0, multer_1.default)({
    storage: documentationStorage,
    fileFilter: documentFileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 15,
    },
});
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId);
    }
    catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        throw error;
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
const extractPublicId = (url) => {
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) {
        throw new Error('Invalid Cloudinary URL');
    }
    let pathAfterUpload = parts.slice(uploadIndex + 1);
    if (pathAfterUpload[0] && /^v\d+$/.test(pathAfterUpload[0])) {
        pathAfterUpload = pathAfterUpload.slice(1);
    }
    const publicIdWithExtension = pathAfterUpload.join('/');
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    return lastDotIndex !== -1
        ? publicIdWithExtension.substring(0, lastDotIndex)
        : publicIdWithExtension;
};
exports.extractPublicId = extractPublicId;
//# sourceMappingURL=cloudinary.js.map