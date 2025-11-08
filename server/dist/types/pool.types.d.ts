import { Types, Document } from 'mongoose';
export interface IPool {
    title: string;
    description: string;
    type: 'collaborative' | 'challenge' | 'voting' | 'resource';
    creator: Types.ObjectId;
    moderators: Types.ObjectId[];
    participants: Types.ObjectId[];
    prompts: Types.ObjectId[];
    tags: string[];
    category: string;
    maxParticipants?: number;
    isPrivate: boolean;
    requireApproval: boolean;
    allowVoting: boolean;
    challenge?: {
        startDate: Date;
        endDate: Date;
        prize?: string;
        rules: string;
        judging: 'community' | 'moderator' | 'automatic';
        maxSubmissions: number;
    };
    voting?: {
        startDate: Date;
        endDate: Date;
        allowMultipleVotes: boolean;
        votingType: 'updown' | 'rating' | 'ranking';
    };
    stats: {
        totalPrompts: number;
        totalParticipants: number;
        totalVotes: number;
        averageRating: number;
    };
    status: 'active' | 'completed' | 'cancelled' | 'pending';
    featured: boolean;
    startDate?: Date;
    endDate?: Date;
    rules?: string;
    rewards?: {
        type: 'badge' | 'points' | 'recognition';
        value: string | number;
        criteria: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface IPoolMethods {
    addParticipant(userId: Types.ObjectId): Promise<IPoolDocument>;
    removeParticipant(userId: Types.ObjectId): Promise<IPoolDocument>;
    addPrompt(promptId: Types.ObjectId): Promise<IPoolDocument>;
    isParticipant(userId: Types.ObjectId): boolean;
    isModerator(userId: Types.ObjectId): boolean;
    canJoin(): boolean;
}
export interface IPoolStatics {
}
export interface IPoolDocument extends IPool, IPoolMethods, Document {
}
//# sourceMappingURL=pool.types.d.ts.map