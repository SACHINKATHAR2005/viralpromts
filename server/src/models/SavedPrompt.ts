import { Schema, model, Document, Types } from 'mongoose';

// Save/Copy interface - for users to save prompts to their collection
export interface ISavedPrompt {
    user: Types.ObjectId;
    prompt: Types.ObjectId;
    collectionName?: string; // Optional collection name (e.g., "Favorites", "Work", "Personal")
    notes?: string; // User's personal notes about the prompt
    createdAt: Date;
}

// Saved prompt document interface
interface ISavedPromptDocument extends Document, ISavedPrompt { }

// Saved Prompt Schema
const savedPromptSchema = new Schema<ISavedPromptDocument>({
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
    collectionName: {
        type: String,
        trim: true,
        maxlength: [50, 'Collection name cannot exceed 50 characters'],
        default: 'Saved'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure user can only save a prompt once per collection
savedPromptSchema.index({ user: 1, prompt: 1, collectionName: 1 }, { unique: true });

// Indexes for performance
savedPromptSchema.index({ user: 1, collectionName: 1, createdAt: -1 }); // Get user's collections
savedPromptSchema.index({ prompt: 1 }); // Track how many times a prompt was saved

// Export SavedPrompt model
export const SavedPrompt = model<ISavedPromptDocument>('SavedPrompt', savedPromptSchema);