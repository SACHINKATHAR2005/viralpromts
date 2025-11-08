import { Request, Response, NextFunction } from 'express';

// Interface for API response
interface ApiResponse {
    success: boolean;
    message: string;
    errors?: string[];
}

// Validation helper functions
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};

const isValidUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username) && username.length >= 3 && username.length <= 30;
};

const isValidPassword = (password: string): boolean => {
    return password.length >= 6;
};

const isValidUrl = (url: string): boolean => {
    const urlRegex = /^https?:\/\/.+/;
    return urlRegex.test(url);
};

/**
 * Validate registration request
 */
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
    const { username, email, password, bio, website } = req.body;
    const errors: string[] = [];

    // Required fields validation
    if (!username) {
        errors.push('Username is required');
    } else if (!isValidUsername(username)) {
        errors.push('Username must be 3-30 characters long and contain only letters, numbers, and underscores');
    }

    if (!email) {
        errors.push('Email is required');
    } else if (!isValidEmail(email)) {
        errors.push('Please enter a valid email address');
    }

    if (!password) {
        errors.push('Password is required');
    } else if (!isValidPassword(password)) {
        errors.push('Password must be at least 6 characters long');
    }

    // Optional fields validation
    if (bio && bio.length > 500) {
        errors.push('Bio cannot exceed 500 characters');
    }

    if (website && !isValidUrl(website)) {
        errors.push('Please enter a valid URL for website (must start with http:// or https://)');
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        } as ApiResponse);
        return;
    }

    next();
};

/**
 * Validate login request
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
    const { email, password } = req.body;
    const errors: string[] = [];

    // Required fields validation
    if (!email) {
        errors.push('Email is required');
    } else if (!isValidEmail(email)) {
        errors.push('Please enter a valid email address');
    }

    if (!password) {
        errors.push('Password is required');
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        } as ApiResponse);
        return;
    }

    next();
};

/**
 * Validate profile update request
 */
export const validateProfileUpdate = (req: Request, res: Response, next: NextFunction): void => {
    const { username, bio, website } = req.body;
    const errors: string[] = [];

    // Optional fields validation
    if (username !== undefined) {
        if (!username || !isValidUsername(username)) {
            errors.push('Username must be 3-30 characters long and contain only letters, numbers, and underscores');
        }
    }

    if (bio !== undefined && bio.length > 500) {
        errors.push('Bio cannot exceed 500 characters');
    }

    if (website !== undefined && website && !isValidUrl(website)) {
        errors.push('Please enter a valid URL for website (must start with http:// or https://)');
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        } as ApiResponse);
        return;
    }

    next();
};

/**
 * Validate prompt creation request
 */
export const validatePromptCreate = (req: Request, res: Response, next: NextFunction): void => {
    const { title, promptText, category, tags, price } = req.body;
    const errors: string[] = [];

    // Required fields validation
    if (!title) {
        errors.push('Title is required');
    } else if (title.length < 3 || title.length > 200) {
        errors.push('Title must be between 3 and 200 characters');
    }

    if (!promptText) {
        errors.push('Prompt text is required');
    } else if (promptText.length < 10) {
        errors.push('Prompt text must be at least 10 characters long');
    }

    if (!category) {
        errors.push('Category is required');
    }

    // Optional fields validation
    if (tags) {
        if (!Array.isArray(tags)) {
            errors.push('Tags must be an array');
        } else if (tags.length > 10) {
            errors.push('Maximum 10 tags allowed');
        } else {
            // Validate each tag
            tags.forEach((tag, index) => {
                if (typeof tag !== 'string' || tag.length < 2 || tag.length > 30) {
                    errors.push(`Tag ${index + 1} must be between 2 and 30 characters`);
                }
            });
        }
    }

    if (price !== undefined) {
        if (typeof price !== 'number' || price < 0) {
            errors.push('Price must be a positive number');
        }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        } as ApiResponse);
        return;
    }

    next();
};

/**
 * Validate prompt update request
 */
export const validatePromptUpdate = (req: Request, res: Response, next: NextFunction): void => {
    const { title, promptText, category, tags, price, isPublic } = req.body;
    const errors: string[] = [];

    // Optional fields validation (all fields are optional for updates)
    if (title !== undefined) {
        if (!title || title.length < 3 || title.length > 200) {
            errors.push('Title must be between 3 and 200 characters');
        }
    }

    if (promptText !== undefined) {
        if (!promptText || promptText.length < 10) {
            errors.push('Prompt text must be at least 10 characters long');
        }
    }

    if (category !== undefined && !category) {
        errors.push('Category cannot be empty');
    }

    if (tags !== undefined) {
        if (!Array.isArray(tags)) {
            errors.push('Tags must be an array');
        } else if (tags.length > 10) {
            errors.push('Maximum 10 tags allowed');
        } else {
            // Validate each tag
            tags.forEach((tag, index) => {
                if (typeof tag !== 'string' || tag.length < 2 || tag.length > 30) {
                    errors.push(`Tag ${index + 1} must be between 2 and 30 characters`);
                }
            });
        }
    }

    if (price !== undefined) {
        if (typeof price !== 'number' || price < 0) {
            errors.push('Price must be a positive number');
        }
    }

    if (isPublic !== undefined) {
        if (typeof isPublic !== 'boolean') {
            errors.push('isPublic must be a boolean value');
        }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        } as ApiResponse);
        return;
    }

    next();
};

/**
 * Generic validation for ObjectId parameters
 */
export const validateObjectId = (paramName: string = 'id') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const id = req.params[paramName];

        if (!id) {
            res.status(400).json({
                success: false,
                message: `${paramName} is required`,
                errors: [`Missing ${paramName} parameter`]
            } as ApiResponse);
            return;
        }

        // Basic ObjectId format validation (24 hex characters)
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(id)) {
            res.status(400).json({
                success: false,
                message: `Invalid ${paramName} format`,
                errors: [`${paramName} must be a valid ObjectId`]
            } as ApiResponse);
            return;
        }

        next();
    };
};