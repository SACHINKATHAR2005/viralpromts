import { Response } from 'express';
import { User } from '../models/User';
import { Prompt } from '../models/Prompt';
import { Pool } from '../models/Pool';
import { AuthRequest } from '../types/auth.types';
import { Types } from 'mongoose';

class AdminController {
    // Get all users with pagination
    async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const users = await User.find({})
                .select('-password') // Exclude password field
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalUsers = await User.countDocuments();
            const totalPages = Math.ceil(totalUsers / limit);

            res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalUsers,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error fetching users',
                error: error.message
            });
        }
    }

    // Get user by ID
    async getUserById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId).select('-password');
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: { user }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error fetching user',
                error: error.message
            });
        }
    }

    // Block/Unblock user
    async toggleUserStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { action } = req.body; // 'block' or 'unblock'

            if (!['block', 'unblock'].includes(action)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid action. Use "block" or "unblock"'
                });
                return;
            }

            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Prevent blocking other admins
            if ((user as any).role === 'admin' && action === 'block') {
                res.status(403).json({
                    success: false,
                    message: 'Cannot block admin users'
                });
                return;
            }

            (user as any).isActive = action === 'unblock';
            await user.save();

            res.status(200).json({
                success: true,
                message: `User ${action}ed successfully`,
                data: { user: { ...user.toObject(), password: undefined } }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error updating user status',
                error: error.message
            });
        }
    }

    // Toggle user monetization
    async toggleMonetization(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { enable } = req.body; // boolean

            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            (user as any).monetizationUnlocked = Boolean(enable);
            await user.save();

            res.status(200).json({
                success: true,
                message: `Monetization ${enable ? 'enabled' : 'disabled'} for user`,
                data: { user: { ...user.toObject(), password: undefined } }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error updating monetization status',
                error: error.message
            });
        }
    }

    // Verify/Unverify user
    async toggleUserVerification(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { verify } = req.body; // boolean

            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            (user as any).isVerified = Boolean(verify);
            await user.save();

            res.status(200).json({
                success: true,
                message: `User ${verify ? 'verified' : 'unverified'} successfully`,
                data: { user: { ...user.toObject(), password: undefined } }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error updating verification status',
                error: error.message
            });
        }
    }

    // Get all prompts for moderation
    async getAllPrompts(req: AuthRequest, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const prompts = await Prompt.find({})
                .populate('creator', 'username email isVerified')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalPrompts = await Prompt.countDocuments();
            const totalPages = Math.ceil(totalPrompts / limit);

            res.status(200).json({
                success: true,
                data: {
                    prompts,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalPrompts,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error fetching prompts',
                error: error.message
            });
        }
    }

    // Block/Unblock prompt
    async togglePromptStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { promptId } = req.params;
            const { action, reason } = req.body; // 'block' or 'unblock', reason for blocking

            if (!['block', 'unblock'].includes(action)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid action. Use "block" or "unblock"'
                });
                return;
            }

            const prompt = await Prompt.findById(promptId);
            if (!prompt) {
                res.status(404).json({
                    success: false,
                    message: 'Prompt not found'
                });
                return;
            }

            (prompt as any).isActive = action === 'unblock';

            // Add moderation info
            if (action === 'block' && reason) {
                (prompt as any).moderationReason = reason;
                (prompt as any).moderatedBy = new Types.ObjectId(req.authenticatedUser?.userId);
                (prompt as any).moderatedAt = new Date();
            } else if (action === 'unblock') {
                (prompt as any).moderationReason = undefined;
                (prompt as any).moderatedBy = undefined;
                (prompt as any).moderatedAt = undefined;
            }

            await prompt.save();

            res.status(200).json({
                success: true,
                message: `Prompt ${action}ed successfully`,
                data: { prompt }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error updating prompt status',
                error: error.message
            });
        }
    }

    // Get platform statistics
    async getPlatformStats(req: AuthRequest, res: Response): Promise<void> {
        try {
            const [
                totalUsers,
                activeUsers,
                totalPrompts,
                activePrompts,
                verifiedUsers,
                monetizedUsers
            ] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ isActive: true }),
                Prompt.countDocuments(),
                Prompt.countDocuments({ isActive: true }),
                User.countDocuments({ isVerified: true }),
                User.countDocuments({ monetizationUnlocked: true })
            ]);

            const stats = {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    blocked: totalUsers - activeUsers,
                    verified: verifiedUsers,
                    monetized: monetizedUsers
                },
                prompts: {
                    total: totalPrompts,
                    active: activePrompts,
                    blocked: totalPrompts - activePrompts
                }
            };

            res.status(200).json({
                success: true,
                data: { stats }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error fetching platform statistics',
                error: error.message
            });
        }
    }

    // Delete user (permanent)
    async deleteUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Prevent deleting other admins
            if ((user as any).role === 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Cannot delete admin users'
                });
                return;
            }

            // Also delete user's prompts
            await Prompt.deleteMany({ creator: userId });
            await User.findByIdAndDelete(userId);

            res.status(200).json({
                success: true,
                message: 'User and associated data deleted successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error deleting user',
                error: error.message
            });
        }
    }

    // Get all pools (admin only)
    async getAllPools(req: AuthRequest, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const pools = await Pool.find({})
                .populate('creator', 'username email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Pool.countDocuments();
            const totalPages = Math.ceil(total / limit);

            res.status(200).json({
                success: true,
                data: {
                    pools,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        total,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error fetching pools',
                error: error.message
            });
        }
    }

    // Delete pool (admin only)
    async deletePool(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { poolId } = req.params;

            const pool = await Pool.findByIdAndDelete(poolId);
            if (!pool) {
                res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Pool deleted successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error deleting pool',
                error: error.message
            });
        }
    }

    // Update pool status (admin only)
    async updatePoolStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { poolId } = req.params;
            const { status } = req.body;

            const validStatuses = ['active', 'completed', 'cancelled', 'pending'];
            if (!validStatuses.includes(status)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
                return;
            }

            const pool = await Pool.findByIdAndUpdate(
                poolId,
                { status },
                { new: true }
            );

            if (!pool) {
                res.status(404).json({
                    success: false,
                    message: 'Pool not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Pool status updated successfully',
                data: { pool }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error updating pool status',
                error: error.message
            });
        }
    }

    // Get platform statistics
    async getStats(req: AuthRequest, res: Response): Promise<void> {
        try {
            // Get user statistics
            const totalUsers = await User.countDocuments();
            const activeUsers = await User.countDocuments({ status: 'active' });
            const blockedUsers = await User.countDocuments({ status: 'blocked' });
            const verifiedUsers = await User.countDocuments({ isVerified: true });
            const monetizedUsers = await User.countDocuments({ canMonetize: true });

            // Get prompt statistics
            const totalPrompts = await Prompt.countDocuments();
            const activePrompts = await Prompt.countDocuments({ status: 'active' });
            const blockedPrompts = await Prompt.countDocuments({ status: 'blocked' });

            // Get pool statistics
            const totalPools = await Pool.countDocuments();
            const activePools = await Pool.countDocuments({ status: 'active' });

            const stats = {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    blocked: blockedUsers,
                    verified: verifiedUsers,
                    monetized: monetizedUsers
                },
                prompts: {
                    total: totalPrompts,
                    active: activePrompts,
                    blocked: blockedPrompts
                },
                pools: {
                    total: totalPools,
                    active: activePools
                }
            };

            res.status(200).json({
                success: true,
                data: { stats }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error fetching statistics',
                error: error.message
            });
        }
    }
}

export const adminController = new AdminController();