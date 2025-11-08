import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Prompt } from '../models/Prompt';
import { User } from '../models/User';
import { IPrompt } from '../types/prompt.types';
import { AuthRequest } from '../types/auth.types';

// Interface for API response
interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
}

// Interface for prompt creation request
interface CreatePromptRequest {
    title: string;
    description: string;
    promptText: string;
    proofImages?: string[];
    proofType: 'image' | 'video' | 'audio' | 'text';
    category: string;
    tags?: string[];
    isPaid?: boolean;
    price?: number;
    privacy?: 'public' | 'private' | 'followers';
    aiPlatform?: string[];
}

// Interface for prompt update request
interface UpdatePromptRequest {
    title?: string;
    description?: string;
    promptText?: string;
    proofImages?: string[];
    proofType?: 'image' | 'video' | 'audio' | 'text';
    category?: string;
    tags?: string[];
    isPaid?: boolean;
    price?: number;
    privacy?: 'public' | 'private' | 'followers';
    aiPlatform?: string[];
}

/**
 * Create a new prompt
 * POST /api/prompts
 */
export const createPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        // Fetch full user document for monetization check
        const user = await User.findById(req.authenticatedUser.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found',
                errors: ['Invalid user']
            } as ApiResponse);
            return;
        }

        // Rate limiting: 3 prompts per 12 hours for non-admin users
        if (user.role !== 'admin') {
            const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
            const recentPromptCount = await Prompt.countDocuments({
                creator: user._id,
                createdAt: { $gte: twelveHoursAgo }
            });

            if (recentPromptCount >= 3) {
                res.status(429).json({
                    success: false,
                    message: 'Rate limit exceeded',
                    errors: ['You can only create 3 prompts per 12 hours. Please try again later.'],
                    data: {
                        limit: 3,
                        period: '12 hours',
                        current: recentPromptCount
                    }
                } as ApiResponse);
                return;
            }
        }

        const {
            title,
            description,
            promptText,
            proofImages = [],
            proofType,
            category,
            tags = [],
            isPaid = false,
            price = 0,
            privacy = 'public',
            aiPlatform = []
        }: CreatePromptRequest = req.body;

        // If paid prompt, ensure user has monetization unlocked
        if (isPaid && !user.monetizationUnlocked) {
            res.status(403).json({
                success: false,
                message: 'Monetization not unlocked',
                errors: ['Upgrade account to create paid prompts']
            } as ApiResponse);
            return;
        }

        // Create prompt data
        const promptData = {
            title: title.trim(),
            description: description.trim(),
            promptText, // Will be encrypted by pre-save middleware
            proofImages,
            proofType,
            category: category.trim(),
            tags: tags.map(tag => tag.trim()),
            creator: req.authenticatedUser.userId,
            isPaid,
            price: isPaid ? price : 0,
            privacy,
            aiPlatform
        };

        const prompt = new Prompt(promptData);
        await prompt.save();

        // Update user stats
        await User.findByIdAndUpdate(req.authenticatedUser.userId, {
            $inc: { 'stats.totalPrompts': 1 }
        });

        // Get populated prompt for response
        const populatedPrompt = await Prompt.findById(prompt._id)
            .populate('creator', 'username email profilePicture isVerified');

        res.status(201).json({
            success: true,
            message: 'Prompt created successfully',
            data: {
                prompt: populatedPrompt
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Create prompt error:', error);

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
            errors: ['Failed to create prompt']
        } as ApiResponse);
    }
};

/**
 * Get all prompts with filtering and pagination
 * GET /api/prompts
 */
