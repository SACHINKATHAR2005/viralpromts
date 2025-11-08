// ==================== USER TYPES ====================
export interface User {
    _id: string;
    username: string;
    email: string;
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
    pinnedPrompt?: string | null;

    // Monetization
    monetizationUnlocked: boolean;
    isVerified: boolean;

    // Account status
    isActive: boolean;
    lastLoginAt?: string;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

// ==================== PROMPT TYPES ====================
export interface Prompt {
    _id: string;
    title: string;
    description: string;
    promptText: string;

    // Proof/Results
    proofImages: string[];
    proofType: 'image' | 'video' | 'audio' | 'text';

    // Categorization
    category: string;
    tags: string[];

    // Creator info
    creator: User | string;

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
    moderatedBy?: string;
    moderatedAt?: string;

    // AI Platform compatibility
    aiPlatform: string[];

    // Client-side flags
    isLiked?: boolean;
    isSaved?: boolean;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

// ==================== RATING TYPES ====================
export interface Rating {
    _id: string;
    promptId: string;
    userId: string;

    // Rating categories
    effectiveness: number;
    clarity: number;
    creativity: number;
    value: number;
    overall: number;

    // Review details
    comment?: string;
    proofUploaded: boolean;
    proofUrl?: string;

    // Helpful votes
    helpfulVotes: number;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

// ==================== COMMENT TYPES ====================
export interface Comment {
    _id: string;
    promptId: string;
    userId: string | User;
    user?: User; // Populated user field from backend
    content: string;

    // Reply system
    parentCommentId?: string;
    replies: string[] | Comment[];

    // Engagement
    likes: number;
    isEdited: boolean;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

// ==================== SOCIAL TYPES ====================
export interface Follow {
    _id: string;
    follower: string;
    following: string;
    createdAt: string;
}

export interface Like {
    _id: string;
    userId: string;
    targetType: 'prompt' | 'comment';
    targetId: string;
    createdAt: string;
}

export interface SavedPrompt {
    _id: string;
    userId: string;
    promptId: string;
    collectionName?: string;
    notes?: string;
    createdAt: string;
}

// ==================== POOL TYPES ====================
export interface Pool {
    _id: string;
    title: string;
    description: string;
    type: 'collaborative' | 'challenge' | 'voting' | 'resource';
    creator: string | User;
    moderators: string[] | User[];
    participants: string[] | User[];
    prompts: string[] | Prompt[];
    tags: string[];
    category: string;
    maxParticipants?: number;
    isPrivate: boolean;
    requireApproval: boolean;
    allowVoting: boolean;

    challenge?: {
        startDate: string;
        endDate: string;
        prize?: string;
        rules: string;
        judging: 'community' | 'moderator' | 'automatic';
        maxSubmissions: number;
    };

    voting?: {
        startDate: string;
        endDate: string;
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
    startDate?: string;
    endDate?: string;
    rules?: string;

    rewards?: {
        type: 'badge' | 'points' | 'recognition';
        value: string | number;
        criteria: string;
    };

    createdAt: string;
    updatedAt: string;
}

// ==================== COMMUNITY CALL TYPES ====================
export interface CommunityCall {
    _id: string;
    title: string;
    description: string;
    type: 'live_session' | 'expert_qa' | 'showcase' | 'workshop' | 'networking';
    host: string | User;
    coHosts: string[] | User[];
    scheduledDate: string;
    duration: number;
    timezone: string;
    meetingLink?: string;
    meetingId?: string;
    password?: string;
    platform: 'zoom' | 'google_meet' | 'teams' | 'discord' | 'other';
    maxParticipants?: number;
    registeredUsers: string[] | User[];
    attendees?: string[] | User[];
    waitlist: string[] | User[];

    agenda: Array<{
        item: string;
        duration: number;
        speaker?: string;
    }>;

    tags: string[];
    category: string;
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
    requiresApproval: boolean;
    prerequisites?: string;
    materials?: string;
    isRecorded: boolean;
    recordingUrl?: string;

    resources: Array<{
        title: string;
        url: string;
        type: 'document' | 'video' | 'link' | 'prompt';
    }>;

    allowChat: boolean;
    allowQA: boolean;
    allowScreenShare: boolean;
    moderatedChat: boolean;

    stats: {
        registrationCount: number;
        attendanceCount: number;
        averageRating: number;
        totalRatings: number;
        completionRate: number;
    };

    feedback: Array<{
        user: string;
        rating: number;
        comment?: string;
        wouldRecommend: boolean;
        createdAt: string;
    }>;

    status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'postponed';
    isPrivate: boolean;
    featured: boolean;

    createdAt: string;
    updatedAt: string;
}

// ==================== API RESPONSE TYPES ====================
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: PaginationData;
}

// ==================== FORM INPUT TYPES ====================
export interface RegisterInput {
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface PromptCreateInput {
    title: string;
    description: string;
    promptText: string;
    category: string;
    tags: string[];
    proofImages?: string[];
    proofType?: 'image' | 'video' | 'audio' | 'text';
    aiPlatform: string[];
    isPaid?: boolean;
    price?: number;
    privacy?: 'public' | 'private' | 'followers';
}

export interface PromptUpdateInput extends Partial<PromptCreateInput> { }

export interface ProfileUpdateInput {
    username?: string;
    bio?: string;
    website?: string;
    profilePicture?: string;
}

export interface CommentCreateInput {
    content: string;
    parentCommentId?: string;
}

export interface RatingCreateInput {
    effectiveness: number;
    clarity: number;
    creativity: number;
    value: number;
    comment?: string;
    proofUrl?: string;
}

// ==================== FILTER & QUERY TYPES ====================
export interface PromptFilters {
    category?: string;
    tags?: string[];
    search?: string;
    aiPlatform?: string;
    isPaid?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'latest' | 'trending' | 'popular' | 'rating';
    page?: number;
    limit?: number;
}

// ==================== CONSTANTS ====================
export const CATEGORIES = [
    'Art & Design',
    'Marketing',
    'Writing',
    'Code',
    'Music',
    'Video',
    'Voice',
    'Business',
    'Other'
] as const;

export const AI_PLATFORMS = [
    'ChatGPT',
    'Claude',
    'Midjourney',
    'DALL-E',
    'Stable Diffusion',
    'GPT-4',
    'Gemini',
    'Copilot',
    'Other'
] as const;

export type Category = typeof CATEGORIES[number];
export type AIPlatform = typeof AI_PLATFORMS[number];
