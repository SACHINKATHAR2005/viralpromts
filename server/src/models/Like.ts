import { Schema, model, Document, Types } from 'mongoose';

// Like interface
export interface ILike {
    user: Types.ObjectId;
    prompt: Types.ObjectId;
    createdAt: Date;
}

// Like document interface
interface ILikeDocument extends Document, ILike { }

// Like Schema
const likeSchema = new Schema<ILikeDocument>({
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure user can only like a prompt once
likeSchema.index({ user: 1, prompt: 1 }, { unique: true });

// Export Like model
export const Like = model<ILikeDocument>('Like', likeSchema);