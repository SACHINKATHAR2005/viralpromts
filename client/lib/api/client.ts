import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
    ApiResponse,
    User,
    Prompt,
    Comment,
    Rating,
    Pool,
    CommunityCall,
    PaginatedResponse,
    RegisterInput,
    LoginInput,
    PromptCreateInput,
    PromptUpdateInput,
    ProfileUpdateInput,
    CommentCreateInput,
    RatingCreateInput,
    PromptFilters,
    SavedPrompt
} from '@/lib/types/index';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Log the API URL on client-side for debugging
if (typeof window !== 'undefined') {
    console.log('🔗 API Base URL:', API_BASE_URL);
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
    (config) => {
        console.log('🌐 API REQUEST:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
            data: config.data,
            headers: config.headers
        });
        return config;
    },
    (error) => {
        console.error('❌ API REQUEST ERROR:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => {
        console.log('✅ API RESPONSE:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            headers: response.headers
        });
        return response;
    },
    (error: AxiosError<ApiResponse<any>>) => {
        console.error('❌ API RESPONSE ERROR:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
                method: error.config?.method,
                url: error.config?.url,
                baseURL: error.config?.baseURL
            }
        });

        // Handle common errors
        if (error.response?.status === 401) {
            // Unauthorized - redirect to login
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ==================== AUTH API ====================
export const authApi = {
    // Register new user
    register: (data: RegisterInput) =>
        apiClient.post<ApiResponse<{ user: User }>>('/auth/register', data),

    // Login user
    login: (data: LoginInput) =>
        apiClient.post<ApiResponse<{ user: User }>>('/auth/login', data),

    // Get current user profile
    getProfile: () =>
        apiClient.get<ApiResponse<{ user: User }>>('/auth/me'),

    // Update user profile
    updateProfile: (data: ProfileUpdateInput) =>
        apiClient.put<ApiResponse<{ user: User }>>('/auth/profile', data),

    // Logout user
    logout: () =>
        apiClient.post<ApiResponse<null>>('/auth/logout'),
};

// ==================== PROMPTS API ====================
export const promptsApi = {
    // Get all prompts with optional filters
    getPrompts: (filters?: PromptFilters) =>
        apiClient.get<ApiResponse<PaginatedResponse<Prompt>>>('/prompts', {
            params: filters
        }),

    // Get user's own prompts
    getMyPrompts: (page?: number, limit?: number) =>
        apiClient.get<ApiResponse<PaginatedResponse<Prompt>>>('/prompts/my', {
            params: { page, limit }
        }),

    // Get single prompt by ID
    getPrompt: (id: string) =>
        apiClient.get<ApiResponse<{ prompt: Prompt }>>(`/prompts/${id}`),

    // Create new prompt
    createPrompt: (data: PromptCreateInput) =>
        apiClient.post<ApiResponse<{ prompt: Prompt }>>('/prompts', data),

    // Update prompt
    updatePrompt: (id: string, data: PromptUpdateInput) =>
        apiClient.put<ApiResponse<{ prompt: Prompt }>>(`/prompts/${id}`, data),

    // Delete prompt
    deletePrompt: (id: string) =>
        apiClient.delete<ApiResponse<null>>(`/prompts/${id}`),

    // Pin/Unpin prompt to profile
    togglePinPrompt: (id: string) =>
        apiClient.patch<ApiResponse<{ promptId: string; isPinned: boolean }>>(`/prompts/${id}/pin`),

    // Copy/Purchase prompt
    copyPrompt: (id: string) =>
        apiClient.post<ApiResponse<{ prompt: Prompt }>>(`/prompts/${id}/copy`),
};

// ==================== SOCIAL API ====================
export const socialApi = {
    // Like a prompt
    likePrompt: (promptId: string) =>
        apiClient.post<ApiResponse<{ like: any }>>(`/social/like/${promptId}`),

    // Unlike a prompt
    unlikePrompt: (promptId: string) =>
        apiClient.delete<ApiResponse<null>>(`/social/like/${promptId}`),

    // Add comment to a prompt
    addComment: (promptId: string, data: CommentCreateInput) =>
        apiClient.post<ApiResponse<{ comment: Comment }>>(`/social/comment/${promptId}`, data),

    // Get comments for a prompt
    getComments: (promptId: string, page?: number, limit?: number) =>
        apiClient.get<ApiResponse<PaginatedResponse<Comment>>>(`/social/comments/${promptId}`, {
            params: { page, limit }
        }),

    // Follow a user
    followUser: (userId: string) =>
        apiClient.post<ApiResponse<{ follow: any }>>(`/social/follow/${userId}`),

    // Unfollow a user
    unfollowUser: (userId: string) =>
        apiClient.delete<ApiResponse<null>>(`/social/follow/${userId}`),

    // Save a prompt to collection
    savePrompt: (promptId: string, data?: { collectionName?: string; notes?: string }) =>
        apiClient.post<ApiResponse<{ savedPrompt: SavedPrompt }>>(`/social/save/${promptId}`, data),
};

// ==================== RATING API ====================
export const ratingApi = {
    // Add rating to a prompt
    addRating: (promptId: string, data: RatingCreateInput) =>
        apiClient.post<ApiResponse<{ rating: Rating }>>(`/ratings/${promptId}`, data),

    // Get ratings for a prompt
    getRatings: (promptId: string, page?: number, limit?: number) =>
        apiClient.get<ApiResponse<PaginatedResponse<Rating>>>(`/ratings/${promptId}`, {
            params: { page, limit }
        }),

    // Get user's rating for a prompt
    getMyRating: (promptId: string) =>
        apiClient.get<ApiResponse<{ rating: Rating | null }>>(`/ratings/${promptId}/my`),
};

// ==================== COMMUNITY CALL API ====================
export const communityCallApi = {
    // Get all community calls
    getCalls: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
        apiClient.get<ApiResponse<PaginatedResponse<CommunityCall>>>('/calls', { params }),

    // Get single community call
    getCall: (id: string) =>
        apiClient.get<ApiResponse<{ call: CommunityCall }>>(`/calls/${id}`),

    // Create new community call
    createCall: (data: Partial<CommunityCall>) =>
        apiClient.post<ApiResponse<{ call: CommunityCall }>>('/calls', data),

    // Register for a call
    registerForCall: (id: string) =>
        apiClient.post<ApiResponse<{ call: CommunityCall; status: string }>>(`/calls/${id}/register`),

    // Unregister from a call
    unregisterFromCall: (id: string) =>
        apiClient.post<ApiResponse<{ call: CommunityCall }>>(`/calls/${id}/unregister`),

    // Add feedback to a call
    addFeedback: (id: string, data: { rating: number; comment?: string; wouldRecommend: boolean }) =>
        apiClient.post<ApiResponse<{ call: CommunityCall }>>(`/calls/${id}/feedback`, data),
};

// ==================== UPLOAD API ====================
export const uploadApi = {
    // Upload profile photo
    uploadProfilePhoto: (file: File) => {
        const formData = new FormData();
        formData.append('profilePhoto', file);

        return apiClient.post<ApiResponse<{ url: string; public_id: string }>>('/upload/profile-photo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Upload prompt proof images
    uploadPromptProof: (file: File) => {
        const formData = new FormData();
        formData.append('proofImages', file);

        return apiClient.post<ApiResponse<{ urls: string[]; public_ids: string[] }>>('/upload/prompt-proof', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Legacy method for backward compatibility
    uploadImage: (file: File, type?: 'profile' | 'prompt' | 'proof') => {
        if (type === 'profile') {
            return uploadApi.uploadProfilePhoto(file) as any;
        } else {
            return uploadApi.uploadPromptProof(file) as any;
        }
    },

    // Upload video
    uploadVideo: (file: File) => {
        const formData = new FormData();
        formData.append('video', file);

        return apiClient.post<ApiResponse<{ url: string; public_id: string }>>('/upload/video', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

// ==================== POOL API ====================
export const poolApi = {
    // Get all pools with filters
    getPools: (filters?: {
        type?: string;
        category?: string;
        status?: string;
        featured?: boolean;
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) =>
        apiClient.get<ApiResponse<PaginatedResponse<Pool>>>('/pools', { params: filters }),

    // Get single pool by ID
    getPool: (id: string) =>
        apiClient.get<ApiResponse<{ pool: Pool }>>(`/pools/${id}`),

    // Create new pool (admin/moderator)
    createPool: (data: {
        title: string;
        description: string;
        type: 'collaborative' | 'challenge' | 'voting' | 'resource';
        category: string;
        tags?: string[];
        maxParticipants?: number;
        isPrivate?: boolean;
        requireApproval?: boolean;
        allowVoting?: boolean;
        challenge?: any;
        voting?: any;
    }) =>
        apiClient.post<ApiResponse<{ pool: Pool }>>('/pools', data),

    // Update pool
    updatePool: (id: string, data: Partial<Pool>) =>
        apiClient.put<ApiResponse<{ pool: Pool }>>(`/pools/${id}`, data),

    // Delete pool
    deletePool: (id: string) =>
        apiClient.delete<ApiResponse<null>>(`/pools/${id}`),

    // Join pool
    joinPool: (id: string) =>
        apiClient.post<ApiResponse<{ pool: Pool }>>(`/pools/${id}/join`),

    // Leave pool
    leavePool: (id: string) =>
        apiClient.post<ApiResponse<{ pool: Pool }>>(`/pools/${id}/leave`),

    // Add prompt to pool
    addPromptToPool: (poolId: string, data: { promptId: string }) =>
        apiClient.post<ApiResponse<{ pool: Pool }>>(`/pools/${poolId}/prompts`, data),

    // Vote on prompt in pool
    voteOnPrompt: (poolId: string, promptId: string, voteValue: number) =>
        apiClient.post<ApiResponse<{ vote: any }>>(`/pools/${poolId}/prompts/${promptId}/vote`, { voteValue }),

    // Get pool leaderboard
    getPoolLeaderboard: (poolId: string, limit?: number) =>
        apiClient.get<ApiResponse<{ leaderboard: any[]; pool: any }>>(`/pools/${poolId}/leaderboard`, {
            params: { limit }
        }),

    // Get user's pools
    getMyPools: (filter?: 'all' | 'created' | 'participating' | 'moderating') =>
        apiClient.get<ApiResponse<{ pools: Pool[] }>>('/pools/user/my-pools', {
            params: { filter }
        }),
};

// ==================== FEEDBACK API ====================
export const feedbackApi = {
    // Submit feedback (public - no auth required)
    submitFeedback: (data: {
        name: string;
        email: string;
        subject: string;
        message: string;
        category?: 'bug' | 'feature' | 'improvement' | 'other';
    }) =>
        apiClient.post<ApiResponse<{ feedbackId: string }>>('/feedback', data),
};

// ==================== ADMIN API ====================
export const adminApi = {
    // User Management
    getUsers: (params?: { page?: number; limit?: number }) =>
        apiClient.get<ApiResponse<any>>('/admin/users', { params }),

    getUserById: (userId: string) =>
        apiClient.get<ApiResponse<{ user: User }>>(`/admin/users/${userId}`),

    toggleUserStatus: (userId: string, action: 'block' | 'unblock') =>
        apiClient.put<ApiResponse<{ user: User }>>(`/admin/users/${userId}/status`, { action }),

    toggleMonetization: (userId: string, action: 'enable' | 'disable') =>
        apiClient.put<ApiResponse<{ user: User }>>(`/admin/users/${userId}/monetization`, { action }),

    toggleUserVerification: (userId: string, action: 'verify' | 'unverify') =>
        apiClient.put<ApiResponse<{ user: User }>>(`/admin/users/${userId}/verification`, { action }),

    deleteUser: (userId: string) =>
        apiClient.delete<ApiResponse<null>>(`/admin/users/${userId}`),

    // Prompt Moderation
    getPrompts: (params?: { page?: number; limit?: number }) =>
        apiClient.get<ApiResponse<any>>('/admin/prompts', { params }),

    togglePromptStatus: (promptId: string, action: 'activate' | 'block') =>
        apiClient.put<ApiResponse<{ prompt: Prompt }>>(`/admin/prompts/${promptId}/status`, { action }),

    // Pool Management
    getPools: (params?: { page?: number; limit?: number }) =>
        apiClient.get<ApiResponse<any>>('/admin/pools', { params }),

    deletePool: (poolId: string) =>
        apiClient.delete<ApiResponse<null>>(`/admin/pools/${poolId}`),

    updatePoolStatus: (poolId: string, status: 'active' | 'completed' | 'cancelled' | 'pending') =>
        apiClient.put<ApiResponse<{ pool: Pool }>>(`/admin/pools/${poolId}/status`, { status }),

    // Feedback Management
    getFeedback: (params?: {
        page?: number;
        limit?: number;
        status?: 'new' | 'reviewed' | 'resolved' | 'dismissed';
        category?: 'bug' | 'feature' | 'improvement' | 'other';
        priority?: 'low' | 'medium' | 'high';
    }) =>
        apiClient.get<ApiResponse<any>>('/feedback', { params }),

    updateFeedback: (feedbackId: string, data: {
        status?: 'new' | 'reviewed' | 'resolved' | 'dismissed';
        priority?: 'low' | 'medium' | 'high';
        adminNotes?: string;
    }) =>
        apiClient.put<ApiResponse<any>>(`/feedback/${feedbackId}`, data),

    deleteFeedback: (feedbackId: string) =>
        apiClient.delete<ApiResponse<null>>(`/feedback/${feedbackId}`),

    // Platform Statistics
    getStats: () =>
        apiClient.get<ApiResponse<{ stats: any }>>('/admin/stats'),
};

// Export the configured axios instance for custom requests
export default apiClient;
