import { Request, Response } from 'express';
import { CommunityCall } from '../models/CommunityCall';
import { User } from '../models/User';
import { AuthRequest } from '../types/auth.types';
import { Types } from 'mongoose';

export class CommunityCallController {
    // Create a new community call
    static async createCall(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;

            const {
                title,
                description,
                type,
                scheduledDate,
                duration,
                timezone,
                category,
                tags,
                skillLevel,
                maxParticipants,
                requiresApproval,
                prerequisites,
                materials,
                platform,
                meetingLink,
                isRecorded,
                allowChat,
                allowQA,
                allowScreenShare,
                moderatedChat,
                isPrivate,
                agenda,
                showcase,
                workshop
            } = req.body;

            // Validate required fields
            if (!title || !description || !type || !scheduledDate || !duration || !category) {
                return  res.status(400).json({
                    success: false,
                    message: 'Title, description, type, scheduledDate, duration, and category are required'
                });
            }

            // Validate scheduled date is in future
            if (new Date(scheduledDate) <= new Date()) {
                return  res.status(400).json({
                    success: false,
                    message: 'Scheduled date must be in the future'
                });
            }

            // Create community call
            const call = new CommunityCall({
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

            // Populate host info
            await call.populate('host', 'username avatar bio');

            return res.status(201).json({
                success: true,
                message: 'Community call created successfully',
                data: call
            });
        } catch (error) {
            console.error('Create call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create community call'
            });
        }
    }

