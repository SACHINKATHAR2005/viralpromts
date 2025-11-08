"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityCallController = void 0;
const CommunityCall_1 = require("../models/CommunityCall");
const mongoose_1 = require("mongoose");
class CommunityCallController {
    static async createCall(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { title, description, type, scheduledDate, duration, timezone, category, tags, skillLevel, maxParticipants, requiresApproval, prerequisites, materials, platform, meetingLink, isRecorded, allowChat, allowQA, allowScreenShare, moderatedChat, isPrivate, agenda, showcase, workshop } = req.body;
            if (!title || !description || !type || !scheduledDate || !duration || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, description, type, scheduledDate, duration, and category are required'
                });
            }
            if (new Date(scheduledDate) <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Scheduled date must be in the future'
                });
            }
            const call = new CommunityCall_1.CommunityCall({
                title,
                description,
                type,
                host: userId,
                scheduledDate: new Date(scheduledDate),
                duration,
                timezone: timezone || 'UTC',
                category,
                tags: tags || [],
                skillLevel: skillLevel || 'all',
                maxParticipants,
                requiresApproval: requiresApproval || false,
                prerequisites,
                materials,
                platform: platform || 'zoom',
                meetingLink,
                isRecorded: isRecorded || false,
                allowChat: allowChat !== false,
                allowQA: allowQA !== false,
                allowScreenShare: allowScreenShare || false,
                moderatedChat: moderatedChat || false,
                isPrivate: isPrivate || false,
                agenda: agenda || [],
                showcase: type === 'showcase' ? showcase : undefined,
                workshop: type === 'workshop' ? workshop : undefined
            });
            await call.save();
            await call.populate('host', 'username avatar bio');
            return res.status(201).json({
                success: true,
                message: 'Community call created successfully',
                data: call
            });
        }
        catch (error) {
            console.error('Create call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create community call'
            });
        }
    }
    static async getCalls(req, res) {
        try {
            const { type, category, skillLevel, status = 'scheduled', featured, upcoming = 'true', page = 1, limit = 20, search, sortBy = 'scheduledDate', sortOrder = 'asc' } = req.query;
            const filter = {};
            if (type)
                filter.type = type;
            if (category)
                filter.category = category;
            if (skillLevel)
                filter.skillLevel = skillLevel;
            if (status)
                filter.status = status;
            if (featured !== undefined)
                filter.featured = featured === 'true';
            if (!req.authenticatedUser)
                filter.isPrivate = false;
            if (upcoming === 'true') {
                filter.scheduledDate = { $gte: new Date() };
            }
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
            const [calls, total] = await Promise.all([
                CommunityCall_1.CommunityCall.find(filter)
                    .populate('host', 'username avatar bio')
                    .populate('coHosts', 'username avatar')
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum),
                CommunityCall_1.CommunityCall.countDocuments(filter)
            ]);
            return res.json({
                success: true,
                data: {
                    calls,
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
            console.error('Get calls error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch community calls'
            });
        }
    }
    static async getCall(req, res) {
        try {
            const { callId } = req.params;
            const call = await CommunityCall_1.CommunityCall.findById(callId)
                .populate('host', 'username avatar bio')
                .populate('coHosts', 'username avatar')
                .populate('registeredUsers', 'username avatar')
                .populate('attendees', 'username avatar')
                .populate({
                path: 'feedback.user',
                select: 'username avatar'
            });
            if (!call) {
                return res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }
            if (call.isPrivate && req.authenticatedUser) {
                const userId = req.authenticatedUser.userId;
                if (!call.registeredUsers.some((u) => u._id.toString() === userId) &&
                    !call.isHost(new mongoose_1.Types.ObjectId(userId))) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied to private call'
                    });
                }
            }
            else if (call.isPrivate && !req.authenticatedUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required for private call'
                });
            }
            return res.json({
                success: true,
                data: call
            });
        }
        catch (error) {
            console.error('Get call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch community call'
            });
        }
    }
    static async registerForCall(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { callId } = req.params;
            const call = await CommunityCall_1.CommunityCall.findById(callId);
            if (!call) {
                return res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }
            if (call.status !== 'scheduled') {
                return res.status(400).json({
                    success: false,
                    message: 'Registration is closed for this call'
                });
            }
            if (call.scheduledDate <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot register for past calls'
                });
            }
            try {
                const result = await call.registerUser(new mongoose_1.Types.ObjectId(userId));
                await call.save();
                return res.json({
                    success: true,
                    message: result.status === 'registered' ?
                        'Successfully registered for call' :
                        'Added to waitlist',
                    data: { status: result.status }
                });
            }
            catch (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
        catch (error) {
            console.error('Register for call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to register for call'
            });
        }
    }
    static async unregisterFromCall(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { callId } = req.params;
            const call = await CommunityCall_1.CommunityCall.findById(callId);
            if (!call) {
                return res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }
            await call.unregisterUser(new mongoose_1.Types.ObjectId(userId));
            return res.json({
                success: true,
                message: 'Successfully unregistered from call'
            });
        }
        catch (error) {
            console.error('Unregister from call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to unregister from call'
            });
        }
    }
    static async markAttendance(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { callId } = req.params;
            const { attendeeId } = req.body;
            const call = await CommunityCall_1.CommunityCall.findById(callId);
            if (!call) {
                return res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }
            if (!call.isHost(new mongoose_1.Types.ObjectId(userId))) {
                return res.status(403).json({
                    success: false,
                    message: 'Only hosts can mark attendance'
                });
            }
            await call.markAttendance(attendeeId);
            return res.json({
                success: true,
                message: 'Attendance marked successfully'
            });
        }
        catch (error) {
            console.error('Mark attendance error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to mark attendance'
            });
        }
    }
    static async addFeedback(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { callId } = req.params;
            const { rating, comment, wouldRecommend } = req.body;
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }
            const call = await CommunityCall_1.CommunityCall.findById(callId);
            if (!call) {
                return res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }
            if (call.status !== 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Can only provide feedback for completed calls'
                });
            }
            if (!call.attendees?.includes(new mongoose_1.Types.ObjectId(userId))) {
                return res.status(403).json({
                    success: false,
                    message: 'Only attendees can provide feedback'
                });
            }
            await call.addFeedback(new mongoose_1.Types.ObjectId(userId), rating, comment, wouldRecommend !== false);
            return res.json({
                success: true,
                message: 'Feedback added successfully'
            });
        }
        catch (error) {
            console.error('Add feedback error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to add feedback'
            });
        }
    }
    static async updateCall(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { callId } = req.params;
            const call = await CommunityCall_1.CommunityCall.findById(callId);
            if (!call) {
                return res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }
            if (!call.host.equals(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the host can update the call'
                });
            }
            const allowedUpdates = [
                'title', 'description', 'scheduledDate', 'duration', 'timezone',
                'category', 'tags', 'skillLevel', 'maxParticipants', 'requiresApproval',
                'prerequisites', 'materials', 'platform', 'meetingLink', 'meetingId',
                'password', 'isRecorded', 'allowChat', 'allowQA', 'allowScreenShare',
                'moderatedChat', 'agenda', 'showcase', 'workshop', 'status'
            ];
            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) {
                    call[field] = req.body[field];
                }
            });
            await call.save();
            return res.json({
                success: true,
                message: 'Call updated successfully',
                data: call
            });
        }
        catch (error) {
            console.error('Update call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update call'
            });
        }
    }
    static async cancelCall(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { callId } = req.params;
            const { reason } = req.body;
            const call = await CommunityCall_1.CommunityCall.findById(callId);
            if (!call) {
                return res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }
            if (!call.host.equals(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the host can cancel the call'
                });
            }
            call.status = 'cancelled';
            await call.save();
            return res.json({
                success: true,
                message: 'Call cancelled successfully'
            });
        }
        catch (error) {
            console.error('Cancel call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to cancel call'
            });
        }
    }
    static async getUserCalls(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { type = 'all' } = req.query;
            let filter = {};
            switch (type) {
                case 'hosted':
                    filter.$or = [
                        { host: userId },
                        { coHosts: userId }
                    ];
                    break;
                case 'registered':
                    filter.registeredUsers = userId;
                    break;
                case 'attended':
                    filter.attendees = userId;
                    break;
                default:
                    filter.$or = [
                        { host: userId },
                        { coHosts: userId },
                        { registeredUsers: userId },
                        { attendees: userId }
                    ];
            }
            const calls = await CommunityCall_1.CommunityCall.find(filter)
                .populate('host', 'username avatar')
                .populate('coHosts', 'username avatar')
                .sort({ scheduledDate: -1 });
            return res.json({
                success: true,
                data: calls
            });
        }
        catch (error) {
            console.error('Get user calls error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch user calls'
            });
        }
    }
    static async startCall(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { callId } = req.params;
            const call = await CommunityCall_1.CommunityCall.findById(callId);
            if (!call) {
                return res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }
            if (!call.isHost(new mongoose_1.Types.ObjectId(userId))) {
                return res.status(403).json({
                    success: false,
                    message: 'Only hosts can start the call'
                });
            }
            if (call.status !== 'scheduled') {
                return res.status(400).json({
                    success: false,
                    message: 'Call cannot be started'
                });
            }
            call.status = 'live';
            await call.save();
            return res.json({
                success: true,
                message: 'Call started successfully'
            });
        }
        catch (error) {
            console.error('Start call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to start call'
            });
        }
    }
    static async endCall(req, res) {
        try {
            const userId = req.authenticatedUser.userId;
            const { callId } = req.params;
            const { recordingUrl } = req.body;
            const call = await CommunityCall_1.CommunityCall.findById(callId);
            if (!call) {
                return res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }
            if (!call.isHost(new mongoose_1.Types.ObjectId(userId))) {
                return res.status(403).json({
                    success: false,
                    message: 'Only hosts can end the call'
                });
            }
            if (call.status !== 'live') {
                return res.status(400).json({
                    success: false,
                    message: 'Call is not currently live'
                });
            }
            call.status = 'completed';
            if (recordingUrl) {
                call.recordingUrl = recordingUrl;
            }
            if (call.attendees && call.registeredUsers.length > 0) {
                call.stats.completionRate = (call.attendees.length / call.registeredUsers.length) * 100;
            }
            await call.save();
            return res.json({
                success: true,
                message: 'Call ended successfully'
            });
        }
        catch (error) {
            console.error('End call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to end call'
            });
        }
    }
}
exports.CommunityCallController = CommunityCallController;
//# sourceMappingURL=communityCall.controller.js.map