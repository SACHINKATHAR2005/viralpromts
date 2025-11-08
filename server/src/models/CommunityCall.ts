import mongoose, { Schema, model } from 'mongoose';
import { ICommunityCall, ICommunityCallDocument, ICommunityCallMethods, ICommunityCallStatics } from '../types/communityCall.types';
import { Types } from 'mongoose';

// Create interface that extends Document with our methods
interface ICommunityCallModel extends mongoose.Model<ICommunityCallDocument>, ICommunityCallStatics { }

// Community Call Schema

const communityCallSchema = new Schema<ICommunityCallDocument>({
    title: {
        type: String,
        required: [true, 'Call title is required'],
        trim: true,
        maxlength: [150, 'Title cannot exceed 150 characters']
    },

    description: {
        type: String,
        required: [true, 'Call description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    type: {
        type: String,
        enum: ['live_session', 'expert_qa', 'showcase', 'workshop', 'networking'],
        required: true
    },

    host: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    coHosts: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],

    scheduledDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (date: Date) {
                return date > new Date();
            },
            message: 'Scheduled date must be in the future'
        }
    },

    duration: {
        type: Number,
        required: true,
        min: [15, 'Duration must be at least 15 minutes'],
        max: [480, 'Duration cannot exceed 8 hours']
    },

    timezone: {
        type: String,
        required: true,
        default: 'UTC'
    },

    meetingLink: String,
    meetingId: String,
    password: String,

    platform: {
        type: String,
        enum: ['zoom', 'google_meet', 'teams', 'discord', 'other'],
        default: 'zoom'
    },

    maxParticipants: {
        type: Number,
        min: 1,
        max: 1000
    },

    registeredUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],

    attendees: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],

    waitlist: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],

    agenda: [{
        item: {
            type: String,
            required: true,
            maxlength: 200
        },
        duration: {
            type: Number,
            required: true,
            min: 1
        },
        speaker: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],

    category: {
        type: String,
        required: true,
        trim: true
    },

    skillLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'all'],
        default: 'all'
    },

    requiresApproval: {
        type: Boolean,
        default: false
    },

    prerequisites: String,
    materials: String,

    isRecorded: {
        type: Boolean,
        default: false
    },

    recordingUrl: String,

    resources: [{
        title: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['document', 'video', 'link', 'prompt'],
            required: true
        }
    }],

    allowChat: {
        type: Boolean,
        default: true
    },

    allowQA: {
        type: Boolean,
        default: true
    },

    allowScreenShare: {
        type: Boolean,
        default: false
    },

    moderatedChat: {
        type: Boolean,
        default: false
    },

    // Showcase settings
    showcase: {
        presenters: [{
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            promptId: {
                type: Schema.Types.ObjectId,
                ref: 'Prompt'
            },
            timeSlot: {
                type: Number,
                required: true,
                min: 3,
                max: 30
            },
            topic: {
                type: String,
                required: true,
                maxlength: 100
            }
        }],
        votingEnabled: {
            type: Boolean,
            default: false
        },
        prizes: [String]
    },

    // Workshop settings
    workshop: {
        instructor: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        curriculum: [String],
        exercises: [{
            title: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            timeAllotted: {
                type: Number,
                required: true,
                min: 5
            }
        }],
        certificateOffered: {
            type: Boolean,
            default: false
        }
    },

    stats: {
        registrationCount: {
            type: Number,
            default: 0
        },
        attendanceCount: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },

    feedback: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            maxlength: 500
        },
        wouldRecommend: {
            type: Boolean,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    status: {
        type: String,
        enum: ['scheduled', 'live', 'completed', 'cancelled', 'postponed'],
        default: 'scheduled'
    },

    isPrivate: {
        type: Boolean,
        default: false
    },

    featured: {
        type: Boolean,
        default: false
    },

    recurring: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly']
        },
        endDate: Date,
        daysOfWeek: [{
            type: Number,
            min: 0,
            max: 6
        }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
communityCallSchema.index({ host: 1 });
communityCallSchema.index({ scheduledDate: 1 });
communityCallSchema.index({ type: 1, status: 1 });
communityCallSchema.index({ category: 1 });
communityCallSchema.index({ tags: 1 });
communityCallSchema.index({ featured: 1, status: 1 });
communityCallSchema.index({ skillLevel: 1 });

// Virtual for registration count
communityCallSchema.virtual('registrationCount').get(function () {
    return this.registeredUsers.length;
});

// Virtual for spots available
communityCallSchema.virtual('spotsAvailable').get(function () {
    if (!this.maxParticipants) return Infinity;
    return Math.max(0, this.maxParticipants - this.registeredUsers.length);
});

// Virtual for is full
communityCallSchema.virtual('isFull').get(function () {
    if (!this.maxParticipants) return false;
    return this.registeredUsers.length >= this.maxParticipants;
});

// Methods
communityCallSchema.methods.registerUser = function (userId: Types.ObjectId) {
    if (this.registeredUsers.includes(userId)) {
        throw new Error('User already registered');
    }

    if (this.isFull) {
        this.waitlist.push(userId);
        return { status: 'waitlisted' };
    }

    this.registeredUsers.push(userId);
    this.stats.registrationCount = this.registeredUsers.length;
    return { status: 'registered' };
};

communityCallSchema.methods.unregisterUser = function (userId: Types.ObjectId) {
    // Remove from registered users
    this.registeredUsers = this.registeredUsers.filter((id: Types.ObjectId) => !id.equals(userId));

    // Remove from waitlist
    this.waitlist = this.waitlist.filter((id: Types.ObjectId) => !id.equals(userId));

    // Move someone from waitlist to registered if there's space
    if (this.waitlist.length > 0 && (!this.maxParticipants || this.registeredUsers.length < this.maxParticipants)) {
        const nextUser = this.waitlist.shift();
        this.registeredUsers.push(nextUser!);
    }

    this.stats.registrationCount = this.registeredUsers.length;
    return this.save();
};

communityCallSchema.methods.markAttendance = function (userId: Types.ObjectId) {
    if (!this.attendees) this.attendees = [];
    if (!this.attendees.includes(userId) && this.registeredUsers.includes(userId)) {
        this.attendees.push(userId);
        this.stats.attendanceCount = this.attendees.length;
    }
    return this.save();
};

communityCallSchema.methods.addFeedback = function (userId: Types.ObjectId, rating: number, comment?: string, wouldRecommend: boolean = true) {
    // Remove existing feedback from this user
    this.feedback = this.feedback.filter((f: any) => !f.user.equals(userId));

    // Add new feedback
    this.feedback.push({
        user: userId,
        rating,
        comment,
        wouldRecommend,
        createdAt: new Date()
    });

    // Update stats
    this.stats.totalRatings = this.feedback.length;
    this.stats.averageRating = this.feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / this.feedback.length;

    return this.save();
};

communityCallSchema.methods.canUserJoin = function (userId: Types.ObjectId) {
    if (this.status !== 'scheduled' && this.status !== 'live') return false;
    if (this.isPrivate && !this.registeredUsers.includes(userId)) return false;
    return true;
};

communityCallSchema.methods.isHost = function (userId: Types.ObjectId) {
    return this.host.equals(userId) || this.coHosts.some((id: Types.ObjectId) => id.equals(userId));
};

export const CommunityCall = model<ICommunityCallDocument, ICommunityCallModel>('CommunityCall', communityCallSchema);