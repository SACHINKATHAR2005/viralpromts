import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
export declare const uploadProfilePhoto: multer.Multer;
export declare const uploadPromptProof: multer.Multer;
export declare const uploadDocumentation: multer.Multer;
export declare const deleteFromCloudinary: (publicId: string) => Promise<void>;
export declare const extractPublicId: (url: string) => string;
export { cloudinary };
//# sourceMappingURL=cloudinary.d.ts.map