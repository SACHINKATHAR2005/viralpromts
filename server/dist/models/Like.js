"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Like = void 0;
const mongoose_1 = require("mongoose");
const likeSchema = new mongoose_1.Schema({
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});
likeSchema.index({ user: 1, prompt: 1 }, { unique: true });
exports.Like = (0, mongoose_1.model)('Like', likeSchema);
//# sourceMappingURL=Like.js.map