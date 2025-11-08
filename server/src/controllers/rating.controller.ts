import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { Rating } from '../models/Rating';
import { Prompt } from '../models/Prompt';

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

/**
 * Rate a prompt
 * POST /api/ratings/:promptId
 */
export const ratePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        const { promptId } = req.params;
        const { rating, review } = req.body;
        const userId = req.authenticatedUser.userId;

        // Validate rating
        if (!rating || rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
            res.status(400).json({
                success: false,
                message: 'Invalid rating',
                errors: ['Rating must be a whole number between 1 and 5']
            } as ApiResponse);
            return;
        }

        // Check if prompt exists
        const prompt = await Prompt.findById(promptId);
        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            } as ApiResponse);
            return;
        }

        // Check if user already rated this prompt
        const existingRating = await Rating.findOne({ user: userId, prompt: promptId });
        if (existingRating) {
            res.status(400).json({
                success: false,
                message: 'Already rated',
                errors: ['You have already rated this prompt']
            } as ApiResponse);
            return;
        }

        // Create rating
        const newRating = new Rating({
            user: userId,
            prompt: promptId,
            rating: Number(rating),
            review: review?.trim() || ''
        });

        await newRating.save();

        // Calculate new average rating for the prompt
        const ratings = await Rating.find({ prompt: promptId });
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        const totalRatings = ratings.length;

        // Update prompt with new rating stats
        await Prompt.findByIdAndUpdate(promptId, {
            'stats.averageRating': Math.round(averageRating * 100) / 100, // Round to 2 decimal places
            'stats.totalRatings': totalRatings
        });

        // Populate user info for response
        const populatedRating = await Rating.findById(newRating._id)
            .populate('user', 'username profilePicture isVerified');

        res.status(201).json({
            success: true,
            message: 'Rating added successfully',
            data: {
                rating: populatedRating,
                promptStats: {
                    averageRating: Math.round(averageRating * 100) / 100,
                    totalRatings
                }
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Rate prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to rate prompt']
        } as ApiResponse);
    }
};

/**
 * Update a rating
 * PUT /api/ratings/:promptId
 */
export const updateRating = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        const { promptId } = req.params;
        const { rating, review } = req.body;
        const userId = req.authenticatedUser.userId;

        // Validate rating
        if (rating && (rating < 1 || rating > 5 || !Number.isInteger(Number(rating)))) {
            res.status(400).json({
                success: false,
                message: 'Invalid rating',
                errors: ['Rating must be a whole number between 1 and 5']
            } as ApiResponse);
            return;
        }

        // Find existing rating
        const existingRating = await Rating.findOne({ user: userId, prompt: promptId });
        if (!existingRating) {
            res.status(404).json({
                success: false,
                message: 'Rating not found',
                errors: ['You have not rated this prompt yet']
            } as ApiResponse);
            return;
        }

        // Update rating
        if (rating) existingRating.rating = Number(rating);
        if (review !== undefined) existingRating.review = review.trim();

        await existingRating.save();

        // Recalculate average rating for the prompt
        const ratings = await Rating.find({ prompt: promptId });
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        const totalRatings = ratings.length;

        // Update prompt with new rating stats
        await Prompt.findByIdAndUpdate(promptId, {
            'stats.averageRating': Math.round(averageRating * 100) / 100,
            'stats.totalRatings': totalRatings
        });

        // Populate user info for response
        const populatedRating = await Rating.findById(existingRating._id)
            .populate('user', 'username profilePicture isVerified');

        res.status(200).json({
            success: true,
            message: 'Rating updated successfully',
            data: {
                rating: populatedRating,
                promptStats: {
                    averageRating: Math.round(averageRating * 100) / 100,
                    totalRatings
                }
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Update rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to update rating']
        } as ApiResponse);
    }
};

/**
 * Get ratings for a prompt
 * GET /api/ratings/:promptId
 */
export const getPromptRatings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { promptId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const sortBy = req.query.sortBy as string || 'createdAt'; // 'createdAt', 'rating', 'helpfulVotes'
        const sortOrder = req.query.sortOrder as string === 'asc' ? 1 : -1;
        const skip = (page - 1) * limit;

        // Build sort object
        const sort: any = {};
        sort[sortBy] = sortOrder;

        // Get ratings with user info
        const ratings = await Rating.find({ prompt: promptId })
            .populate('user', 'username profilePicture isVerified')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const totalRatings = await Rating.countDocuments({ prompt: promptId });

        // Calculate rating distribution
        const ratingDistribution = await Rating.aggregate([
            { $match: { prompt: promptId } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);

        // Calculate average rating
        const avgRatingResult = await Rating.aggregate([
            { $match: { prompt: promptId } },
            { $group: { _id: null, averageRating: { $avg: '$rating' } } }
        ]);

        const averageRating = avgRatingResult.length > 0 ?
            Math.round(avgRatingResult[0].averageRating * 100) / 100 : 0;

        res.status(200).json({
            success: true,
            message: 'Ratings retrieved successfully',
            data: {
                ratings,
                stats: {
                    averageRating,
                    totalRatings,
                    distribution: ratingDistribution
                }
            },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalRatings / limit),
                totalItems: totalRatings,
                itemsPerPage: limit
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Get ratings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve ratings']
        } as ApiResponse);
    }
};

/**
 * Delete a rating
 * DELETE /api/ratings/:promptId
 */
export const deleteRating = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        const { promptId } = req.params;
        const userId = req.authenticatedUser.userId;

        // Find and delete rating
        const rating = await Rating.findOneAndDelete({ user: userId, prompt: promptId });
        if (!rating) {
            res.status(404).json({
                success: false,
                message: 'Rating not found',
                errors: ['You have not rated this prompt']
            } as ApiResponse);
            return;
        }

        // Recalculate average rating for the prompt
        const ratings = await Rating.find({ prompt: promptId });
        const averageRating = ratings.length > 0 ?
            ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
        const totalRatings = ratings.length;

        // Update prompt with new rating stats
        await Prompt.findByIdAndUpdate(promptId, {
            'stats.averageRating': Math.round(averageRating * 100) / 100,
            'stats.totalRatings': totalRatings
        });

        res.status(200).json({
            success: true,
            message: 'Rating deleted successfully',
            data: {
                promptStats: {
                    averageRating: Math.round(averageRating * 100) / 100,
                    totalRatings
                }
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Delete rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to delete rating']
        } as ApiResponse);
    }
};

/**
 * Mark a review as helpful
 * POST /api/ratings/:ratingId/helpful
 */
export const markReviewHelpful = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        const { ratingId } = req.params;

        // Find rating
        const rating = await Rating.findById(ratingId);
        if (!rating) {
            res.status(404).json({
                success: false,
                message: 'Rating not found',
                errors: ['Rating does not exist']
            } as ApiResponse);
            return;
        }

        // Increment helpful votes
        rating.helpfulVotes += 1;
        await rating.save();

        res.status(200).json({
            success: true,
            message: 'Review marked as helpful',
            data: { helpfulVotes: rating.helpfulVotes }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Mark helpful error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to mark review as helpful']
        } as ApiResponse);
    }
};