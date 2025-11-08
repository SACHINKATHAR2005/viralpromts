import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/types/index';
import { authApi } from '@/lib/api/client';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    setUser: (user: User | null) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                console.log('🔐 AUTH STORE - Login called with:', { email, passwordLength: password.length });
                try {
                    console.log('📤 AUTH STORE - Calling authApi.login...');
                    const response = await authApi.login({ email, password });
                    console.log('📥 AUTH STORE - Login response:', response.data);

                    if (response.data.success && response.data.data) {
                        console.log('✅ AUTH STORE - Login successful, user:', response.data.data.user);
                        set({
                            user: response.data.data.user,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null
                        });
                    } else {
                        console.error('❌ AUTH STORE - Response success is false or no data');
                        throw new Error('Login failed - Invalid response');
                    }
                } catch (error: any) {
                    console.error('❌ AUTH STORE - Login error:', error);
                    console.error('❌ AUTH STORE - Error response:', error.response?.data);
                    console.error('❌ AUTH STORE - Error status:', error.response?.status);
                    const errorMessage = error.response?.data?.message || 'Login failed';
                    set({ isLoading: false, error: errorMessage });
                    throw error;
                }
            },

            register: async (username: string, email: string, password: string) => {
                set({ isLoading: true, error: null });
                console.log('🔐 AUTH STORE - Register called with:', { username, email, passwordLength: password.length });
                try {
                    console.log('📤 AUTH STORE - Calling authApi.register...');
                    const response = await authApi.register({ username, email, password });
                    console.log('📥 AUTH STORE - Register response:', response.data);

                    if (response.data.success && response.data.data) {
                        console.log('✅ AUTH STORE - Registration successful, user:', response.data.data.user);
                        set({
                            user: response.data.data.user,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null
                        });
                    } else {
                        console.error('❌ AUTH STORE - Response success is false or no data');
                        throw new Error('Registration failed - Invalid response');
                    }
                } catch (error: any) {
                    console.error('❌ AUTH STORE - Registration error:', error);
                    console.error('❌ AUTH STORE - Error response:', error.response?.data);
                    console.error('❌ AUTH STORE - Error status:', error.response?.status);
                    console.error('❌ AUTH STORE - Error message:', error.message);
                    const errorMessage = error.response?.data?.message || 'Registration failed';
                    set({ isLoading: false, error: errorMessage });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await authApi.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    set({ user: null, isAuthenticated: false, error: null });
                }
            },

            fetchProfile: async () => {
                set({ isLoading: true });
                console.log('🔍 AUTH STORE - Fetching profile...');
                try {
                    const response = await authApi.getProfile();
                    console.log('📥 AUTH STORE - Profile response:', response.data);
                    if (response.data.success && response.data.data) {
                        console.log('✅ AUTH STORE - Profile fetched successfully:', response.data.data.user.username);
                        set({
                            user: response.data.data.user,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null
                        });
                    } else {
                        console.error('❌ AUTH STORE - Profile fetch failed, no data');
                        set({ user: null, isAuthenticated: false, isLoading: false });
                    }
                } catch (error: any) {
                    console.error('❌ AUTH STORE - Profile fetch error:', error.response?.status, error.message);
                    set({ user: null, isAuthenticated: false, isLoading: false });
                    throw error;
                }
            },

            updateProfile: async (data: Partial<User>) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.updateProfile(data);
                    if (response.data.success && response.data.data) {
                        set({
                            user: response.data.data.user,
                            isLoading: false,
                            error: null
                        });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Profile update failed';
                    set({ isLoading: false, error: errorMessage });
                    throw error;
                }
            },

            setUser: (user: User | null) => {
                set({ user, isAuthenticated: !!user });
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
            skipHydration: true,
        }
    )
);

// Initialize store on client-side only
if (typeof window !== 'undefined') {
    useAuthStore.persist.rehydrate();
}
