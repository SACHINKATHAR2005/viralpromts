"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolController = void 0;
const Pool_1 = require("../models/Pool");
const Prompt_1 = require("../models/Prompt");
const mongoose_1 = require("mongoose");
class PoolController {
    static async createPool(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { title, description, type, category, tags, maxParticipants, isPrivate, requireApproval, allowVoting, challenge, voting } = req.body;
            if (!title || !description || !type || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, description, type, and category are required'
                });
            }
            const pool = new Pool_1.Pool({
                title,
                description,
                type,
                category,
                tags: tags || [],
                creator: userId,
                moderators: [userId],
                participants: [userId],
                maxParticipants,
                isPrivate: isPrivate || false,
                requireApproval: requireApproval || false,
                allowVoting: allowVoting !== false,
                challenge: type === 'challenge' ? challenge : undefined,
                voting: type === 'voting' ? voting : undefined
            });
            await pool.save();
            await pool.populate('creator', 'username avatar');
            return res.status(201).json({
                success: true,
                message: 'Pool created successfully',
                data: pool
            });
        }
        catch (error) {
            console.error('Create pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create pool'
            });
        }
    }
    static async getPools(req, res) {
        try {
            const { type, category, status = 'active', featured, page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const filter = {};
            if (type)
                filter.type = type;
            if (category)
                filter.category = category;
            if (status)
                filter.status = status;
            if (featured !== undefined)
                filter.featured = featured === 'true';
            if (!req.authenticatedUser)
                filter.isPrivate = false;
            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const [pools, total] = await Promise.all([
                Pool_1.Pool.find(filter)
                    .populate('creator', 'username avatar')
                    .populate('moderators', 'username avatar')
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum),
                Pool_1.Pool.countDocuments(filter)
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
        }
        catch (error) {
            console.error('Get pools error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch pools'
            });
        }
    }
    static async getPool(req, res) {
        try {
            const { poolId } = req.params;
            const pool = await Pool_1.Pool.findById(poolId)
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
            if (pool.isPrivate && req.authenticatedUser) {
                const userId = req.authenticatedUser.userId;
                if (!pool.participants.some((p) => p._id.toString() === userId) &&
                    !pool.moderators.some((m) => m._id.toString() === userId) &&
                    pool.creator._id.toString() !== userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied to private pool'
                    });
                }
            }
            else if (pool.isPrivate && !req.authenticatedUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required for private pool'
                });
            }
            return res.json({
                success: true,
                data: pool
            });
        }
        catch (error) {
            console.error('Get pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch pool'
            });
        }
    }
    static async joinPool(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { poolId } = req.params;
            const pool = await Pool_1.Pool.findById(poolId);
            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }
            if (!pool.canJoin()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot join this pool (inactive or full)'
                });
            }
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            if (pool.isParticipant(userObjectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Already a participant in this pool'
                });
            }
            await pool.addParticipant(userObjectId);
            return res.json({
                success: true,
                message: 'Successfully joined pool'
            });
        }
        catch (error) {
            console.error('Join pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to join pool'
            });
        }
    }
    static async leavePool(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { poolId } = req.params;
            const pool = await Pool_1.Pool.findById(poolId);
            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            if (!pool.isParticipant(userObjectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Not a participant in this pool'
                });
            }
            if (pool.creator.toString() === userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Pool creator cannot leave the pool'
                });
            }
            await pool.removeParticipant(userObjectId);
            return res.json({
                success: true,
                message: 'Successfully left pool'
            });
        }
        catch (error) {
            console.error('Leave pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to leave pool'
            });
        }
    }
    static async addPromptToPool(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { poolId } = req.params;
            const { promptId } = req.body;
            const [pool, prompt] = await Promise.all([
                Pool_1.Pool.findById(poolId),
                Prompt_1.Prompt.findById(promptId)
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
            if (!pool.isParticipant(new mongoose_1.Types.ObjectId(userId))) {
                return res.status(403).json({
                    success: false,
                    message: 'Must be a participant to add prompts'
                });
            }
            if (pool.prompts.includes(promptId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Prompt already in pool'
                });
            }
            await pool.addPrompt(new mongoose_1.Types.ObjectId(promptId));
            return res.json({
                success: true,
                message: 'Prompt added to pool successfully'
            });
        }
        catch (error) {
            console.error('Add prompt to pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to add prompt to pool'
            });
        }
    }
    static async updatePool(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { poolId } = req.params;
            const pool = await Pool_1.Pool.findById(poolId);
            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }
            if (!pool.isModerator(new mongoose_1.Types.ObjectId(userId))) {
                return res.status(403).json({
                    success: false,
                    message: 'Only moderators can update the pool'
                });
            }
            const allowedUpdates = [
                'title', 'description', 'tags', 'maxParticipants',
                'requireApproval', 'allowVoting', 'challenge', 'voting', 'status'
            ];
            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) {
                    pool[field] = req.body[field];
                }
            });
            await pool.save();
            return res.json({
                success: true,
                message: 'Pool updated successfully',
                data: pool
            });
        }
        catch (error) {
            console.error('Update pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update pool'
            });
        }
    }
    static async deletePool(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { poolId } = req.params;
            const pool = await Pool_1.Pool.findById(poolId);
            if (!pool) {
                return res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
            }
            if (pool.creator.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the pool creator can delete the pool'
                });
            }
            await Pool_1.Pool.findByIdAndDelete(poolId);
            return res.json({
                success: true,
                message: 'Pool deleted successfully'
            });
        }
        catch (error) {
            console.error('Delete pool error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete pool'
            });
        }
    }
    static async getMyPools(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { type = 'all' } = req.query;
            let filter = {};
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
            const pools = await Pool_1.Pool.find(filter)
                .populate('creator', 'username avatar')
                .sort({ updatedAt: -1 });
            return res.json({
                success: true,
                data: pools
            });
        }
        catch (error) {
            console.error('Get user pools error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch user pools'
            });
        }
    }
    static async getUserPools(req, res) {
        return PoolController.getMyPools(req, res);
    }
}
exports.PoolController = PoolController;
//# sourceMappingURL=pool.controller.js.map