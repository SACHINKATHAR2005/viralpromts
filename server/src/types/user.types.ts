import { Types } from 'mongoose';

// User related types (without _id, Mongoose will handle it)
export interface IUser {
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin';

    // Profile info
    bio?: string;
    website?: string;
    profilePicture?: string;

    // Reputation system
    reputation: {
        score: number;
        totalRatings: number;
        badges: string[];
    };

    // Stats
    stats: {
        totalPrompts: number;
        totalCopies: number;
        totalEarnings: number;
        followersCount: number;
        followingCount: number;
    };

    // Pinned prompt
    pinnedPrompt?: Types.ObjectId | null;

    // Monetization
    monetizationUnlocked: boolean;
    isVerified: boolean;

    // Account status
    isActive: boolean;
    lastLoginAt?: Date;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthToken(): string;
}

export interface IUserModel extends IUser, IUserMethods { }