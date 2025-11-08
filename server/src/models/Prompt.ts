import mongoose, { Schema, model, Document, Model } from 'mongoose';
import { IPrompt, IPromptMethods, IPromptStatics } from '../types/prompt.types';
import { encryptText, decryptText } from '../utils/encryption';

// Create interface that extends Document with our methods
interface IPromptDocument extends IPrompt, IPromptMethods, Document { }

// Create model interface that includes statics
interface IPromptModel extends Model<IPromptDocument>, IPromptStatics { }

// Prompt Schema
const promptSchema = new Schema<IPromptDocument>({
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

    // The actual prompt (encrypted)
    promptText: {
        type: String,
        required: [true, 'Prompt text is required'],
        select: false // Don't include in queries by default for security
    },

    // Proof/Results
    proofImages: [{
        type: String,
        validate: {
            validator: function (v: string) {
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

    // Categorization
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

    // Creator info
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    },

    // Rating system
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

    // Engagement stats
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

    // Monetization (for future use)
    isPaid: {
        type: Boolean,
        default: false
    },

    price: {
        type: Number,
        default: 0,
        min: 0
    },

    // Privacy & Status
    privacy: {
        type: String,
        enum: ['public', 'private', 'followers'],
        default: 'public'
    },

    isApproved: {
        type: Boolean,
        default: true // Auto-approve for now, can add moderation later
    },

    isFeatured: {
        type: Boolean,
        default: false
    },

    // Moderation fields
    isActive: {
        type: Boolean,
        default: true
    },

    moderationReason: {
        type: String,
        trim: true
    },

    moderatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    moderatedAt: {
        type: Date
    },

    // AI Platform compatibility
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
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
promptSchema.index({ creator: 1 });
promptSchema.index({ category: 1 });
promptSchema.index({ privacy: 1 });
promptSchema.index({ 'ratings.average': -1 });
promptSchema.index({ 'stats.copies': -1 });
promptSchema.index({ 'stats.views': -1 });
promptSchema.index({ createdAt: -1 });
promptSchema.index({ tags: 1 });
promptSchema.index({ aiPlatform: 1 });

// Text search index
promptSchema.index({
    title: 'text',
    description: 'text',
    tags: 'text'
});

// Compound indexes for common queries
promptSchema.index({ category: 1, privacy: 1, 'ratings.average': -1 });
promptSchema.index({ creator: 1, privacy: 1, createdAt: -1 });

// Pre-save middleware to encrypt prompt text
promptSchema.pre('save', function (next) {
    // Only encrypt if promptText is modified and not already encrypted
    if (this.isModified('promptText') && this.promptText) {
        try {
            // Check if already encrypted (contains colons - our format iv:tag:data)
            if (this.promptText.split(':').length !== 3) {
                // Not encrypted yet, so encrypt it
                this.promptText = encryptText(this.promptText);
            }
            next();
        } catch (error: any) {
            next(error);
        }
    } else {
        next();
    }
});

// Instance method to decrypt prompt text
promptSchema.methods.getDecryptedPrompt = function (this: IPromptDocument): string {
    try {
        return decryptText(this.promptText);
    } catch (error) {
        console.error('❌ Failed to decrypt prompt:', error);
        throw new Error('Failed to decrypt prompt text');
    }
};

// Instance method to safely update prompt text (with encryption)
promptSchema.methods.updatePromptText = function (this: IPromptDocument, newPromptText: string): void {
    this.promptText = newPromptText; // Will be encrypted by pre-save middleware
};

// Instance method to increment view count
promptSchema.methods.incrementViews = async function (this: IPromptDocument): Promise<void> {
    this.stats.views += 1;
    await this.save();
};

// Instance method to increment copy count
promptSchema.methods.incrementCopies = async function (this: IPromptDocument): Promise<void> {
    this.stats.copies += 1;
    await this.save();
};

// Instance method to calculate and update average rating
promptSchema.methods.updateRatings = function (this: IPromptDocument, newRating: {
    effectiveness: number;
    clarity: number;
    creativity: number;
    value: number;
}): void {
    const currentCount = this.ratings.count;
    const currentBreakdown = this.ratings.breakdown;

    // Calculate new averages
    this.ratings.breakdown.effectiveness =
        ((currentBreakdown.effectiveness * currentCount) + newRating.effectiveness) / (currentCount + 1);
    this.ratings.breakdown.clarity =
        ((currentBreakdown.clarity * currentCount) + newRating.clarity) / (currentCount + 1);
    this.ratings.breakdown.creativity =
        ((currentBreakdown.creativity * currentCount) + newRating.creativity) / (currentCount + 1);
    this.ratings.breakdown.value =
        ((currentBreakdown.value * currentCount) + newRating.value) / (currentCount + 1);

    // Calculate overall average
    this.ratings.average = (
        this.ratings.breakdown.effectiveness +
        this.ratings.breakdown.clarity +
        this.ratings.breakdown.creativity +
        this.ratings.breakdown.value
    ) / 4;

    this.ratings.count += 1;
};

// Static method to find public prompts
promptSchema.statics.findPublic = function () {
    return this.find({ privacy: 'public', isApproved: true });
};

// Static method to find trending prompts
promptSchema.statics.findTrending = function (limit: number = 10) {
    return this.find({
        privacy: 'public',
        isApproved: true
    })
        .sort({ 'stats.copies': -1, 'ratings.average': -1 })
        .limit(limit);
};

// Virtual for ID
promptSchema.virtual('id').get(function (this: IPromptDocument) {
    return (this._id as mongoose.Types.ObjectId).toString();
});

// Export the model
export const Prompt = model<IPromptDocument, IPromptModel>('Prompt', promptSchema);