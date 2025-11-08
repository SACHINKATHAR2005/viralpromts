import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { Like, Comment, Follow, Rating, SavedPrompt } from '../models';
import { User } from '../models/User';
import { Prompt } from '../models/Prompt';
import { CacheService } from '../services/cache.service';

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
 * Like a prompt
 * POST /api/social/like/:promptId
 */
export const likePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Check if user already liked this prompt
        const existingLike = await Like.findOne({ user: userId, prompt: promptId });
        if (existingLike) {
            res.status(400).json({
                success: false,
                message: 'Already liked',
                errors: ['You have already liked this prompt']
            } as ApiResponse);
            return;
        }

        // Create like
        const like = new Like({
            user: userId,
            prompt: promptId
        });

        await like.save();

        // Update prompt's like count
        await Prompt.findByIdAndUpdate(promptId, {
            $inc: { 'stats.totalLikes': 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Prompt liked successfully',
            data: { like }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Like prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to like prompt']
        } as ApiResponse);
    }
};

/**
 * Unlike a prompt
 * DELETE /api/social/like/:promptId
 */
export const unlikePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Find and remove like
        const like = await Like.findOneAndDelete({ user: userId, prompt: promptId });
        if (!like) {
            res.status(404).json({
                success: false,
                message: 'Like not found',
                errors: ['You have not liked this prompt']
            } as ApiResponse);
            return;
        }

        // Update prompt's like count
        await Prompt.findByIdAndUpdate(promptId, {
            $inc: { 'stats.totalLikes': -1 }
        });

        res.status(200).json({
            success: true,
            message: 'Prompt unliked successfully'
        } as ApiResponse);

    } catch (error: any) {
        console.error('Unlike prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to unlike prompt']
        } as ApiResponse);
    }
};

/**
 * Add comment to prompt
 * POST /api/social/comment/:promptId
 */
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
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
        const { content, parentComment } = req.body;
        const userId = req.authenticatedUser.userId;

        // Validate input
        if (!content || content.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: 'Invalid input',
                errors: ['Comment content is required']
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

        // If replying to a comment, check if parent comment exists
        if (parentComment) {
            const parentCommentDoc = await Comment.findById(parentComment);
            if (!parentCommentDoc) {
                res.status(404).json({
                    success: false,
                    message: 'Parent comment not found',
                    errors: ['Parent comment does not exist']
                } as ApiResponse);
                return;
            }
        }

        // Create comment
        const comment = new Comment({
            user: userId,
            prompt: promptId,
            content: content.trim(),
            parentComment: parentComment || null
        });

        await comment.save();

        // Update prompt's comment count
        await Prompt.findByIdAndUpdate(promptId, {
            $inc: { 'stats.totalComments': 1 }
        });

        // Populate user info for response
        const populatedComment = await Comment.findById(comment._id)
            .populate('user', 'username profilePicture isVerified');

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: { comment: populatedComment }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to add comment']
        } as ApiResponse);
    }
};

/**
 * Get comments for a prompt
 * GET /api/social/comments/:promptId
 */
export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { promptId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const skip = (page - 1) * limit;

        // Get top-level comments (no parent)
        const comments = await Comment.find({
            prompt: promptId,
            parentComment: null,
            isDeleted: false
        })
            .populate('user', 'username profilePicture isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get replies for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await Comment.find({
                    parentComment: comment._id,
                    isDeleted: false
                })
                    .populate('user', 'username profilePicture isVerified')
                    .sort({ createdAt: 1 })
                    .limit(5); // Limit replies shown initially

                return {
                    ...comment.toJSON(),
                    replies,
                    repliesCount: await Comment.countDocuments({
                        parentComment: comment._id,
                        isDeleted: false
                    })
                };
            })
        );

        const totalComments = await Comment.countDocuments({
            prompt: promptId,
            parentComment: null,
            isDeleted: false
        });

        res.status(200).json({
            success: true,
            message: 'Comments retrieved successfully',
            data: { comments: commentsWithReplies },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalComments / limit),
                totalItems: totalComments,
                itemsPerPage: limit
            }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Get comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve comments']
        } as ApiResponse);
    }
};

