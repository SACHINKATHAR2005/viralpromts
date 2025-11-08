export interface User {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
    stats?: {
        followersCount: number;
        followingCount: number;
        promptsCount: number;
    };
}

export interface Prompt {
    _id: string;
    title: string;
    description: string;
    promptText: string;
    category: string;
    tags: string[];
    author: User;
    stats: {
        totalLikes: number;
        totalComments: number;
        totalSaves: number;
    };
    isLiked?: boolean;
    isSaved?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    _id: string;
    content: string;
    user: User;
    prompt: string;
    parentComment?: string;
    replies?: Comment[];
    createdAt: string;
}

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
}