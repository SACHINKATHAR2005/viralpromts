"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedPrompt = void 0;
const mongoose_1 = require("mongoose");
const savedPromptSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    prompt: {
        type: mongoose_1.Schema.Types.ObjectId,
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
savedPromptSchema.index({ user: 1, prompt: 1, collectionName: 1 }, { unique: true });
savedPromptSchema.index({ user: 1, collectionName: 1, createdAt: -1 });
savedPromptSchema.index({ prompt: 1 });
exports.SavedPrompt = (0, mongoose_1.model)('SavedPrompt', savedPromptSchema);
//# sourceMappingURL=SavedPrompt.js.map