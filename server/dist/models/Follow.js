"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Follow = void 0;
const mongoose_1 = require("mongoose");
const followSchema = new mongoose_1.Schema({
    follower: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    following: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.pre('save', function (next) {
    if (this.follower.equals(this.following)) {
        const error = new Error('Users cannot follow themselves');
        return next(error);
    }
    next();
});
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });
exports.Follow = (0, mongoose_1.model)('Follow', followSchema);
//# sourceMappingURL=Follow.js.map