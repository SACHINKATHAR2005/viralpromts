import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

//CLOUDINARY_CLOUD_NAME
//CLOUDINARY_API_KEY
//CLOUDINARY_API_SECRET

// Storage configuration for profile photos
const profilePhotoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'viral-prompts/profile-photos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { flags: 'strip_profile' }, // Remove EXIF and other metadata
            { format: 'jpg' } // Convert to JPG to ensure metadata removal
        ],
    } as any,
});

// Storage configuration for prompt proof images and videos
const promptProofStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req: any, file: Express.Multer.File) => {
        // For video files
        if (file.mimetype.startsWith('video/')) {
            return {
                folder: 'viral-prompts/prompt-proofs',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'webm'],
                resource_type: 'video',
                transformation: [
                    { quality: 'auto' },
                    { flags: 'strip_profile' }, // Remove metadata
                    { format: 'mp4' } // Convert to MP4 for compatibility
                ]
            };
        } else {
            // For image files
            return {
                folder: 'viral-prompts/prompt-proofs',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'webm'],
                resource_type: 'auto',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto' },
                    { flags: 'strip_profile' }, // Remove EXIF and other metadata
                    { format: 'jpg' } // Convert to JPG to ensure metadata removal
                ]
            };
        }
    },
} as any);

// Storage configuration for documentation files
const documentationStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req: any, file: Express.Multer.File) => {
        // For image files, apply metadata removal transformations
        if (file.mimetype.startsWith('image/')) {
            return {
                folder: 'viral-prompts/documentation',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'txt', 'rtf'],
                resource_type: 'auto',
                transformation: [
                    { quality: 'auto' },
                    { flags: 'strip_profile' }, // Remove EXIF and other metadata
                    { format: 'jpg' } // Convert images to JPG
                ]
            };
        } else {
            // For PDF and document files, just store without transformations
            return {
                folder: 'viral-prompts/documentation',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'txt', 'rtf'],
                resource_type: 'auto'
            };
        }
    },
} as any);

// Utility function to sanitize filename and remove metadata
const sanitizeFilename = (originalName: string): string => {
    // Remove any potentially dangerous characters and metadata info
    const sanitized = originalName
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .toLowerCase();

    // Generate a timestamp prefix to ensure uniqueness
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);

    return `${timestamp}_${randomStr}_${sanitized}`;
};

// File filter function for images only
const imageFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        // Sanitize the filename
        file.originalname = sanitizeFilename(file.originalname);
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// File filter function for images and videos (prompt proofs)
const proofFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedMimes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        // Videos
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        // Sanitize the filename
        file.originalname = sanitizeFilename(file.originalname);
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, WebP) and video files (MP4, MOV, AVI, MKV, WebM) are allowed!'), false);
    }
};

// File filter function for documentation (images, PDFs, and documents)
const documentFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedMimes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        // Sanitize the filename
        file.originalname = sanitizeFilename(file.originalname);
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, WebP), PDF files, and document files (DOC, DOCX, TXT, RTF) are allowed!'), false);
    }
};

// Multer configurations
export const uploadProfilePhoto = multer({
    storage: profilePhotoStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

export const uploadPromptProof = multer({
    storage: promptProofStorage,
    fileFilter: proofFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit for videos
        files: 10, // Maximum 10 proof files
    },
});

export const uploadDocumentation = multer({
    storage: documentationStorage,
    fileFilter: documentFileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for documents
        files: 15, // Maximum 15 documentation files
    },
});

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        throw error;
    }
};

// Helper function to extract public ID from Cloudinary URL
export const extractPublicId = (url: string): string => {
    // Handle different Cloudinary URL formats
    // Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
    const parts = url.split('/');

    // Find the index of 'upload'
    const uploadIndex = parts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) {
        throw new Error('Invalid Cloudinary URL');
    }

    // Get everything after 'upload' and version (if present)
    let pathAfterUpload = parts.slice(uploadIndex + 1);

    // Remove version if present (starts with 'v' followed by numbers)
    if (pathAfterUpload[0] && /^v\d+$/.test(pathAfterUpload[0])) {
        pathAfterUpload = pathAfterUpload.slice(1);
    }

    // Join the remaining parts and remove file extension
    const publicIdWithExtension = pathAfterUpload.join('/');
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');

    return lastDotIndex !== -1
        ? publicIdWithExtension.substring(0, lastDotIndex)
        : publicIdWithExtension;
};

export { cloudinary };