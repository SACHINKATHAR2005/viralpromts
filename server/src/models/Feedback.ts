import { Schema, model, Document, Types } from 'mongoose';

export interface IFeedback extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    subject: string;
    message: string;
    category: 'bug' | 'feature' | 'improvement' | 'other';
    status: 'new' | 'reviewed' | 'resolved' | 'dismissed';
    priority: 'low' | 'medium' | 'high';
    userId?: Types.ObjectId;
    adminNotes?: string;
    resolvedBy?: Types.ObjectId;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['bug', 'feature', 'improvement', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['new', 'reviewed', 'resolved', 'dismissed'],
        default: 'new'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    adminNotes: {
        type: String,
        trim: true
    },
    resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ email: 1 });
feedbackSchema.index({ userId: 1 });

export const Feedback = model<IFeedback>('Feedback', feedbackSchema);
