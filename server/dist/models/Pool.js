"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pool = void 0;
const mongoose_1 = require("mongoose");
const poolSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Pool title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Pool description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    type: {
        type: String,
        enum: ['collaborative', 'challenge', 'voting', 'resource'],
        required: true
    },
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    moderators: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    participants: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    prompts: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Prompt'
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
    maxParticipants: {
        type: Number,
        min: 1,
        max: 10000
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    requireApproval: {
        type: Boolean,
        default: false
    },
    allowVoting: {
        type: Boolean,
        default: true
    },
    challenge: {
        startDate: Date,
        endDate: Date,
        prize: String,
        rules: {
            type: String,
            maxlength: [2000, 'Rules cannot exceed 2000 characters']
        },
        judging: {
            type: String,
            enum: ['community', 'moderator', 'automatic'],
            default: 'community'
        },
        maxSubmissions: {
            type: Number,
            default: 1,
            min: 1
        }
    },
    voting: {
        startDate: Date,
        endDate: Date,
        allowMultipleVotes: {
            type: Boolean,
            default: false
        },
        votingType: {
            type: String,
            enum: ['updown', 'rating', 'ranking'],
            default: 'updown'
        }
    },
    stats: {
        totalPrompts: {
            type: Number,
            default: 0
        },
        totalParticipants: {
            type: Number,
            default: 0
        },
        totalVotes: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        }
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled', 'pending'],
        default: 'active'
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
poolSchema.index({ creator: 1 });
poolSchema.index({ type: 1, status: 1 });
poolSchema.index({ category: 1 });
poolSchema.index({ tags: 1 });
poolSchema.index({ featured: 1, status: 1 });
poolSchema.index({ 'challenge.endDate': 1 });
poolSchema.index({ 'voting.endDate': 1 });
poolSchema.virtual('participantCount').get(function () {
    return this.participants.length;
});
poolSchema.virtual('promptCount').get(function () {
    return this.prompts.length;
});
poolSchema.methods.addParticipant = function (userId) {
    if (!this.participants.includes(userId)) {
        this.participants.push(userId);
        this.stats.totalParticipants = this.participants.length;
    }
    return this.save();
};
poolSchema.methods.removeParticipant = function (userId) {
    this.participants = this.participants.filter((id) => !id.equals(userId));
    this.stats.totalParticipants = this.participants.length;
    return this.save();
};
poolSchema.methods.addPrompt = function (promptId) {
    if (!this.prompts.includes(promptId)) {
        this.prompts.push(promptId);
        this.stats.totalPrompts = this.prompts.length;
    }
    return this.save();
};
poolSchema.methods.isParticipant = function (userId) {
    return this.participants.some((id) => id.equals(userId));
};
poolSchema.methods.isModerator = function (userId) {
    return this.moderators.some((id) => id.equals(userId)) || this.creator.equals(userId);
};
poolSchema.methods.canJoin = function () {
    if (this.status !== 'active')
        return false;
    if (this.maxParticipants && this.participants.length >= this.maxParticipants)
        return false;
    return true;
};
exports.Pool = (0, mongoose_1.model)('Pool', poolSchema);
//# sourceMappingURL=Pool.js.map