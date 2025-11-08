import { Request } from 'express';
interface SecurityScanResult {
    isSafe: boolean;
    issues: string[];
    sanitizedName?: string;
}
export declare class FileSecurityUtil {
    private static readonly DANGEROUS_EXTENSIONS;
    private static readonly DANGEROUS_MIME_TYPES;
    static scanFile(file: Express.Multer.File): SecurityScanResult;
    private static getFileExtension;
    private static hasSuspiciousFilename;
    static sanitizeFilename(originalName: string): string;
    static validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean;
    static isValidImage(file: Express.Multer.File): boolean;
    static isValidPDF(file: Express.Multer.File): boolean;
    static isValidVideo(file: Express.Multer.File): boolean;
    static isValidDocument(file: Express.Multer.File): boolean;
    static isValidProofFile(file: Express.Multer.File): boolean;
    static getFileCategory(file: Express.Multer.File): 'image' | 'video' | 'document' | 'unknown';
    static generateSecureFilename(originalName: string, prefix?: string): string;
    static createSecurityMiddleware(allowedTypes: string[]): (req: Request, res: any, next: any) => any;
}
export default FileSecurityUtil;
//# sourceMappingURL=fileSecurity.util.d.ts.map