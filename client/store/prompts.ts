import { create } from 'zustand';
import { Prompt } from '@/lib/types';

interface PromptState {
    prompts: Prompt[];
    selectedPrompt: Prompt | null;
    isLoading: boolean;
    currentPage: number;
    hasMore: boolean;
    filters: {
        category: string;
        search: string;
    };
    setPrompts: (prompts: Prompt[]) => void;
    addPrompts: (prompts: Prompt[]) => void;
    setSelectedPrompt: (prompt: Prompt | null) => void;
    setLoading: (loading: boolean) => void;
    setFilters: (filters: Partial<PromptState['filters']>) => void;
    updatePrompt: (promptId: string, updates: Partial<Prompt>) => void;
    removePrompt: (promptId: string) => void;
}

export const usePromptStore = create<PromptState>((set, get) => ({
    prompts: [],
    selectedPrompt: null,
    isLoading: false,
    currentPage: 1,
    hasMore: true,
    filters: {
        category: '',
        search: '',
    },

    setPrompts: (prompts) => set({ prompts }),

    addPrompts: (newPrompts) => set((state) => ({
        prompts: [...state.prompts, ...newPrompts]
    })),

    setSelectedPrompt: (prompt) => set({ selectedPrompt: prompt }),

    setLoading: (loading) => set({ isLoading: loading }),

    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
    })),

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
}));