import { Request, Response } from 'express';
import { Pool } from '../models/Pool';
import { Prompt } from '../models/Prompt';
import { User } from '../models/User';
import { PoolVote } from '../models/PoolVote';
import { AuthRequest } from '../types/auth.types';
import { Types } from 'mongoose';

export class PoolController {
    // Create a new pool
    static async createPool(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;

            const {
                title,
                description,
                type,
                category,
                tags,
                maxParticipants,
                isPrivate,
                requireApproval,
                allowVoting,
                challenge,
                voting
            } = req.body;

            // Validate required fields
            if (!title || !description || !type || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, description, type, and category are required'
                });
            }

            // Create pool
            const pool = new Pool({
                title,
                description,
                type,
                category,
                tags: tags || [],
                creator: userId,
                moderators: [userId], // Creator is automatically a moderator
                participants: [userId], // Creator is automatically a participant
                maxParticipants,
                isPrivate: isPrivate || false,
                requireApproval: requireApproval || false,
                allowVoting: allowVoting !== false, // Default to true
                challenge: type === 'challenge' ? challenge : undefined,
                voting: type === 'voting' ? voting : undefined
            });

            await pool.save();

            // Populate creator info
            await pool.populate('creator', 'username avatar');

            return res.status(201).json({
                success: true,
                message: 'Pool created successfully',
                data: pool
            });
        } catch (error) {
            console.error('Create pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create pool'
            });
        }
    }

    // Get all pools with filters
    static async getPools(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const {
                type,
                category,
                status = 'active',
                featured,
                page = 1,
                limit = 20,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build filter
            const filter: any = {};

            if (type) filter.type = type;
            if (category) filter.category = category;
            if (status) filter.status = status;
            if (featured !== undefined) filter.featured = featured === 'true';
            if (!req.authenticatedUser) filter.isPrivate = false; // Only show public pools to non-authenticated users

            // Search functionality
            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search as string, 'i')] } }
                ];
            }

            // Sort options
            const sort: any = {};
            sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const [pools, total] = await Promise.all([
                Pool.find(filter)
                    .populate('creator', 'username avatar')
                    .populate('moderators', 'username avatar')
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum),
                Pool.countDocuments(filter)
            ]);

            return res.json({
                success: true,
                data: {
                    pools,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum)
                    }
                }
            });
        } catch (error) {
            console.error('Get pools error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch pools'
            });
        }
    }

    // Get single pool
    static async getPool(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { poolId } = req.params;

            const pool = await Pool.findById(poolId)
                .populate('creator', 'username avatar bio')
                .populate('moderators', 'username avatar')
                .populate('participants', 'username avatar')
                .populate({
                    path: 'prompts',
                    select: 'title description category tags stats creator createdAt',
                    populate: {
                        path: 'creator',
                        select: 'username avatar'
                    }
                });

            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }

            // Check if user has access to private pool
            if (pool.isPrivate && req.authenticatedUser) {
                const userId = req.authenticatedUser.userId;
                if (!pool.participants.some((p: any) => p._id.toString() === userId) &&
                    !pool.moderators.some((m: any) => m._id.toString() === userId) &&
                    pool.creator._id.toString() !== userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied to private pool'
                    });
                }
            } else if (pool.isPrivate && !req.authenticatedUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required for private pool'
                });
            }

            return res.json({
                success: true,
                data: pool
            });
        } catch (error) {
            console.error('Get pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch pool'
            });
        }
    }

    // Join a pool
    static async joinPool(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { poolId } = req.params;

            const pool = await Pool.findById(poolId);
            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }

            // Check if pool allows joining
            if (!pool.canJoin()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot join this pool (inactive or full)'
                });
            }

            // Check if already a participant
            const userObjectId = new Types.ObjectId(userId);
            if (pool.isParticipant(userObjectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Already a participant in this pool'
                });
            }

            // Add participant
            await pool.addParticipant(userObjectId);

            return res.json({
                success: true,
                message: 'Successfully joined pool'
            });
        } catch (error) {
            console.error('Join pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to join pool'
            });
        }
    }

    // Leave a pool
    static async leavePool(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { poolId } = req.params;

            const pool = await Pool.findById(poolId);
            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }

            // Check if user is participant
            const userObjectId = new Types.ObjectId(userId);
            if (!pool.isParticipant(userObjectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Not a participant in this pool'
                });
            }

            // Prevent creator from leaving
            if (pool.creator.toString() === userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Pool creator cannot leave the pool'
                });
            }

            // Remove participant
            await pool.removeParticipant(userObjectId);

            return res.json({
                success: true,
                message: 'Successfully left pool'
            });
        } catch (error) {
            console.error('Leave pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to leave pool'
            });
        }
    }

    // Add prompt to pool
    static async addPromptToPool(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { poolId } = req.params;
            const { promptId } = req.body;

            const [pool, prompt] = await Promise.all([
                Pool.findById(poolId),
                Prompt.findById(promptId)
            ]);

            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }

            if (!prompt) {
                return res.status(404).json({
                    success: false,
                    message: 'Prompt not found'
                });
            }

            // Check if user is participant
            if (!pool.isParticipant(new Types.ObjectId(userId))) {
                return res.status(403).json({
                    success: false,
                    message: 'Must be a participant to add prompts'
                });
            }

            // Check if prompt is already in pool
            if (pool.prompts.includes(promptId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Prompt already in pool'
                });
            }

            // Add prompt to pool
            await pool.addPrompt(new Types.ObjectId(promptId));

            return res.json({
                success: true,
                message: 'Prompt added to pool successfully'
            });
        } catch (error) {
            console.error('Add prompt to pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to add prompt to pool'
            });
        }
    }

    // Update pool (moderators only)
    static async updatePool(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { poolId } = req.params;

            const pool = await Pool.findById(poolId);
            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }

            // Check if user is moderator
            if (!pool.isModerator(new Types.ObjectId(userId))) {
                return res.status(403).json({
                    success: false,
                    message: 'Only moderators can update the pool'
                });
            }

            // Update allowed fields
            const allowedUpdates = [
                'title', 'description', 'tags', 'maxParticipants',
                'requireApproval', 'allowVoting', 'challenge', 'voting', 'status'
            ];

            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) {
                    (pool as any)[field] = req.body[field];
                }
            });

            await pool.save();

            return res.json({
                success: true,
                message: 'Pool updated successfully',
                data: pool
            });
        } catch (error) {
            console.error('Update pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update pool'
            });
        }
    }

    // Delete pool (creator only)
    static async deletePool(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { poolId } = req.params;

            const pool = await Pool.findById(poolId);
            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }

            // Check if user is creator
            if (pool.creator.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the pool creator can delete the pool'
                });
            }

            await Pool.findByIdAndDelete(poolId);

            return res.json({
                success: true,
                message: 'Pool deleted successfully'
            });
        } catch (error) {
            console.error('Delete pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete pool'
            });
        }
    }

    // Get user's pools
    static async getMyPools(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { type = 'all' } = req.query; // 'created', 'participating', 'moderating', 'all'

            let filter: any = {};

            switch (type) {
                case 'created':
                    filter.creator = userId;
                    break;
                case 'participating':
                    filter.participants = userId;
                    break;
                case 'moderating':
                    filter.moderators = userId;
                    break;
                default:
                    filter.$or = [
                        { creator: userId },
                        { participants: userId },
                        { moderators: userId }
                    ];
            }

            const pools = await Pool.find(filter)
                .populate('creator', 'username avatar')
                .sort({ updatedAt: -1 });

            return res.json({
                success: true,
                data: pools
            });
        } catch (error) {
            console.error('Get user pools error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch user pools'
            });
        }
    }

    // Alias for route compatibility
    static async getUserPools(req: AuthRequest, res: Response): Promise<Response> {
        return PoolController.getMyPools(req, res);
    }

    // Vote on a prompt in a pool
    static async voteOnPrompt(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { poolId, promptId } = req.params;
            const { voteValue } = req.body;

            // Validate voteValue
            if (![1, -1, 2, 3, 4, 5].includes(voteValue)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid vote value'
                });
            }

            // Check if pool exists and allows voting
            const pool = await Pool.findById(poolId);
            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }

            if (!pool.allowVoting) {
                return res.status(403).json({
                    success: false,
                    message: 'Voting is not allowed for this pool'
                });
            }

            // Check if prompt is in the pool
            if (!pool.prompts.includes(new Types.ObjectId(promptId))) {
                return res.status(400).json({
                    success: false,
                    message: 'Prompt is not in this pool'
                });
            }

            // Create or update vote
            const vote = await PoolVote.findOneAndUpdate(
                { pool: poolId, prompt: promptId, user: userId },
                { voteValue },
                { upsert: true, new: true }
            );

            return res.json({
                success: true,
                message: 'Vote recorded successfully',
                data: vote
            });
        } catch (error) {
            console.error('Vote on prompt error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to record vote'
            });
        }
    }

    // Get leaderboard for a pool
    static async getPoolLeaderboard(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { poolId } = req.params;
            const { limit = 50 } = req.query;

            const pool = await Pool.findById(poolId);
            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }

            // Aggregate votes to get leaderboard
            const leaderboard = await PoolVote.aggregate([
                { $match: { pool: new Types.ObjectId(poolId) } },
                {
                    $group: {
                        _id: '$prompt',
                        totalVotes: { $sum: '$voteValue' },
                        voteCount: { $sum: 1 },
                        averageVote: { $avg: '$voteValue' }
                    }
                },
                { $sort: { totalVotes: -1, voteCount: -1 } },
                { $limit: parseInt(limit as string) },
                {
                    $lookup: {
                        from: 'prompts',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'prompt'
                    }
                },
                { $unwind: '$prompt' },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'prompt.creator',
                        foreignField: '_id',
                        as: 'creator'
                    }
                },
                { $unwind: '$creator' },
                {
                    $project: {
                        prompt: {
                            _id: '$prompt._id',
                            title: '$prompt.title',
                            description: '$prompt.description',
                            proofImages: '$prompt.proofImages',
                            category: '$prompt.category',
                            createdAt: '$prompt.createdAt'
                        },
                        creator: {
                            _id: '$creator._id',
                            username: '$creator.username',
                            profilePicture: '$creator.profilePicture',
                            isVerified: '$creator.isVerified'
                        },
                        totalVotes: 1,
                        voteCount: 1,
                        averageVote: 1
                    }
                }
            ]);

            return res.json({
                success: true,
                data: {
                    leaderboard,
                    pool: {
                        _id: pool._id,
                        title: pool.title,
                        type: pool.type,
                        challenge: pool.challenge,
                        voting: pool.voting
                    }
                }
            });
        } catch (error) {
            console.error('Get leaderboard error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch leaderboard'
            });
        }
    }
}
