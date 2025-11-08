"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePrompt = exports.unfollowUser = exports.followUser = exports.getComments = exports.addComment = exports.unlikePrompt = exports.likePrompt = void 0;
const models_1 = require("../models");
const User_1 = require("../models/User");
const Prompt_1 = require("../models/Prompt");
const likePrompt = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const { promptId } = req.params;
        const userId = req.authenticatedUser.userId;
        const prompt = await Prompt_1.Prompt.findById(promptId);
        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            });
            return;
        }
        const existingLike = await models_1.Like.findOne({ user: userId, prompt: promptId });
        if (existingLike) {
            res.status(400).json({
                success: false,
                message: 'Already liked',
                errors: ['You have already liked this prompt']
            });
            return;
        }
        const like = new models_1.Like({
            user: userId,
            prompt: promptId
        });
        await like.save();
        await Prompt_1.Prompt.findByIdAndUpdate(promptId, {
            $inc: { 'stats.totalLikes': 1 }
        });
        res.status(201).json({
            success: true,
            message: 'Prompt liked successfully',
            data: { like }
        });
    }
    catch (error) {
        console.error('Like prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to like prompt']
        });
    }
};
exports.likePrompt = likePrompt;
const unlikePrompt = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const { promptId } = req.params;
        const userId = req.authenticatedUser.userId;
        const like = await models_1.Like.findOneAndDelete({ user: userId, prompt: promptId });
        if (!like) {
            res.status(404).json({
                success: false,
                message: 'Like not found',
                errors: ['You have not liked this prompt']
            });
            return;
        }
        await Prompt_1.Prompt.findByIdAndUpdate(promptId, {
            $inc: { 'stats.totalLikes': -1 }
        });
        res.status(200).json({
            success: true,
            message: 'Prompt unliked successfully'
        });
    }
    catch (error) {
        console.error('Unlike prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to unlike prompt']
        });
    }
};
exports.unlikePrompt = unlikePrompt;
const addComment = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const { promptId } = req.params;
        const { content, parentComment } = req.body;
        const userId = req.authenticatedUser.userId;
        if (!content || content.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: 'Invalid input',
                errors: ['Comment content is required']
            });
            return;
        }
        const prompt = await Prompt_1.Prompt.findById(promptId);
        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            });
            return;
        }
        if (parentComment) {
            const parentCommentDoc = await models_1.Comment.findById(parentComment);
            if (!parentCommentDoc) {
                res.status(404).json({
                    success: false,
                    message: 'Parent comment not found',
                    errors: ['Parent comment does not exist']
                });
                return;
            }
        }
        const comment = new models_1.Comment({
            user: userId,
            prompt: promptId,
            content: content.trim(),
            parentComment: parentComment || null
        });
        await comment.save();
        await Prompt_1.Prompt.findByIdAndUpdate(promptId, {
            $inc: { 'stats.totalComments': 1 }
        });
        const populatedComment = await models_1.Comment.findById(comment._id)
            .populate('user', 'username profilePicture isVerified');
        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: { comment: populatedComment }
        });
    }
    catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to add comment']
        });
    }
};
exports.addComment = addComment;
const getComments = async (req, res) => {
    try {
        const { promptId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const skip = (page - 1) * limit;
        const comments = await models_1.Comment.find({
            prompt: promptId,
            parentComment: null,
            isDeleted: false
        })
            .populate('user', 'username profilePicture isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
            const replies = await models_1.Comment.find({
                parentComment: comment._id,
                isDeleted: false
            })
                .populate('user', 'username profilePicture isVerified')
                .sort({ createdAt: 1 })
                .limit(5);
            return {
                ...comment.toJSON(),
                replies,
                repliesCount: await models_1.Comment.countDocuments({
                    parentComment: comment._id,
                    isDeleted: false
                })
            };
        }));
        const totalComments = await models_1.Comment.countDocuments({
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
        });
    }
    catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve comments']
        });
    }
};
exports.getComments = getComments;
const followUser = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const { userId: targetUserId } = req.params;
        const followerId = req.authenticatedUser.userId;
        if (followerId === targetUserId) {
            res.status(400).json({
                success: false,
                message: 'Invalid action',
                errors: ['You cannot follow yourself']
            });
            return;
        }
        const targetUser = await User_1.User.findById(targetUserId);
        if (!targetUser) {
            res.status(404).json({
                success: false,
                message: 'User not found',
                errors: ['User does not exist']
            });
            return;
        }
        const existingFollow = await models_1.Follow.findOne({
            follower: followerId,
            following: targetUserId
        });
        if (existingFollow) {
            res.status(400).json({
                success: false,
                message: 'Already following',
                errors: ['You are already following this user']
            });
            return;
        }
        const follow = new models_1.Follow({
            follower: followerId,
            following: targetUserId
        });
        await follow.save();
        await User_1.User.findByIdAndUpdate(targetUserId, {
            $inc: { 'stats.followersCount': 1 }
        });
        await User_1.User.findByIdAndUpdate(followerId, {
            $inc: { 'stats.followingCount': 1 }
        });
        res.status(201).json({
            success: true,
            message: 'User followed successfully',
            data: { follow }
        });
    }
    catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to follow user']
        });
    }
};
exports.followUser = followUser;
const unfollowUser = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const { userId: targetUserId } = req.params;
        const followerId = req.authenticatedUser.userId;
        const follow = await models_1.Follow.findOneAndDelete({
            follower: followerId,
            following: targetUserId
        });
        if (!follow) {
            res.status(404).json({
                success: false,
                message: 'Follow relationship not found',
                errors: ['You are not following this user']
            });
            return;
        }
        await User_1.User.findByIdAndUpdate(targetUserId, {
            $inc: { 'stats.followersCount': -1 }
        });
        await User_1.User.findByIdAndUpdate(followerId, {
            $inc: { 'stats.followingCount': -1 }
        });
        res.status(200).json({
            success: true,
            message: 'User unfollowed successfully'
        });
    }
    catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to unfollow user']
        });
    }
};
exports.unfollowUser = unfollowUser;
const savePrompt = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const { promptId } = req.params;
        const { collectionName, notes } = req.body;
        const userId = req.authenticatedUser.userId;
        const prompt = await Prompt_1.Prompt.findById(promptId);
        if (!prompt) {
            res.status(404).json({
                success: false,
                message: 'Prompt not found',
                errors: ['Prompt does not exist']
            });
            return;
        }
        const existingSave = await models_1.SavedPrompt.findOne({
            user: userId,
            prompt: promptId,
            collectionName: collectionName || 'Saved'
        });
        if (existingSave) {
            res.status(400).json({
                success: false,
                message: 'Already saved',
                errors: ['Prompt is already saved to this collection']
            });
            return;
        }
        const savedPrompt = new models_1.SavedPrompt({
            user: userId,
            prompt: promptId,
            collectionName: collectionName || 'Saved',
            notes: notes || ''
        });
        await savedPrompt.save();
        await Prompt_1.Prompt.findByIdAndUpdate(promptId, {
            $inc: { 'stats.totalCopies': 1 }
        });
        await User_1.User.findByIdAndUpdate(userId, {
            $inc: { 'stats.totalCopies': 1 }
        });
        res.status(201).json({
            success: true,
            message: 'Prompt saved successfully',
            data: { savedPrompt }
        });
    }
    catch (error) {
        console.error('Save prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to save prompt']
        });
    }
};
exports.savePrompt = savePrompt;
//# sourceMappingURL=social.controller.js.map