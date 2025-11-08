"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prompt = void 0;
const mongoose_1 = require("mongoose");
const encryption_1 = require("../utils/encryption");
const promptSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    promptText: {
        type: String,
        required: [true, 'Prompt text is required'],
        select: false
    },
    proofImages: [{
            type: String,
            validate: {
                validator: function (v) {
                    return /^https?:\/\/.+/.test(v);
                },
                message: 'Proof images must be valid URLs'
            }
        }],
    proofType: {
        type: String,
        enum: ['image', 'video', 'audio', 'text'],
        required: [true, 'Proof type is required'],
        default: 'image'
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Art & Design',
            'Marketing',
            'Writing',
            'Code',
            'Music',
            'Video',
            'Voice',
            'Business',
            'Other'
        ]
    },
    tags: [{
            type: String,
            trim: true,
            lowercase: true,
            maxlength: [30, 'Each tag cannot exceed 30 characters']
        }],
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    },
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        },
        breakdown: {
            effectiveness: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            clarity: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            creativity: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            value: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            }
        }
    },
    stats: {
        copies: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        totalLikes: {
            type: Number,
            default: 0
        },
        totalComments: {
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
        }
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        default: 0,
        min: 0
    },
    privacy: {
        type: String,
        enum: ['public', 'private', 'followers'],
        default: 'public'
    },
    isApproved: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    moderationReason: {
        type: String,
        trim: true
    },
    moderatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    moderatedAt: {
        type: Date
    },
    aiPlatform: [{
            type: String,
            enum: [
                'ChatGPT',
                'Claude',
                'Midjourney',
                'DALL-E',
                'Stable Diffusion',
                'Gemini',
                'Perplexity',
                'Other'
            ]
        }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
promptSchema.index({ creator: 1 });
promptSchema.index({ category: 1 });
promptSchema.index({ privacy: 1 });
promptSchema.index({ 'ratings.average': -1 });
promptSchema.index({ 'stats.copies': -1 });
promptSchema.index({ 'stats.views': -1 });
promptSchema.index({ createdAt: -1 });
promptSchema.index({ tags: 1 });
promptSchema.index({ aiPlatform: 1 });
promptSchema.index({
    title: 'text',
    description: 'text',
    tags: 'text'
});
promptSchema.index({ category: 1, privacy: 1, 'ratings.average': -1 });
promptSchema.index({ creator: 1, privacy: 1, createdAt: -1 });
promptSchema.pre('save', function (next) {
    if (this.isModified('promptText') && this.promptText) {
        try {
            if (this.promptText.split(':').length !== 3) {
                this.promptText = (0, encryption_1.encryptText)(this.promptText);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    }
    else {
        next();
    }
});
promptSchema.methods.getDecryptedPrompt = function () {
    try {
        return (0, encryption_1.decryptText)(this.promptText);
    }
    catch (error) {
        console.error('❌ Failed to decrypt prompt:', error);
        throw new Error('Failed to decrypt prompt text');
    }
};
promptSchema.methods.updatePromptText = function (newPromptText) {
    this.promptText = newPromptText;
};
promptSchema.methods.incrementViews = async function () {
    this.stats.views += 1;
    await this.save();
};
promptSchema.methods.incrementCopies = async function () {
    this.stats.copies += 1;
    await this.save();
};
promptSchema.methods.updateRatings = function (newRating) {
    const currentCount = this.ratings.count;
    const currentBreakdown = this.ratings.breakdown;
    this.ratings.breakdown.effectiveness =
        ((currentBreakdown.effectiveness * currentCount) + newRating.effectiveness) / (currentCount + 1);
    this.ratings.breakdown.clarity =
        ((currentBreakdown.clarity * currentCount) + newRating.clarity) / (currentCount + 1);
    this.ratings.breakdown.creativity =
        ((currentBreakdown.creativity * currentCount) + newRating.creativity) / (currentCount + 1);
    this.ratings.breakdown.value =
        ((currentBreakdown.value * currentCount) + newRating.value) / (currentCount + 1);
    this.ratings.average = (this.ratings.breakdown.effectiveness +
        this.ratings.breakdown.clarity +
        this.ratings.breakdown.creativity +
        this.ratings.breakdown.value) / 4;
    this.ratings.count += 1;
};
promptSchema.statics.findPublic = function () {
    return this.find({ privacy: 'public', isApproved: true });
};
promptSchema.statics.findTrending = function (limit = 10) {
    return this.find({
        privacy: 'public',
        isApproved: true
    })
        .sort({ 'stats.copies': -1, 'ratings.average': -1 })
        .limit(limit);
};
promptSchema.virtual('id').get(function () {
    return this._id.toString();
});
exports.Prompt = (0, mongoose_1.model)('Prompt', promptSchema);
//# sourceMappingURL=Prompt.js.map