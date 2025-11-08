"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSecurityUtil = void 0;
class FileSecurityUtil {
    static scanFile(file) {
        const issues = [];
        let isSafe = true;
        const extension = this.getFileExtension(file.originalname);
        if (this.DANGEROUS_EXTENSIONS.includes(extension.toLowerCase())) {
            issues.push(`Dangerous file extension: ${extension}`);
            isSafe = false;
        }
        if (this.DANGEROUS_MIME_TYPES.includes(file.mimetype)) {
            issues.push(`Dangerous MIME type: ${file.mimetype}`);
            isSafe = false;
        }
        if (file.size > 100 * 1024 * 1024) {
            issues.push('File size too large (potential zip bomb)');
            isSafe = false;
        }
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
    static getFileExtension(filename) {
        const lastDot = filename.lastIndexOf('.');
        return lastDot > -1 ? filename.substring(lastDot) : '';
    }
    static hasSuspiciousFilename(filename) {
        const suspiciousPatterns = [
            /\.\./,
            /[<>:"|?*]/,
            /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,
            /^\./,
            /\.{2,}/,
            /__/,
            /%/,
            /\\/,
        ];
        return suspiciousPatterns.some(pattern => pattern.test(filename));
    }
    static sanitizeFilename(originalName) {
        let sanitized = originalName
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^[._]+|[._]+$/g, '')
            .toLowerCase();
        if (!sanitized || sanitized.length === 0) {
            sanitized = 'sanitized_file';
        }
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = this.getFileExtension(sanitized);
        const nameWithoutExt = sanitized.replace(extension, '');
        return `${timestamp}_${randomStr}_${nameWithoutExt}${extension}`;
    }
    static validateFileType(file, allowedTypes) {
        return allowedTypes.includes(file.mimetype);
    }
    static isValidImage(file) {
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
    static isValidPDF(file) {
        return file.mimetype === 'application/pdf' &&
            file.originalname.toLowerCase().endsWith('.pdf');
    }
    static isValidVideo(file) {
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
    static isValidDocument(file) {
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
    static isValidProofFile(file) {
        return this.isValidImage(file) || this.isValidVideo(file);
    }
    static getFileCategory(file) {
        if (this.isValidImage(file))
            return 'image';
        if (this.isValidVideo(file))
            return 'video';
        if (this.isValidDocument(file))
            return 'document';
        return 'unknown';
    }
    static generateSecureFilename(originalName, prefix) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 12);
        const extension = this.getFileExtension(originalName);
        const basePrefix = prefix || 'secure';
        return `${basePrefix}_${timestamp}_${randomStr}${extension}`;
    }
    static createSecurityMiddleware(allowedTypes) {
        return (req, res, next) => {
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
                    if (scanResult.sanitizedName) {
                        file.originalname = scanResult.sanitizedName;
                    }
                }
            }
            next();
        };
    }
}
exports.FileSecurityUtil = FileSecurityUtil;
FileSecurityUtil.DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.app', '.deb', '.pkg', '.dmg', '.iso', '.msi', '.run', '.sh', '.php',
    '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py', '.rb', '.sql'
];
FileSecurityUtil.DANGEROUS_MIME_TYPES = [
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
exports.default = FileSecurityUtil;
//# sourceMappingURL=fileSecurity.util.js.map