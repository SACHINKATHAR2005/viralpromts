"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const User_1 = require("../models/User");
const Prompt_1 = require("../models/Prompt");
const mongoose_1 = require("mongoose");
class AdminController {
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const users = await User_1.User.find({})
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const totalUsers = await User_1.User.countDocuments();
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching users',
                error: error.message
            });
        }
    }
    async getUserById(req, res) {
        try {
            const { userId } = req.params;
            const user = await User_1.User.findById(userId).select('-password');
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching user',
                error: error.message
            });
        }
    }
    async toggleUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { action } = req.body;
            if (!['block', 'unblock'].includes(action)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid action. Use "block" or "unblock"'
                });
                return;
            }
            const user = await User_1.User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            if (user.role === 'admin' && action === 'block') {
                res.status(403).json({
                    success: false,
                    message: 'Cannot block admin users'
                });
                return;
            }
            user.isActive = action === 'unblock';
            await user.save();
            res.status(200).json({
                success: true,
                message: `User ${action}ed successfully`,
                data: { user: { ...user.toObject(), password: undefined } }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating user status',
                error: error.message
            });
        }
    }
    async toggleMonetization(req, res) {
        try {
            const { userId } = req.params;
            const { enable } = req.body;
            const user = await User_1.User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            user.monetizationUnlocked = Boolean(enable);
            await user.save();
            res.status(200).json({
                success: true,
                message: `Monetization ${enable ? 'enabled' : 'disabled'} for user`,
                data: { user: { ...user.toObject(), password: undefined } }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating monetization status',
                error: error.message
            });
        }
    }
    async toggleUserVerification(req, res) {
        try {
            const { userId } = req.params;
            const { verify } = req.body;
            const user = await User_1.User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            user.isVerified = Boolean(verify);
            await user.save();
            res.status(200).json({
                success: true,
                message: `User ${verify ? 'verified' : 'unverified'} successfully`,
                data: { user: { ...user.toObject(), password: undefined } }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating verification status',
                error: error.message
            });
        }
    }
    async getAllPrompts(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const prompts = await Prompt_1.Prompt.find({})
                .populate('creator', 'username email isVerified')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const totalPrompts = await Prompt_1.Prompt.countDocuments();
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching prompts',
                error: error.message
            });
        }
    }
    async togglePromptStatus(req, res) {
        try {
            const { promptId } = req.params;
            const { action, reason } = req.body;
            if (!['block', 'unblock'].includes(action)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid action. Use "block" or "unblock"'
                });
                return;
            }
            const prompt = await Prompt_1.Prompt.findById(promptId);
            if (!prompt) {
                res.status(404).json({
                    success: false,
                    message: 'Prompt not found'
                });
                return;
            }
            prompt.isActive = action === 'unblock';
            if (action === 'block' && reason) {
                prompt.moderationReason = reason;
                prompt.moderatedBy = new mongoose_1.Types.ObjectId(req.authenticatedUser?.userId);
                prompt.moderatedAt = new Date();
            }
            else if (action === 'unblock') {
                prompt.moderationReason = undefined;
                prompt.moderatedBy = undefined;
                prompt.moderatedAt = undefined;
            }
            await prompt.save();
            res.status(200).json({
                success: true,
                message: `Prompt ${action}ed successfully`,
                data: { prompt }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating prompt status',
                error: error.message
            });
        }
    }
    async getPlatformStats(req, res) {
        try {
            const [totalUsers, activeUsers, totalPrompts, activePrompts, verifiedUsers, monetizedUsers] = await Promise.all([
                User_1.User.countDocuments(),
                User_1.User.countDocuments({ isActive: true }),
                Prompt_1.Prompt.countDocuments(),
                Prompt_1.Prompt.countDocuments({ isActive: true }),
                User_1.User.countDocuments({ isVerified: true }),
                User_1.User.countDocuments({ monetizationUnlocked: true })
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching platform statistics',
                error: error.message
            });
        }
    }
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            const user = await User_1.User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            if (user.role === 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Cannot delete admin users'
                });
                return;
            }
            await Prompt_1.Prompt.deleteMany({ creator: userId });
            await User_1.User.findByIdAndDelete(userId);
            res.status(200).json({
                success: true,
                message: 'User and associated data deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting user',
                error: error.message
            });
        }
    }
}
exports.adminController = new AdminController();
//# sourceMappingURL=admin.controller.js.map