import { Schema, model, Document, Types } from 'mongoose';

// Follow interface
export interface IFollow {
    follower: Types.ObjectId; // User who is following
    following: Types.ObjectId; // User being followed
    createdAt: Date;
}

// Follow document interface
interface IFollowDocument extends Document, IFollow { }

// Follow Schema
const followSchema = new Schema<IFollowDocument>({
    follower: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    following: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure user can't follow the same person twice
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Prevent users from following themselves
followSchema.pre('save', function (next) {
    if (this.follower.equals(this.following)) {
        const error = new Error('Users cannot follow themselves');
        return next(error);
    }
    next();
});

// Indexes for performance
followSchema.index({ follower: 1 }); // Get who user is following
followSchema.index({ following: 1 }); // Get user's followers

// Export Follow model
export const Follow = model<IFollowDocument>('Follow', followSchema);