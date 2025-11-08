import { Response, Request } from 'express';
import mongoose from 'mongoose';
import { Feedback } from '../models/Feedback';
import { AuthRequest } from '../types/auth.types';

// Submit feedback (public endpoint - no auth required)
export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, subject, message, category } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
                errors: ['Name, email, subject, and message are required']
            });
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Invalid email format',
                errors: ['Please provide a valid email address']
            });
            return;
        }

        // Create feedback
        const feedback = new Feedback({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
            category: category || 'other',
            // If user is authenticated, save userId
            userId: (req as AuthRequest).authenticatedUser?.userId || undefined
        });

        await feedback.save();

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully. Thank you for your input!',
            data: {
                feedbackId: feedback._id
            }
        });
    } catch (error: any) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: error.message
        });
    }
};

// Get all feedback (admin only)
export const getAllFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;
        const category = req.query.category as string;
        const priority = req.query.priority as string;

        const skip = (page - 1) * limit;

        // Build query
        const query: any = {};
        if (status) query.status = status;
        if (category) query.category = category;
        if (priority) query.priority = priority;

        const feedback = await Feedback.find(query)
            .populate('userId', 'username email profilePicture')
            .populate('resolvedBy', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Feedback.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Get stats
        const stats = {
            total: await Feedback.countDocuments(),
            new: await Feedback.countDocuments({ status: 'new' }),
            reviewed: await Feedback.countDocuments({ status: 'reviewed' }),
            resolved: await Feedback.countDocuments({ status: 'resolved' }),
            dismissed: await Feedback.countDocuments({ status: 'dismissed' }),
            high: await Feedback.countDocuments({ priority: 'high' }),
            medium: await Feedback.countDocuments({ priority: 'medium' }),
            low: await Feedback.countDocuments({ priority: 'low' }),
        };

        res.status(200).json({
            success: true,
            data: {
                feedback,
                stats,
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
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback',
            error: error.message
        });
    }
};

// Update feedback status (admin only)
export const updateFeedbackStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { feedbackId } = req.params;
        const { status, priority, adminNotes } = req.body;

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) {
            res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
            return;
        }

        // Update fields
        if (status) feedback.status = status;
        if (priority) feedback.priority = priority;
        if (adminNotes !== undefined) feedback.adminNotes = adminNotes;

        // If marking as resolved
        if (status === 'resolved' && feedback.status !== 'resolved') {
            feedback.resolvedBy = new mongoose.Types.ObjectId(req.authenticatedUser!.userId);
            feedback.resolvedAt = new Date();
        }

        await feedback.save();

        res.status(200).json({
            success: true,
            message: 'Feedback updated successfully',
            data: { feedback }
        });
    } catch (error: any) {
        console.error('Error updating feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update feedback',
            error: error.message
        });
    }
};

// Delete feedback (admin only)
export const deleteFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { feedbackId } = req.params;

        const feedback = await Feedback.findByIdAndDelete(feedbackId);
        if (!feedback) {
            res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Feedback deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete feedback',
            error: error.message
        });
    }
};
