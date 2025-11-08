import { Schema, model, Document, Types } from 'mongoose';

// Comment interface
export interface IComment {
    user: Types.ObjectId;
    prompt: Types.ObjectId;
    content: string;
    parentComment?: Types.ObjectId; // For reply functionality
    likes: number;
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Comment document interface
interface ICommentDocument extends Document, IComment { }

// Comment Schema
const commentSchema = new Schema<ICommentDocument>({
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
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        minlength: [1, 'Comment cannot be empty']
    },
    parentComment: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null // null means it's a top-level comment
    },
    likes: {
        type: Number,
        default: 0,
        min: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
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

// Update the updatedAt field on save
commentSchema.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = new Date();
        if (this.isModified('content')) {
            this.isEdited = true;
        }
    }
    next();
});

// Indexes for better performance
commentSchema.index({ prompt: 1, createdAt: -1 }); // Get comments for a prompt
commentSchema.index({ user: 1, createdAt: -1 }); // Get user's comments
commentSchema.index({ parentComment: 1, createdAt: 1 }); // Get replies

// Export Comment model
export const Comment = model<ICommentDocument>('Comment', commentSchema);