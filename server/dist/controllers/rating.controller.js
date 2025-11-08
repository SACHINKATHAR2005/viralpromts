"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markReviewHelpful = exports.deleteRating = exports.getPromptRatings = exports.updateRating = exports.ratePrompt = void 0;
const Rating_1 = require("../models/Rating");
const Prompt_1 = require("../models/Prompt");
const ratePrompt = async (req, res) => {
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
        const { rating, review } = req.body;
        const userId = req.authenticatedUser.userId;
        if (!rating || rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
            res.status(400).json({
                success: false,
                message: 'Invalid rating',
                errors: ['Rating must be a whole number between 1 and 5']
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
        const existingRating = await Rating_1.Rating.findOne({ user: userId, prompt: promptId });
        if (existingRating) {
            res.status(400).json({
                success: false,
                message: 'Already rated',
                errors: ['You have already rated this prompt']
            });
            return;
        }
        const newRating = new Rating_1.Rating({
            user: userId,
            prompt: promptId,
            rating: Number(rating),
            review: review?.trim() || ''
        });
        await newRating.save();
        const ratings = await Rating_1.Rating.find({ prompt: promptId });
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        const totalRatings = ratings.length;
        await Prompt_1.Prompt.findByIdAndUpdate(promptId, {
            'stats.averageRating': Math.round(averageRating * 100) / 100,
            'stats.totalRatings': totalRatings
        });
        const populatedRating = await Rating_1.Rating.findById(newRating._id)
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
        });
    }
    catch (error) {
        console.error('Rate prompt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to rate prompt']
        });
    }
};
exports.ratePrompt = ratePrompt;
const updateRating = async (req, res) => {
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
        const { rating, review } = req.body;
        const userId = req.authenticatedUser.userId;
        if (rating && (rating < 1 || rating > 5 || !Number.isInteger(Number(rating)))) {
            res.status(400).json({
                success: false,
                message: 'Invalid rating',
                errors: ['Rating must be a whole number between 1 and 5']
            });
            return;
        }
        const existingRating = await Rating_1.Rating.findOne({ user: userId, prompt: promptId });
        if (!existingRating) {
            res.status(404).json({
                success: false,
                message: 'Rating not found',
                errors: ['You have not rated this prompt yet']
            });
            return;
        }
        if (rating)
            existingRating.rating = Number(rating);
        if (review !== undefined)
            existingRating.review = review.trim();
        await existingRating.save();
        const ratings = await Rating_1.Rating.find({ prompt: promptId });
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        const totalRatings = ratings.length;
        await Prompt_1.Prompt.findByIdAndUpdate(promptId, {
            'stats.averageRating': Math.round(averageRating * 100) / 100,
            'stats.totalRatings': totalRatings
        });
        const populatedRating = await Rating_1.Rating.findById(existingRating._id)
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
        });
    }
    catch (error) {
        console.error('Update rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to update rating']
        });
    }
};
exports.updateRating = updateRating;
const getPromptRatings = async (req, res) => {
    try {
        const { promptId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder;
        const ratings = await Rating_1.Rating.find({ prompt: promptId })
            .populate('user', 'username profilePicture isVerified')
            .sort(sort)
            .skip(skip)
            .limit(limit);
        const totalRatings = await Rating_1.Rating.countDocuments({ prompt: promptId });
        const ratingDistribution = await Rating_1.Rating.aggregate([
            { $match: { prompt: promptId } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);
        const avgRatingResult = await Rating_1.Rating.aggregate([
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
        });
    }
    catch (error) {
        console.error('Get ratings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve ratings']
        });
    }
};
exports.getPromptRatings = getPromptRatings;
const deleteRating = async (req, res) => {
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
        const rating = await Rating_1.Rating.findOneAndDelete({ user: userId, prompt: promptId });
        if (!rating) {
            res.status(404).json({
                success: false,
                message: 'Rating not found',
                errors: ['You have not rated this prompt']
            });
            return;
        }
        const ratings = await Rating_1.Rating.find({ prompt: promptId });
        const averageRating = ratings.length > 0 ?
            ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
        const totalRatings = ratings.length;
        await Prompt_1.Prompt.findByIdAndUpdate(promptId, {
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
        });
    }
    catch (error) {
        console.error('Delete rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to delete rating']
        });
    }
};
exports.deleteRating = deleteRating;
const markReviewHelpful = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            });
            return;
        }
        const { ratingId } = req.params;
        const rating = await Rating_1.Rating.findById(ratingId);
        if (!rating) {
            res.status(404).json({
                success: false,
                message: 'Rating not found',
                errors: ['Rating does not exist']
            });
            return;
        }
        rating.helpfulVotes += 1;
        await rating.save();
        res.status(200).json({
            success: true,
            message: 'Review marked as helpful',
            data: { helpfulVotes: rating.helpfulVotes }
        });
    }
    catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to mark review as helpful']
        });
    }
};
exports.markReviewHelpful = markReviewHelpful;
//# sourceMappingURL=rating.controller.js.map