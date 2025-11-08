import mongoose, { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser, IUserMethods } from '../types/user.types';

// Create a document interface that combines IUser and IUserMethods with Document
interface IUserDocument extends Document, IUser, IUserMethods { }

// User Schema
const userSchema = new Schema<IUserDocument>({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    // Profile info
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        trim: true
    },

    website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },

    profilePicture: {
        type: String,
        default: null
    },

    // Reputation system
    reputation: {
        score: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        badges: [{
            type: String,
            enum: [
                'Prompt Master',
                'Community Helper',
                'Innovation Leader',
                'Consistency King',
                'Top Contributor',
                'Verified Creator'
            ]
        }]
    },

    // Stats
    stats: {
        totalPrompts: {
            type: Number,
            default: 0
        },
        totalCopies: {
            type: Number,
            default: 0
        },
        totalEarnings: {
            type: Number,
            default: 0
        },
        followersCount: {
            type: Number,
            default: 0
        },
        followingCount: {
            type: Number,
            default: 0
        }
    },

    // Pinned prompt (featured on profile)
    pinnedPrompt: {
        type: Schema.Types.ObjectId,
        ref: 'Prompt',
        default: null
    },

    // Monetization
    monetizationUnlocked: {
        type: Boolean,
        default: false
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    // Account status
    isActive: {
        type: Boolean,
        default: true
    },

    lastLoginAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'reputation.score': -1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash password if it's modified
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function (): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const payload = {
        userId: this._id.toString(),
        username: this.username,
        email: this.email,
        role: this.role
    };

    const options = {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    } as jwt.SignOptions;

    return jwt.sign(payload, secret, options);
};

// Virtual for ID
userSchema.virtual('id').get(function (this: IUserDocument) {
    return (this._id as mongoose.Types.ObjectId).toString();
});

// Export the model with proper typing
export const User = model<IUserDocument>('User', userSchema);