export const getPrompts = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            tags,
            creator,
            featured,
            trending,
            search,
            privacy = 'public'
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build filter query
        const filter: any = {};

        // Privacy filter - only show public prompts by default
        if (privacy === 'public') {
            filter.privacy = 'public';
            filter.isApproved = true;
        }

        if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }

        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            filter.tags = { $in: tagArray };
        }

        if (creator) {
            filter.creator = creator;
        }

        if (featured === 'true') {
            filter.isFeatured = true;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search as string, 'i')] } }
            ];
        }

        // Build sort criteria
        let sort: any = { createdAt: -1 }; // Default: newest first

        if (trending === 'true') {
            // Sort by engagement metrics for trending
            sort = {
                'stats.views': -1,
                'stats.copies': -1,
                'ratings.average': -1,
                createdAt: -1
            };
        }

        // Execute query
        const prompts = await Prompt.find(filter)
            .populate('creator', 'username email profilePicture isVerified reputation.score bio website stats')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        // Get total count for pagination
        const total = await Prompt.countDocuments(filter);
        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            success: true,
            message: 'Prompts retrieved successfully',
            data: {
                prompts
            },
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: total,
                itemsPerPage: limitNum
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Get prompts error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve prompts']
        } as ApiResponse);
    }
};

/**
 * Get single prompt by ID
 * GET /api/prompts/:id
 */
export const getPromptById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // DON'T select promptText - keep it encrypted and hidden from crawlers
        const prompt = await Prompt.findById(id)
            .populate('creator', 'username email profilePicture isVerified reputation stats bio website');

        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            } as ApiResponse);
            return;
        }

        // Check if prompt is private and user has access
        if (prompt.privacy === 'private') {
            if (!req.authenticatedUser || prompt.creator._id.toString() !== req.authenticatedUser.userId.toString()) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    errors: ['This prompt is private']
                } as ApiResponse);
                return;
            }
        }

        // Increment view count (only if not the creator viewing)
        if (!req.authenticatedUser || prompt.creator._id.toString() !== req.authenticatedUser.userId.toString()) {
            await prompt.incrementViews();
        }

        // Return prompt WITHOUT decrypted text (security against crawlers)
        res.status(200).json({
            success: true,
            message: 'Prompt retrieved successfully',
            data: {
                prompt
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Get prompt by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve prompt']
        } as ApiResponse);
    }
};

/**
 * Update prompt
 * PUT /api/prompts/:id
 */
export const updatePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        // Fetch full user document for monetization check
        const user = await User.findById(req.authenticatedUser.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found',
                errors: ['Invalid user']
            } as ApiResponse);
            return;
        }

        const { id } = req.params;
        const updateData: UpdatePromptRequest = req.body;

        const prompt = await Prompt.findById(id);

        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            } as ApiResponse);
            return;
        }

        // Check if user owns this prompt
        if (prompt.creator.toString() !== req.authenticatedUser.userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'Access denied',
                errors: ['You can only update your own prompts']
            } as ApiResponse);
            return;
        }

        // If making prompt paid, ensure user has monetization unlocked
        if (updateData.isPaid && !user.monetizationUnlocked) {
            res.status(403).json({
                success: false,
                message: 'Monetization not unlocked',
                errors: ['Upgrade account to create paid prompts']
            } as ApiResponse);
            return;
        }

        // Prepare update data
        const allowedUpdates = [
            'title', 'description', 'promptText', 'proofImages', 'proofType',
            'category', 'tags', 'isPaid', 'price', 'privacy', 'aiPlatform'
        ];

        const filteredUpdateData: any = {};
        Object.keys(updateData).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdateData[key] = updateData[key as keyof UpdatePromptRequest];
            }
        });

        // Ensure price is 0 if not paid
        if (filteredUpdateData.isPaid === false) {
            filteredUpdateData.price = 0;
        }

        // Update prompt
        const updatedPrompt = await Prompt.findByIdAndUpdate(
            id,
            filteredUpdateData,
            { new: true, runValidators: true }
        ).populate('creator', 'username email profilePicture isVerified reputation.score');

        res.status(200).json({
            success: true,
            message: 'Prompt updated successfully',
            data: {
                prompt: updatedPrompt
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Update prompt error:', error);

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
            errors: ['Failed to update prompt']
        } as ApiResponse);
    }
};

/**
 * Delete prompt
 * DELETE /api/prompts/:id
 */
