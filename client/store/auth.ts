import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/types';
import { authApi } from '@/lib/api';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            isAuthenticated: false,

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const response = await authApi.login({ email, password });
                    if (response.data.success && response.data.data) {
                        set({
                            user: response.data.data.user,
                            isAuthenticated: true,
                            isLoading: false
                        });
                    }
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            register: async (username: string, email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const response = await authApi.register({ username, email, password });
                    if (response.data.success && response.data.data) {
                        set({
                            user: response.data.data.user,
                            isAuthenticated: true,
                            isLoading: false
                        });
                    }
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await authApi.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    set({ user: null, isAuthenticated: false });
                }
            },

            fetchProfile: async () => {
                set({ isLoading: true });
                try {
                    const response = await authApi.getProfile();
                    if (response.data.success && response.data.data) {
                        set({
                            user: response.data.data.user,
                            isAuthenticated: true,
                            isLoading: false
                        });
                    }
                } catch (error) {
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            },

            setUser: (user: User | null) => {
                set({ user, isAuthenticated: !!user });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);