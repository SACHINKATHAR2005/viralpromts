"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPrompts = exports.copyPrompt = exports.deletePrompt = exports.updatePrompt = exports.getPromptById = exports.getPrompts = exports.createPrompt = void 0;
const Prompt_1 = require("../models/Prompt");
const User_1 = require("../models/User");
const createPrompt = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const user = await User_1.User.findById(req.authenticatedUser.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found',
                errors: ['Invalid user']
            });
            return;
        }
        const { title, description, promptText, proofImages = [], proofType, category, tags = [], isPaid = false, price = 0, privacy = 'public', aiPlatform = [] } = req.body;
        if (isPaid && !user.monetizationUnlocked) {
            res.status(403).json({
                success: false,
                message: 'Monetization not unlocked',
                errors: ['Upgrade account to create paid prompts']
            });
            return;
        }
        const promptData = {
            title: title.trim(),
            description: description.trim(),
            promptText,
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
        const prompt = new Prompt_1.Prompt(promptData);
        await prompt.save();
        await User_1.User.findByIdAndUpdate(req.authenticatedUser.userId, {
            $inc: { 'stats.totalPrompts': 1 }
        });
        const populatedPrompt = await Prompt_1.Prompt.findById(prompt._id)
            .populate('creator', 'username email profilePicture isVerified');
        res.status(201).json({
            success: true,
            message: 'Prompt created successfully',
            data: {
                prompt: populatedPrompt
            }
        });
    }
    catch (error) {
        console.error('Create prompt error:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to create prompt']
        });
    }
};
exports.createPrompt = createPrompt;
const getPrompts = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, tags, creator, featured, trending, search, privacy = 'public' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const filter = {};
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
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        let sort = { createdAt: -1 };
        if (trending === 'true') {
            sort = {
                'stats.views': -1,
                'stats.copies': -1,
                'ratings.average': -1,
                createdAt: -1
            };
        }
        const prompts = await Prompt_1.Prompt.find(filter)
            .populate('creator', 'username email profilePicture isVerified reputation.score')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);
        const total = await Prompt_1.Prompt.countDocuments(filter);
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
        });
    }
    catch (error) {
        console.error('Get prompts error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve prompts']
        });
    }
};
exports.getPrompts = getPrompts;
const getPromptById = async (req, res) => {
    try {
        const { id } = req.params;
        const prompt = await Prompt_1.Prompt.findById(id)
            .populate('creator', 'username email profilePicture isVerified reputation.score');
        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            });
            return;
        }
        if (prompt.privacy === 'private') {
            if (!req.authenticatedUser || prompt.creator._id.toString() !== req.authenticatedUser.userId.toString()) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    errors: ['This prompt is private']
                });
                return;
            }
        }
        if (!req.authenticatedUser || prompt.creator._id.toString() !== req.authenticatedUser.userId.toString()) {
            await prompt.incrementViews();
        }
        res.status(200).json({
            success: true,
            message: 'Prompt retrieved successfully',
            data: {
                prompt
            }
        });
    }
    catch (error) {
        console.error('Get prompt by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve prompt']
        });
    }
};
exports.getPromptById = getPromptById;
const updatePrompt = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const user = await User_1.User.findById(req.authenticatedUser.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found',
                errors: ['Invalid user']
            });
            return;
        }
        const { id } = req.params;
        const updateData = req.body;
        const prompt = await Prompt_1.Prompt.findById(id);
        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            });
            return;
        }
        if (prompt.creator.toString() !== req.authenticatedUser.userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'Access denied',
                errors: ['You can only update your own prompts']
            });
            return;
        }
        if (updateData.isPaid && !user.monetizationUnlocked) {
            res.status(403).json({
                success: false,
                message: 'Monetization not unlocked',
                errors: ['Upgrade account to create paid prompts']
            });
            return;
        }
        const allowedUpdates = [
            'title', 'description', 'promptText', 'proofImages', 'proofType',
            'category', 'tags', 'isPaid', 'price', 'privacy', 'aiPlatform'
        ];
        const filteredUpdateData = {};
        Object.keys(updateData).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdateData[key] = updateData[key];
            }
        });
        if (filteredUpdateData.isPaid === false) {
            filteredUpdateData.price = 0;
        }
        const updatedPrompt = await Prompt_1.Prompt.findByIdAndUpdate(id, filteredUpdateData, { new: true, runValidators: true }).populate('creator', 'username email profilePicture isVerified reputation.score');
        res.status(200).json({
            success: true,
            message: 'Prompt updated successfully',
            data: {
                prompt: updatedPrompt
            }
        });
    }
    catch (error) {
        console.error('Update prompt error:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to update prompt']
        });
    }
};
exports.updatePrompt = updatePrompt;
const deletePrompt = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const { id } = req.params;
        const prompt = await Prompt_1.Prompt.findById(id);
        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            });
            return;
        }
        if (prompt.creator.toString() !== req.authenticatedUser.userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'Access denied',
                errors: ['You can only delete your own prompts']
            });
            return;
        }
        await Prompt_1.Prompt.findByIdAndDelete(id);
        await User_1.User.findByIdAndUpdate(req.authenticatedUser.userId, {
            $inc: { 'stats.totalPrompts': -1 }
        });
        res.status(200).json({
            success: true,
            message: 'Prompt deleted successfully',
            data: {
                deletedPromptId: id
            }
        });
    }
    catch (error) {
        console.error('Delete prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to delete prompt']
        });
    }
};
exports.deletePrompt = deletePrompt;
const copyPrompt = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const { id } = req.params;
        const prompt = await Prompt_1.Prompt.findById(id)
            .populate('creator', 'username');
        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            });
            return;
        }
        if (prompt.privacy === 'private' &&
            prompt.creator._id.toString() !== req.authenticatedUser.userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'Access denied',
                errors: ['This prompt is private']
            });
            return;
        }
        if (prompt.isPaid && prompt.price > 0) {
        }
        const decryptedPrompt = prompt.getDecryptedPrompt();
        await prompt.incrementCopies();
        await User_1.User.findByIdAndUpdate(prompt.creator._id, {
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
        });
    }
    catch (error) {
        console.error('Copy prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to copy prompt']
        });
    }
};
exports.copyPrompt = copyPrompt;
const getMyPrompts = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const { page = 1, limit = 10, privacy, category } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const filter = { creator: req.authenticatedUser.userId };
        if (privacy) {
            filter.privacy = privacy;
        }
        if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }
        const prompts = await Prompt_1.Prompt.find(filter)
            .populate('creator', 'username email profilePicture isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = await Prompt_1.Prompt.countDocuments(filter);
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
        });
    }
    catch (error) {
        console.error('Get my prompts error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve user prompts']
        });
    }
};
exports.getMyPrompts = getMyPrompts;
//# sourceMappingURL=prompt.controller.js.map