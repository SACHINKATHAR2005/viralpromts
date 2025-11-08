import axios from 'axios';
import { ApiResponse, User, Prompt, Comment } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Auth API
export const authApi = {
    register: (data: { username: string; email: string; password: string }) =>
        api.post<ApiResponse<{ user: User }>>('/auth/register', data),

    login: (data: { email: string; password: string }) =>
        api.post<ApiResponse<{ user: User }>>('/auth/login', data),

    logout: () => api.post<ApiResponse<null>>('/auth/logout'),

    getProfile: () => api.get<ApiResponse<{ user: User }>>('/auth/profile'),
};

// Prompts API
export const promptsApi = {
    getPrompts: (params?: { page?: number; category?: string; search?: string }) =>
        api.get<ApiResponse<{ prompts: Prompt[]; pagination: any }>>('/prompts', { params }),

    getPrompt: (id: string) =>
        api.get<ApiResponse<{ prompt: Prompt }>>(`/prompts/${id}`),

    createPrompt: (data: Partial<Prompt>) =>
        api.post<ApiResponse<{ prompt: Prompt }>>('/prompts', data),

    updatePrompt: (id: string, data: Partial<Prompt>) =>
        api.put<ApiResponse<{ prompt: Prompt }>>(`/prompts/${id}`, data),

    deletePrompt: (id: string) =>
        api.delete<ApiResponse<null>>(`/prompts/${id}`),
};

// Social API
export const socialApi = {
    likePrompt: (promptId: string) =>
        api.post<ApiResponse<any>>(`/social/like/${promptId}`),

    unlikePrompt: (promptId: string) =>
        api.delete<ApiResponse<any>>(`/social/like/${promptId}`),

    savePrompt: (promptId: string, data?: { collectionName?: string; notes?: string }) =>
        api.post<ApiResponse<any>>(`/social/save/${promptId}`, data),

    addComment: (promptId: string, data: { content: string; parentComment?: string }) =>
        api.post<ApiResponse<{ comment: Comment }>>(`/social/comment/${promptId}`, data),

    getComments: (promptId: string, params?: { page?: number; limit?: number }) =>
        api.get<ApiResponse<{ comments: Comment[] }>>(`/social/comments/${promptId}`, { params }),

    followUser: (userId: string) =>
        api.post<ApiResponse<any>>(`/social/follow/${userId}`),

    unfollowUser: (userId: string) =>
        api.delete<ApiResponse<any>>(`/social/follow/${userId}`),
};

export default api;