import { create } from 'zustand';
import type { Prompt, PromptFilters } from '@/lib/types/index';

interface PromptState {
    prompts: Prompt[];
    selectedPrompt: Prompt | null;
    isLoading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
    filters: PromptFilters;

    // Actions
    setPrompts: (prompts: Prompt[]) => void;
    addPrompts: (prompts: Prompt[]) => void;
    setSelectedPrompt: (prompt: Prompt | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setFilters: (filters: Partial<PromptFilters>) => void;
    resetFilters: () => void;
    updatePrompt: (promptId: string, updates: Partial<Prompt>) => void;
    removePrompt: (promptId: string) => void;
    setPage: (page: number) => void;
    toggleLike: (promptId: string) => void;
    toggleSave: (promptId: string) => void;
    incrementStat: (promptId: string, stat: 'likes' | 'comments' | 'views' | 'copies') => void;
    clearPrompts: () => void;
}

const initialFilters: PromptFilters = {
    category: '',
    search: '',
    sortBy: 'latest',
    page: 1,
    limit: 20,
};

export const usePromptStore = create<PromptState>((set, get) => ({
    prompts: [],
    selectedPrompt: null,
    isLoading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    hasMore: true,
    filters: initialFilters,

    setPrompts: (prompts) => set({ prompts, currentPage: 1 }),

    addPrompts: (newPrompts) => set((state) => ({
        prompts: [...state.prompts, ...newPrompts]
    })),

    setSelectedPrompt: (prompt) => set({ selectedPrompt: prompt }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
        currentPage: 1, // Reset to first page when filters change
    })),

    resetFilters: () => set({
        filters: initialFilters,
        currentPage: 1
    }),

    updatePrompt: (promptId, updates) => set((state) => ({
        prompts: state.prompts.map(prompt =>
            prompt._id === promptId ? { ...prompt, ...updates } : prompt
        ),
        selectedPrompt: state.selectedPrompt?._id === promptId
            ? { ...state.selectedPrompt, ...updates }
            : state.selectedPrompt
    })),

    removePrompt: (promptId) => set((state) => ({
        prompts: state.prompts.filter(prompt => prompt._id !== promptId),
        selectedPrompt: state.selectedPrompt?._id === promptId ? null : state.selectedPrompt
    })),

    setPage: (page) => set({ currentPage: page }),

    toggleLike: (promptId) => set((state) => ({
        prompts: state.prompts.map(prompt => {
            if (prompt._id === promptId) {
                const isLiked = !prompt.isLiked;
                return {
                    ...prompt,
                    isLiked,
                    stats: {
                        ...prompt.stats,
                        totalLikes: prompt.stats.totalLikes + (isLiked ? 1 : -1)
                    }
                };
            }
            return prompt;
        }),
        selectedPrompt: state.selectedPrompt?._id === promptId
            ? {
                ...state.selectedPrompt,
                isLiked: !state.selectedPrompt.isLiked,
                stats: {
                    ...state.selectedPrompt.stats,
                    totalLikes: state.selectedPrompt.stats.totalLikes + (state.selectedPrompt.isLiked ? -1 : 1)
                }
            }
            : state.selectedPrompt
    })),

    toggleSave: (promptId) => set((state) => ({
        prompts: state.prompts.map(prompt =>
            prompt._id === promptId ? { ...prompt, isSaved: !prompt.isSaved } : prompt
        ),
        selectedPrompt: state.selectedPrompt?._id === promptId
            ? { ...state.selectedPrompt, isSaved: !state.selectedPrompt.isSaved }
            : state.selectedPrompt
    })),

    incrementStat: (promptId, stat) => set((state) => ({
        prompts: state.prompts.map(prompt => {
            if (prompt._id === promptId) {
                return {
                    ...prompt,
                    stats: {
                        ...prompt.stats,
                        [stat]: prompt.stats[stat] + 1
                    }
                };
            }
            return prompt;
        }),
        selectedPrompt: state.selectedPrompt?._id === promptId
            ? {
                ...state.selectedPrompt,
                stats: {
                    ...state.selectedPrompt.stats,
                    [stat]: state.selectedPrompt.stats[stat] + 1
                }
            }
            : state.selectedPrompt
    })),

    clearPrompts: () => set({
        prompts: [],
        selectedPrompt: null,
        currentPage: 1,
        error: null
    }),
}));
