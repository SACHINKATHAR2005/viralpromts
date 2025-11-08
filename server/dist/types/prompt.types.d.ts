import { Types } from 'mongoose';
export interface IPrompt {
    title: string;
    description: string;
    promptText: string;
    proofImages: string[];
    proofType: 'image' | 'video' | 'audio' | 'text';
    category: string;
    tags: string[];
    creator: Types.ObjectId;
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
    isPaid: boolean;
    price: number;
    privacy: 'public' | 'private' | 'followers';
    isApproved: boolean;
    isFeatured: boolean;
    isActive: boolean;
    moderationReason?: string;
    moderatedBy?: Types.ObjectId;
    moderatedAt?: Date;
    aiPlatform: string[];
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
export interface IPromptModel extends IPrompt, IPromptMethods {
}
//# sourceMappingURL=prompt.types.d.ts.map