export const deletePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        const { id } = req.params;

        const prompt = await Prompt.findById(id);

        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            } as ApiResponse);
            return;
        }

        // Check if user owns this prompt
        if (prompt.creator.toString() !== req.authenticatedUser.userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'Access denied',
                errors: ['You can only delete your own prompts']
            } as ApiResponse);
            return;
        }

        await Prompt.findByIdAndDelete(id);

        // Update user stats
        await User.findByIdAndUpdate(req.authenticatedUser.userId, {
            $inc: { 'stats.totalPrompts': -1 }
        });

        res.status(200).json({
            success: true,
            message: 'Prompt deleted successfully',
            data: {
                deletedPromptId: id
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Delete prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to delete prompt']
        } as ApiResponse);
    }
};

/**
 * Copy/Purchase prompt
 * POST /api/prompts/:id/copy
 */
export const copyPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        const { id } = req.params;

        const prompt = await Prompt.findById(id)
            .select('+promptText') // Explicitly include the promptText field
            .populate('creator', 'username');

        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            } as ApiResponse);
            return;
        }

        // Check if prompt is accessible
        if (prompt.privacy === 'private' &&
            prompt.creator._id.toString() !== req.authenticatedUser.userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'Access denied',
                errors: ['This prompt is private']
            } as ApiResponse);
            return;
        }

        // For paid prompts, here you would handle payment processing
        // For now, we'll just check if it's paid and return the decrypted prompt
        if (prompt.isPaid && prompt.price > 0) {
            // TODO: Implement payment verification
            // For demo purposes, allowing access to paid prompts
        }

        // Get decrypted prompt text
        const decryptedPrompt = prompt.getDecryptedPrompt();        // Increment copy count
        await prompt.incrementCopies();

        // Update user stats
        await User.findByIdAndUpdate(prompt.creator._id, {
            $inc: { 'stats.totalCopies': 1 }
        });

        res.status(200).json({
            success: true,
            message: 'Prompt copied successfully',
            data: {
                prompt: {
                    ...prompt.toJSON(),
                    promptText: decryptedPrompt
                }
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Copy prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to copy prompt']
        } as ApiResponse);
    }
};

/**
 * Get user's own prompts
 * GET /api/prompts/my
 */
export const getMyPrompts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        const {
            page = 1,
            limit = 10,
            privacy,
            category
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build filter for user's prompts
        const filter: any = { creator: req.authenticatedUser.userId };

        if (privacy) {
            filter.privacy = privacy;
        }

        if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }

        const prompts = await Prompt.find(filter)
            .populate('creator', 'username email profilePicture isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Prompt.countDocuments(filter);
        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            success: true,
            message: 'User prompts retrieved successfully',
            data: {
                prompts
            },
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: total,
                itemsPerPage: limitNum
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Get my prompts error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve user prompts']
        } as ApiResponse);
    }
};

/**
 * Pin/Unpin a prompt to user profile
 * PATCH /api/prompts/:id/pin
 */
export const togglePinPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        const { id } = req.params;

        // Check if prompt exists
        const prompt = await Prompt.findById(id);

        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            } as ApiResponse);
            return;
        }

        // Check if user owns this prompt
        if (prompt.creator.toString() !== req.authenticatedUser.userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'Access denied',
                errors: ['You can only pin your own prompts']
            } as ApiResponse);
            return;
        }

        // Get current user
        const user = await User.findById(req.authenticatedUser.userId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
                errors: ['User does not exist']
            } as ApiResponse);
            return;
        }

        // Toggle pin
        let isPinned = false;
        if (user.pinnedPrompt?.toString() === id) {
            // Unpin
            user.pinnedPrompt = null;
            isPinned = false;
        } else {
            // Pin (only one prompt can be pinned at a time)
            user.pinnedPrompt = new Types.ObjectId(id);
            isPinned = true;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: isPinned ? 'Prompt pinned to profile' : 'Prompt unpinned from profile',
            data: {
                promptId: id,
                isPinned
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Toggle pin prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to toggle pin prompt']
        } as ApiResponse);
    }
};