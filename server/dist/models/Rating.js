"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rating = void 0;
const mongoose_1 = require("mongoose");
const ratingSchema = new mongoose_1.Schema({
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
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5'],
        validate: {
            validator: function (value) {
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
ratingSchema.index({ user: 1, prompt: 1 }, { unique: true });
ratingSchema.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = new Date();
    }
    next();
});
ratingSchema.index({ prompt: 1, rating: -1 });
ratingSchema.index({ user: 1, createdAt: -1 });
ratingSchema.index({ helpfulVotes: -1 });
exports.Rating = (0, mongoose_1.model)('Rating', ratingSchema);
//# sourceMappingURL=Rating.js.map