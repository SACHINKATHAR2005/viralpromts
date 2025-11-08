import mongoose, { Schema, model, Document } from 'mongoose';

export interface IPoolVote extends Document {
    pool: mongoose.Types.ObjectId;
    prompt: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    voteValue: number; // 1 for upvote, -1 for downvote, or 1-5 for rating
    createdAt: Date;
    updatedAt: Date;
}

const poolVoteSchema = new Schema<IPoolVote>({
    pool: {
        type: Schema.Types.ObjectId,
        ref: 'Pool',
        required: true
    },
    prompt: {
        type: Schema.Types.ObjectId,
        ref: 'Prompt',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    voteValue: {
        type: Number,
        required: true,
        validate: {
            validator: function (value: number) {
                // Either -1, 1 for updown or 1-5 for rating
                return value === -1 || value === 1 || (value >= 1 && value <= 5);
            },
            message: 'Vote value must be -1, 1, or between 1-5'
        }
    }
}, {
    timestamps: true
});

// Compound index to ensure one vote per user per prompt per pool
poolVoteSchema.index({ pool: 1, prompt: 1, user: 1 }, { unique: true });

// Index for aggregation queries
poolVoteSchema.index({ pool: 1, prompt: 1 });
poolVoteSchema.index({ user: 1 });

export const PoolVote = model<IPoolVote>('PoolVote', poolVoteSchema);
