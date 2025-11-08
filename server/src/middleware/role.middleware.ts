import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';

// Middleware to check if user has required role
export const requireRole = (roles: string | string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        try {
            // Check if user is authenticated
            if (!req.authenticatedUser) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }

            // Convert single role to array for easier checking
            const allowedRoles = Array.isArray(roles) ? roles : [roles];

            // Check if user has required role
            if (!allowedRoles.includes(req.authenticatedUser.role)) {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions. This action requires higher privileges.'
                });
                return;
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error during role verification'
            });
        }
    };
};

// Middleware specifically for admin-only routes
export const requireAdmin = requireRole('admin');

// Middleware for routes that require user or admin role
export const requireUser = requireRole(['user', 'admin']);