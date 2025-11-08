import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthRequest, JWTPayload } from '../types/auth.types';

// Interface for API response
interface ApiResponse {
    success: boolean;
    message: string;
    errors?: string[];
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        // Try to get token from cookie first, then from Authorization header
        let token: string | undefined;

        // Check for token in HTTP-only cookie
        if (req.cookies && req.cookies.authToken) {
            token = req.cookies.authToken;
        }
        // Fallback to Authorization header for mobile apps
        else if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
        }

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required',
                errors: ['No authentication token provided']
            } as ApiResponse);
            return;
        }

        // Get JWT secret
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET is not defined in environment variables');
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                errors: ['Server configuration error']
            } as ApiResponse);
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

        // Find user
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
                errors: ['User not found']
            } as ApiResponse);
            return;
        }

        // Check if user account is active
        if (!(user as any).isActive) {
            res.status(403).json({
                success: false,
                message: 'Account deactivated',
                errors: ['Account access denied']
            } as ApiResponse);
            return;
        }

        // Attach user to request object
        req.authenticatedUser = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role
        };
        next();

    } catch (error: any) {
        console.error('Authentication error:', error);

        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
                errors: ['Token verification failed']
            } as ApiResponse);
            return;
        }

        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Token expired',
                errors: ['Please login again']
            } as ApiResponse);
            return;
        }

        if (error.name === 'NotBeforeError') {
            res.status(401).json({
                success: false,
                message: 'Token not active',
                errors: ['Token not yet valid']
            } as ApiResponse);
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Authentication failed']
        } as ApiResponse);
    }
};

/**
 * Optional authentication middleware
 * Doesn't require authentication but sets user if token is valid
 */
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization as string;
        let token: string | undefined;

        // Try to get token from cookie first, then from Authorization header
        if (req.cookies && req.cookies.authToken) {
            token = req.cookies.authToken;
        } else if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        // If no token, continue without authentication
        if (!token) {
            next();
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            next();
            return;
        }

        // Try to verify token
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
        const user = await User.findById(decoded.userId).select('-password');

        if (user && (user as any).isActive) {
            req.authenticatedUser = {
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role
            };
        }

        next();

    } catch (error) {
        // If token verification fails, continue without authentication
        next();
    }
};

/**
 * Middleware to check if user is verified
 * Should be used after authenticate middleware
 */
export const requireVerified = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.authenticatedUser) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
            errors: ['User not authenticated']
        } as ApiResponse);
        return;
    }

    // Check if user exists by finding them in database
    const user = await User.findById(req.authenticatedUser.userId).select('-password');

    if (!user || !(user as any).isVerified) {
        res.status(403).json({
            success: false,
            message: 'Verified account required',
            errors: ['Account verification needed']
        } as ApiResponse);
        return;
    }

    next();
};

/**
 * Middleware to check if user has monetization unlocked
 * Should be used after authenticate middleware
 */
export const requireMonetization = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.authenticatedUser) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
            errors: ['User not authenticated']
        } as ApiResponse);
        return;
    }

    // Check if user exists and has monetization access
    const user = await User.findById(req.authenticatedUser.userId).select('-password');

    if (!user || !(user as any).monetizationUnlocked) {
        res.status(403).json({
            success: false,
            message: 'Monetization access required',
            errors: ['Monetization not unlocked']
        } as ApiResponse);
        return;
    }

    next();
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Try to authenticate, but don't fail if no token
        await authenticate(req, res, () => {
            // Authentication succeeded or no token present
            next();
        });
    } catch (error) {
        // If authentication fails, continue without user
        next();
    }
};