    // Get all community calls with filters
    static async getCalls(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const {
                type,
                category,
                skillLevel,
                status = 'scheduled',
                featured,
                upcoming = 'true',
                page = 1,
                limit = 20,
                search,
                sortBy = 'scheduledDate',
                sortOrder = 'asc'
            } = req.query;

            // Build filter
            const filter: any = {};

            if (type) filter.type = type;
            if (category) filter.category = category;
            if (skillLevel) filter.skillLevel = skillLevel;
            if (status) filter.status = status;
            if (featured !== undefined) filter.featured = featured === 'true';
            if (!req.authenticatedUser) filter.isPrivate = false; // Only show public calls to non-authenticated users

            // Filter for upcoming calls
            if (upcoming === 'true') {
                filter.scheduledDate = { $gte: new Date() };
            }

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

            const [calls, total] = await Promise.all([
                CommunityCall.find(filter)
                    .populate('host', 'username avatar bio')
                    .populate('coHosts', 'username avatar')
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum),
                CommunityCall.countDocuments(filter)
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
        } catch (error) {
            console.error('Get calls error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch community calls'
            });
        }
    }

    // Get single community call
    static async getCall(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { callId } = req.params;

            const call = await CommunityCall.findById(callId)
                .populate('host', 'username avatar bio')
                .populate('coHosts', 'username avatar')
                .populate('registeredUsers', 'username avatar')
                .populate('attendees', 'username avatar')
                .populate({
                    path: 'feedback.user',
                    select: 'username avatar'
                });

            if (!call) {
                return  res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }

            // Check if user has access to private call
            if (call.isPrivate && req.authenticatedUser) {
                const userId = req.authenticatedUser.userId;
                if (!call.registeredUsers.some((u: any) => u._id.toString() === userId) &&
                    !call.isHost(new Types.ObjectId(userId))) {
                    return  res.status(403).json({
                        success: false,
                        message: 'Access denied to private call'
                    });
                }
            } else if (call.isPrivate && !req.authenticatedUser) {
                return  res.status(401).json({
                    success: false,
                    message: 'Authentication required for private call'
                });
            }

            return res.json({
                success: true,
                data: call
            });
        } catch (error) {
            console.error('Get call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch community call'
            });
        }
    }

    // Register for a community call
    static async registerForCall(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { callId } = req.params;

            const call = await CommunityCall.findById(callId);
            if (!call) {
                return  res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }

            // Check if call is still open for registration
            if (call.status !== 'scheduled') {
                return  res.status(400).json({
                    success: false,
                    message: 'Registration is closed for this call'
                });
            }

            // Check if call is in the future
            if (call.scheduledDate <= new Date()) {
                return  res.status(400).json({
                    success: false,
                    message: 'Cannot register for past calls'
                });
            }

            try {
                const result = await call.registerUser(new Types.ObjectId(userId));
                await call.save();

                return res.json({
                    success: true,
                    message: result.status === 'registered' ?
                        'Successfully registered for call' :
                        'Added to waitlist',
                    data: { status: result.status }
                });
            } catch (error: any) {
                return  res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        } catch (error) {
            console.error('Register for call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to register for call'
            });
        }
    }

    // Unregister from a community call
    static async unregisterFromCall(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { callId } = req.params;

            const call = await CommunityCall.findById(callId);
            if (!call) {
                return  res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }

            await call.unregisterUser(new Types.ObjectId(userId));

            return res.json({
                success: true,
                message: 'Successfully unregistered from call'
            });
        } catch (error) {
            console.error('Unregister from call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to unregister from call'
            });
        }
    }

    // Mark attendance (host/co-host only)
    static async markAttendance(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { callId } = req.params;
            const { attendeeId } = req.body;

            const call = await CommunityCall.findById(callId);
            if (!call) {
                return  res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }

            // Check if user is host or co-host
            if (!call.isHost(new Types.ObjectId(userId))) {
                return  res.status(403).json({
                    success: false,
                    message: 'Only hosts can mark attendance'
                });
            }

            await call.markAttendance(attendeeId);

            return res.json({
                success: true,
                message: 'Attendance marked successfully'
            });
        } catch (error) {
            console.error('Mark attendance error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to mark attendance'
            });
        }
    }

    // Add feedback for a call
    static async addFeedback(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { callId } = req.params;
            const { rating, comment, wouldRecommend } = req.body;

            if (!rating || rating < 1 || rating > 5) {
                return  res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }

            const call = await CommunityCall.findById(callId);
            if (!call) {
                return  res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }

            // Check if call is completed
            if (call.status !== 'completed') {
                return  res.status(400).json({
                    success: false,
                    message: 'Can only provide feedback for completed calls'
                });
            }

            // Check if user attended the call
            if (!call.attendees?.includes(new Types.ObjectId(userId))) {
                return  res.status(403).json({
                    success: false,
                    message: 'Only attendees can provide feedback'
                });
            }

            await call.addFeedback(new Types.ObjectId(userId), rating, comment, wouldRecommend !== false);

            return res.json({
                success: true,
                message: 'Feedback added successfully'
            });
        } catch (error) {
            console.error('Add feedback error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to add feedback'
            });
        }
    }

    // Update call (host only)
    static async updateCall(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { callId } = req.params;

            const call = await CommunityCall.findById(callId);
            if (!call) {
                return  res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }

            // Check if user is host
            if (!call.host.equals(userId)) {
                return  res.status(403).json({
                    success: false,
                    message: 'Only the host can update the call'
                });
            }

            // Update allowed fields
            const allowedUpdates = [
                'title', 'description', 'scheduledDate', 'duration', 'timezone',
                'category', 'tags', 'skillLevel', 'maxParticipants', 'requiresApproval',
                'prerequisites', 'materials', 'platform', 'meetingLink', 'meetingId',
                'password', 'isRecorded', 'allowChat', 'allowQA', 'allowScreenShare',
                'moderatedChat', 'agenda', 'showcase', 'workshop', 'status'
            ];

            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) {
                    (call as any)[field] = req.body[field];
                }
            });

            await call.save();

            return res.json({
                success: true,
                message: 'Call updated successfully',
                data: call
            });
        } catch (error) {
            console.error('Update call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update call'
            });
        }
    }

    // Cancel call (host only)
    static async cancelCall(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { callId } = req.params;
            const { reason } = req.body;

            const call = await CommunityCall.findById(callId);
            if (!call) {
                return  res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }

            // Check if user is host
            if (!call.host.equals(userId)) {
                return  res.status(403).json({
                    success: false,
                    message: 'Only the host can cancel the call'
                });
            }

            call.status = 'cancelled';
            await call.save();

            // TODO: Send notifications to registered users about cancellation

            return res.json({
                success: true,
                message: 'Call cancelled successfully'
            });
        } catch (error) {
            console.error('Cancel call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to cancel call'
            });
        }
    }

    // Get user's calls
    static async getUserCalls(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { type = 'all' } = req.query; // 'hosted', 'registered', 'attended', 'all'

            let filter: any = {};

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

            const calls = await CommunityCall.find(filter)
                .populate('host', 'username avatar')
                .populate('coHosts', 'username avatar')
                .sort({ scheduledDate: -1 });

            return res.json({
                success: true,
                data: calls
            });
        } catch (error) {
            console.error('Get user calls error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch user calls'
            });
        }
    }

    // Start call (host only) - Updates status to 'live'
    static async startCall(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { callId } = req.params;

            const call = await CommunityCall.findById(callId);
            if (!call) {
                return  res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }

            // Check if user is host
            if (!call.isHost(new Types.ObjectId(userId))) {
                return  res.status(403).json({
                    success: false,
                    message: 'Only hosts can start the call'
                });
            }

            if (call.status !== 'scheduled') {
                return  res.status(400).json({
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
        } catch (error) {
            console.error('Start call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to start call'
            });
        }
    }

    // End call (host only) - Updates status to 'completed'
    static async endCall(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.authenticatedUser!.userId;
            const { callId } = req.params;
            const { recordingUrl } = req.body;

            const call = await CommunityCall.findById(callId);
            if (!call) {
                return  res.status(404).json({
                    success: false,
                    message: 'Community call not found'
                });
            }

            // Check if user is host
            if (!call.isHost(new Types.ObjectId(userId))) {
                return  res.status(403).json({
                    success: false,
                    message: 'Only hosts can end the call'
                });
            }

            if (call.status !== 'live') {
                return  res.status(400).json({
                    success: false,
                    message: 'Call is not currently live'
                });
            }

            call.status = 'completed';
            if (recordingUrl) {
                call.recordingUrl = recordingUrl;
            }

            // Calculate completion rate if attendees data is available
            if (call.attendees && call.registeredUsers.length > 0) {
                call.stats.completionRate = (call.attendees.length / call.registeredUsers.length) * 100;
            }

            await call.save();

            return res.json({
                success: true,
                message: 'Call ended successfully'
            });
        } catch (error) {
            console.error('End call error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to end call'
            });
        }
    }
}
