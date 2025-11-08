'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    redirectTo?: string;
}

export default function ProtectedRoute({
    children,
    requireAuth = true,
    redirectTo = '/login'
}: ProtectedRouteProps) {
    const router = useRouter();
    const { isAuthenticated, isLoading, user, fetchProfile } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            // If we already have user in state (from localStorage), no need to fetch
            if (user && isAuthenticated) {
                console.log('✅ User already authenticated from localStorage:', user.username);
                setIsChecking(false);
                return;
            }

            // Try to fetch profile from backend (will use cookie)
            try {
                console.log('🔍 Checking authentication with backend...');
                await fetchProfile();
                setIsChecking(false);
            } catch (error) {
                console.log('❌ Not authenticated, redirecting to login');
                setIsChecking(false);
                if (requireAuth) {
                    router.push(redirectTo);
                }
            }
        };

        checkAuth();
    }, []);

    // Show loading state while checking auth
    if (isChecking || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render children if auth is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
