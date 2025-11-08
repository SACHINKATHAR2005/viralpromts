import { Request, Response } from 'express';
import { User } from '../models/User';
import { IUser } from '../types/user.types';
import { AuthRequest } from '../types/auth.types';

// Helper function for cookie options
const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
});

// Extend Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

// Interface for registration request body
interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
    bio?: string;
    website?: string;
}

// Interface for login request body
interface LoginRequest {
    email: string;
    password: string;
}

// Interface for API response
interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
}

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password, role, bio, website }: RegisterRequest = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            res.status(400).json({
                success: false,
                message: 'Username, email, and password are required',
                errors: ['Missing required fields']
            } as ApiResponse);
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser) {
            const field = (existingUser as any).email === email.toLowerCase() ? 'email' : 'username';
            res.status(409).json({
                success: false,
                message: `User with this ${field} already exists`,
                errors: [`${field} already taken`]
            } as ApiResponse);
            return;
        }

        // Create new user
        const userData = {
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: role || 'user', // Default to 'user' if not specified
            ...(bio && { bio: bio.trim() }),
            ...(website && { website: website.trim() })
        };

        const user = new User(userData);
        await user.save();

        // Generate JWT token
        const token = (user as any).generateAuthToken();

        // Update last login
        (user as any).lastLoginAt = new Date();
        await user.save();

        // Set HTTP-only cookie
        res.cookie('authToken', token, getCookieOptions());

        // Remove password from response
        const userResponse = user.toJSON();
        delete (userResponse as any).password;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userResponse,
                token // Still provide token for mobile apps that can't use cookies
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Registration error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            } as ApiResponse);
            return;
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            res.status(409).json({
                success: false,
                message: `User with this ${field} already exists`,
                errors: [`${field} already taken`]
            } as ApiResponse);
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Registration failed']
        } as ApiResponse);
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password }: LoginRequest = req.body;

        // Validate required fields
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required',
                errors: ['Missing required fields']
            } as ApiResponse);
            return;
        }

        // Find user and include password for comparison
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select('+password');

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                errors: ['Authentication failed']
            } as ApiResponse);
            return;
        }

        // Check if account is active
        if (!(user as any).isActive) {
            res.status(403).json({
                success: false,
                message: 'Account is deactivated',
                errors: ['Account access denied']
            } as ApiResponse);
            return;
        }

        // Compare password
        const isPasswordValid = await (user as any).comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                errors: ['Authentication failed']
            } as ApiResponse);
            return;
        }

        // Generate JWT token
        const token = (user as any).generateAuthToken();

        // Update last login
        (user as any).lastLoginAt = new Date();
        await user.save();

        // Set HTTP-only cookie
        res.cookie('authToken', token, getCookieOptions());

        // Remove password from response
        const userResponse = user.toJSON();
        delete (userResponse as any).password;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token // Still provide token for mobile apps that can't use cookies
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Login failed']
        } as ApiResponse);
    }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated',
                errors: ['Authentication required']
            } as ApiResponse);
            return;
        }

        // Get fresh user data from database
        const user = await User.findById(req.authenticatedUser.userId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
                errors: ['User does not exist']
            } as ApiResponse);
            return;
        }

        // Remove password from response
        const userResponse = user.toJSON();
        delete (userResponse as any).password;

        res.status(200).json({
            success: true,
            message: 'User profile retrieved successfully',
            data: {
                user: userResponse
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve profile']
        } as ApiResponse);
    }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated',
                errors: ['Authentication required']
            } as ApiResponse);
            return;
        }

        const { bio, website, username } = req.body;
        const updateData: any = {};

        // Only update provided fields
        if (bio !== undefined) updateData.bio = bio.trim();
        if (website !== undefined) updateData.website = website.trim();
        if (username !== undefined) updateData.username = username.trim();

        // Check if username is already taken (if being updated)
        if (username && username !== req.authenticatedUser.username) {
            const existingUser = await User.findOne({
                username: username.toLowerCase(),
                _id: { $ne: req.authenticatedUser.userId }
            });

            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'Username already taken',
                    errors: ['Username not available']
                } as ApiResponse);
                return;
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.authenticatedUser.userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: 'User not found',
                errors: ['User does not exist']
            } as ApiResponse);
            return;
        }

        // Remove password from response
        const userResponse = updatedUser.toJSON();
        delete (userResponse as any).password;

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: userResponse
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Update profile error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            } as ApiResponse);
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Profile update failed']
        } as ApiResponse);
    }
};

/**
 * Logout user (clears HTTP-only cookie)
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
    // Clear the HTTP-only cookie
    res.clearCookie('authToken', getCookieOptions());

    res.status(200).json({
        success: true,
        message: 'Logout successful',
        data: {
            message: 'Authentication cookie has been cleared'
        }
    } as ApiResponse);
};