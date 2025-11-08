import { Request } from 'express';

// Interface for security scan results
interface SecurityScanResult {
    isSafe: boolean;
    issues: string[];
    sanitizedName?: string;
}

/**
 * Comprehensive file security utility
 */
export class FileSecurityUtil {

    // Dangerous file extensions that should never be uploaded
    private static readonly DANGEROUS_EXTENSIONS = [
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
        '.app', '.deb', '.pkg', '.dmg', '.iso', '.msi', '.run', '.sh', '.php',
        '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py', '.rb', '.sql'
    ];

    // Dangerous MIME types
    private static readonly DANGEROUS_MIME_TYPES = [
        'application/x-executable',
        'application/x-msdownload',
        'application/x-msdos-program',
        'application/x-msi',
        'application/x-bat',
        'application/x-sh',
        'application/javascript',
        'text/javascript',
        'application/x-php',
        'text/x-php'
    ];

    /**
     * Scan file for security issues
     */
    static scanFile(file: Express.Multer.File): SecurityScanResult {
        const issues: string[] = [];
        let isSafe = true;

        // Check file extension
        const extension = this.getFileExtension(file.originalname);
        if (this.DANGEROUS_EXTENSIONS.includes(extension.toLowerCase())) {
            issues.push(`Dangerous file extension: ${extension}`);
            isSafe = false;
        }

        // Check MIME type
        if (this.DANGEROUS_MIME_TYPES.includes(file.mimetype)) {
            issues.push(`Dangerous MIME type: ${file.mimetype}`);
            isSafe = false;
        }

        // Check file size (basic protection against zip bombs)
        if (file.size > 100 * 1024 * 1024) { // 100MB
            issues.push('File size too large (potential zip bomb)');
            isSafe = false;
        }

        // Check filename for suspicious patterns
        if (this.hasSuspiciousFilename(file.originalname)) {
            issues.push('Suspicious filename pattern detected');
            isSafe = false;
        }

        return {
            isSafe,
            issues,
            sanitizedName: this.sanitizeFilename(file.originalname)
        };
    }

    /**
     * Get file extension from filename
     */
    private static getFileExtension(filename: string): string {
        const lastDot = filename.lastIndexOf('.');
        return lastDot > -1 ? filename.substring(lastDot) : '';
    }

    /**
     * Check if filename contains suspicious patterns
     */
    private static hasSuspiciousFilename(filename: string): boolean {
        const suspiciousPatterns = [
            /\.\./,  // Directory traversal
            /[<>:"|?*]/,  // Invalid characters
            /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Windows reserved names
            /^\./,  // Hidden files
            /\.{2,}/,  // Multiple dots
            /__/,  // Double underscores (potential encoding)
            /%/,  // URL encoding
            /\\/,  // Backslashes
        ];

        return suspiciousPatterns.some(pattern => pattern.test(filename));
    }

    /**
     * Sanitize filename by removing metadata and dangerous characters
     */
    static sanitizeFilename(originalName: string): string {
        // Remove any potentially dangerous characters and metadata info
        let sanitized = originalName
            .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
            .replace(/_{2,}/g, '_') // Replace multiple underscores with single
            .replace(/^[._]+|[._]+$/g, '') // Remove leading/trailing dots and underscores
            .toLowerCase();

        // Ensure the filename isn't empty after sanitization
        if (!sanitized || sanitized.length === 0) {
            sanitized = 'sanitized_file';
        }

        // Generate a timestamp prefix to ensure uniqueness and remove metadata
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);

        // Extract extension
        const extension = this.getFileExtension(sanitized);
        const nameWithoutExt = sanitized.replace(extension, '');

        return `${timestamp}_${randomStr}_${nameWithoutExt}${extension}`;
    }

    /**
     * Validate file type against allowed types
     */
    static validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
        return allowedTypes.includes(file.mimetype);
    }

    /**
     * Check if file appears to be a valid image
     */
    static isValidImage(file: Express.Multer.File): boolean {
        const validImageMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif'
        ];

        return validImageMimes.includes(file.mimetype) &&
            file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i) !== null;
    }

    /**
     * Check if file appears to be a valid PDF
     */
    static isValidPDF(file: Express.Multer.File): boolean {
        return file.mimetype === 'application/pdf' &&
            file.originalname.toLowerCase().endsWith('.pdf');
    }

    /**
     * Check if file appears to be a valid video
     */
    static isValidVideo(file: Express.Multer.File): boolean {
        const validVideoMimes = [
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-matroska',
            'video/webm'
        ];

        const validVideoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
        const extension = this.getFileExtension(file.originalname).toLowerCase();

        return validVideoMimes.includes(file.mimetype) &&
            validVideoExtensions.includes(extension);
    }

    /**
     * Check if file appears to be a valid document
     */
    static isValidDocument(file: Express.Multer.File): boolean {
        const validDocumentMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/rtf'
        ];

        const validDocumentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
        const extension = this.getFileExtension(file.originalname).toLowerCase();

        return validDocumentMimes.includes(file.mimetype) &&
            validDocumentExtensions.includes(extension);
    }

    /**
     * Check if file appears to be a valid proof file (image or video)
     */
    static isValidProofFile(file: Express.Multer.File): boolean {
        return this.isValidImage(file) || this.isValidVideo(file);
    }

    /**
     * Get file type category
     */
    static getFileCategory(file: Express.Multer.File): 'image' | 'video' | 'document' | 'unknown' {
        if (this.isValidImage(file)) return 'image';
        if (this.isValidVideo(file)) return 'video';
        if (this.isValidDocument(file)) return 'document';
        return 'unknown';
    }

    /**
     * Generate secure filename with metadata removal
     */
    static generateSecureFilename(originalName: string, prefix?: string): string {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 12);
        const extension = this.getFileExtension(originalName);

        const basePrefix = prefix || 'secure';
        return `${basePrefix}_${timestamp}_${randomStr}${extension}`;
    }

    /**
     * Create a middleware for additional file security checks
     */
    static createSecurityMiddleware(allowedTypes: string[]) {
        return (req: Request, res: any, next: any) => {
            if (req.file) {
                const scanResult = this.scanFile(req.file);
                if (!scanResult.isSafe) {
                    return res.status(400).json({
                        success: false,
                        message: 'File security check failed',
                        errors: scanResult.issues
                    });
                }

                if (!this.validateFileType(req.file, allowedTypes)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid file type',
                        errors: ['File type not allowed']
                    });
                }

                // Update filename with sanitized version
                if (scanResult.sanitizedName) {
                    req.file.originalname = scanResult.sanitizedName;
                }
            }

            if (req.files && Array.isArray(req.files)) {
                for (const file of req.files) {
                    const scanResult = this.scanFile(file);
                    if (!scanResult.isSafe) {
                        return res.status(400).json({
                            success: false,
                            message: 'File security check failed',
                            errors: scanResult.issues
                        });
                    }

                    if (!this.validateFileType(file, allowedTypes)) {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid file type',
                            errors: ['One or more files have invalid type']
                        });
                    }

                    // Update filename with sanitized version
                    if (scanResult.sanitizedName) {
                        file.originalname = scanResult.sanitizedName;
                    }
                }
            }

            next();
        };
    }
}

export default FileSecurityUtil;