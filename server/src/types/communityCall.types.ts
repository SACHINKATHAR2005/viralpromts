import { Types, Document } from 'mongoose';

export interface ICommunityCall {
    title: string;
    description: string;
    type: 'live_session' | 'expert_qa' | 'showcase' | 'workshop' | 'networking';
    host: Types.ObjectId;
    coHosts: Types.ObjectId[];
    scheduledDate: Date;
    duration: number;
    timezone: string;
    meetingLink?: string;
    meetingId?: string;
    password?: string;
    platform: 'zoom' | 'google_meet' | 'teams' | 'discord' | 'other';
    maxParticipants?: number;
    registeredUsers: Types.ObjectId[];
    attendees?: Types.ObjectId[];
    waitlist: Types.ObjectId[];
    agenda: Array<{
        item: string;
        duration: number;
        speaker?: Types.ObjectId;
    }>;
    tags: string[];
    category: string;
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
    requiresApproval: boolean;
    prerequisites?: string;
    materials?: string;
    isRecorded: boolean;
    recordingUrl?: string;
    resources: Array<{
        title: string;
        url: string;
        type: 'document' | 'video' | 'link' | 'prompt';
    }>;
    allowChat: boolean;
    allowQA: boolean;
    allowScreenShare: boolean;
    moderatedChat: boolean;
    showcase?: {
        presenters: Array<{
            user: Types.ObjectId;
            promptId?: Types.ObjectId;
            timeSlot: number;
            topic: string;
        }>;
        votingEnabled: boolean;
        prizes?: string[];
    };
    workshop?: {
        instructor?: Types.ObjectId;
        curriculum: string[];
        exercises: Array<{
            title: string;
            description: string;
            timeAllotted: number;
        }>;
        certificateOffered: boolean;
    };
    stats: {
        registrationCount: number;
        attendanceCount: number;
        averageRating: number;
        totalRatings: number;
        completionRate: number;
    };
    feedback: Array<{
        user: Types.ObjectId;
        rating: number;
        comment?: string;
        wouldRecommend: boolean;
        createdAt: Date;
    }>;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'postponed';
    isPrivate: boolean;
    featured: boolean;
    recurring?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        endDate?: Date;
        daysOfWeek?: number[];
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface ICommunityCallMethods {
    registerUser(userId: Types.ObjectId): Promise<{ status: 'registered' | 'waitlisted' }>;
    unregisterUser(userId: Types.ObjectId): Promise<ICommunityCallDocument>;
    markAttendance(userId: Types.ObjectId): Promise<ICommunityCallDocument>;
    addFeedback(userId: Types.ObjectId, rating: number, comment?: string, wouldRecommend?: boolean): Promise<ICommunityCallDocument>;
    canUserJoin(userId: Types.ObjectId): boolean;
    isHost(userId: Types.ObjectId): boolean;
}

export interface ICommunityCallStatics { }

export interface ICommunityCallDocument extends ICommunityCall, ICommunityCallMethods, Document { }