import { Types } from 'mongoose';

// Prompt related types
export interface IPrompt {
    title: string;
    description: string;

    // The actual prompt (encrypted)
    promptText: string; // This will be encrypted

    // Proof/Results
    proofImages: string[]; // URLs to result images/videos
    proofType: 'image' | 'video' | 'audio' | 'text';

    // Categorization
    category: string;
    tags: string[];

    // Creator info
    creator: Types.ObjectId; // User ID

    // Rating system
    ratings: {
        average: number;
        count: number;
        breakdown: {
            effectiveness: number;
            clarity: number;
            creativity: number;
            value: number;
        };
    };

    // Engagement stats
    stats: {
        copies: number;
        views: number;
        likes: number;
        comments: number;
        shares: number;
        totalLikes: number;
        totalComments: number;
        averageRating: number;
        totalRatings: number;
    };

    // Monetization
    isPaid: boolean;
    price: number;

    // Privacy & Status
    privacy: 'public' | 'private' | 'followers';
    isApproved: boolean;
    isFeatured: boolean;

    // Moderation
    isActive: boolean;
    moderationReason?: string;
    moderatedBy?: Types.ObjectId;
    moderatedAt?: Date;

    // AI Platform compatibility
    aiPlatform: string[]; // ['ChatGPT', 'Midjourney', 'Claude', etc.]

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface IPromptMethods {
    getDecryptedPrompt(): string;
    updatePromptText(newPromptText: string): void;
    incrementCopies(): Promise<void>;
    incrementViews(): Promise<void>;
    updateRatings(newRating: {
        effectiveness: number;
        clarity: number;
        creativity: number;
        value: number;
    }): void;
}

export interface IPromptStatics {
    findPublic(): any;
    findTrending(limit?: number): any;
}

export interface IPromptModel extends IPrompt, IPromptMethods { }