/**
 * Follow a user
 * POST /api/social/follow/:userId
 */
export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        const { userId: targetUserId } = req.params;
        const followerId = req.authenticatedUser.userId;

        // Can't follow yourself
        if (followerId === targetUserId) {
            res.status(400).json({
                success: false,
                message: 'Invalid action',
                errors: ['You cannot follow yourself']
            } as ApiResponse);
            return;
        }

        // Check if target user exists
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            res.status(404).json({
                success: false,
                message: 'User not found',
                errors: ['User does not exist']
            } as ApiResponse);
            return;
        }

        // Check if already following
        const existingFollow = await Follow.findOne({
            follower: followerId,
            following: targetUserId
        });
        if (existingFollow) {
            res.status(400).json({
                success: false,
                message: 'Already following',
                errors: ['You are already following this user']
            } as ApiResponse);
            return;
        }

        // Create follow relationship
        const follow = new Follow({
            follower: followerId,
            following: targetUserId
        });

        await follow.save();

        // Update follower count for target user
        await User.findByIdAndUpdate(targetUserId, {
            $inc: { 'stats.followersCount': 1 }
        });

        // Update following count for current user  
        await User.findByIdAndUpdate(followerId, {
            $inc: { 'stats.followingCount': 1 }
        });

        res.status(201).json({
            success: true,
            message: 'User followed successfully',
            data: { follow }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Follow user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to follow user']
        } as ApiResponse);
    }
};

/**
 * Unfollow a user
 * DELETE /api/social/follow/:userId
 */
export const unfollowUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            } as ApiResponse);
            return;
        }

        const { userId: targetUserId } = req.params;
        const followerId = req.authenticatedUser.userId;

        // Find and remove follow relationship
        const follow = await Follow.findOneAndDelete({
            follower: followerId,
            following: targetUserId
        });

        if (!follow) {
            res.status(404).json({
                success: false,
                message: 'Follow relationship not found',
                errors: ['You are not following this user']
            } as ApiResponse);
            return;
        }

        // Update follower count for target user
        await User.findByIdAndUpdate(targetUserId, {
            $inc: { 'stats.followersCount': -1 }
        });

        // Update following count for current user
        await User.findByIdAndUpdate(followerId, {
            $inc: { 'stats.followingCount': -1 }
        });

        res.status(200).json({
            success: true,
            message: 'User unfollowed successfully'
        } as ApiResponse);

    } catch (error: any) {
        console.error('Unfollow user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to unfollow user']
        } as ApiResponse);
    }
};

/**
 * Save/Copy a prompt to user's collection
 * POST /api/social/save/:promptId
 */
export const savePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
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
        const { collectionName, notes } = req.body;
        const userId = req.authenticatedUser.userId;

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

        // Check if already saved in this collection
        const existingSave = await SavedPrompt.findOne({
            user: userId,
            prompt: promptId,
            collectionName: collectionName || 'Saved'
        });

        if (existingSave) {
            res.status(400).json({
                success: false,
                message: 'Already saved',
                errors: ['Prompt is already saved to this collection']
            } as ApiResponse);
            return;
        }

        // Create saved prompt
        const savedPrompt = new SavedPrompt({
            user: userId,
            prompt: promptId,
            collectionName: collectionName || 'Saved',
            notes: notes || ''
        });

        await savedPrompt.save();

        // Update prompt's copy count
        await Prompt.findByIdAndUpdate(promptId, {
            $inc: { 'stats.totalCopies': 1 }
        });

        // Update user stats
        await User.findByIdAndUpdate(userId, {
            $inc: { 'stats.totalCopies': 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Prompt saved successfully',
            data: { savedPrompt }
        } as ApiResponse);

    } catch (error: any) {
        console.error('Save prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to save prompt']
        } as ApiResponse);
    }
};