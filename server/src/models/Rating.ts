import { Schema, model, Document, Types } from 'mongoose';

// Rating interface
export interface IRating {
    user: Types.ObjectId;
    prompt: Types.ObjectId;
    rating: number; // 1-5 stars
    review?: string; // Optional written review
    isHelpful?: boolean; // For marking helpful reviews
    helpfulVotes: number;
    createdAt: Date;
    updatedAt: Date;
}

// Rating document interface
interface IRatingDocument extends Document, IRating { }

// Rating Schema
const ratingSchema = new Schema<IRatingDocument>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    prompt: {
        type: Schema.Types.ObjectId,
        ref: 'Prompt',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5'],
        validate: {
            validator: function (value: number) {
                return Number.isInteger(value);
            },
            message: 'Rating must be a whole number'
        }
    },
    review: {
        type: String,
        trim: true,
        maxlength: [2000, 'Review cannot exceed 2000 characters']
    },
    isHelpful: {
        type: Boolean,
        default: false
    },
    helpfulVotes: {
        type: Number,
        default: 0,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure user can only rate a prompt once
ratingSchema.index({ user: 1, prompt: 1 }, { unique: true });

// Update the updatedAt field on save
ratingSchema.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = new Date();
    }
    next();
});

// Indexes for performance
ratingSchema.index({ prompt: 1, rating: -1 }); // Get ratings for a prompt
ratingSchema.index({ user: 1, createdAt: -1 }); // Get user's ratings
ratingSchema.index({ helpfulVotes: -1 }); // Get most helpful reviews

// Export Rating model
export const Rating = model<IRatingDocument>('Rating', ratingSchema);