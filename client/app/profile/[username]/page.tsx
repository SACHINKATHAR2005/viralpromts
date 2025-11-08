'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Link as LinkIcon,
    Calendar,
    Grid,
    Star,
    MessageCircle,
    Copy,
    Heart,
    Users,
    ArrowLeft,
    User,
    X,
} from 'lucide-react';
import { promptsApi } from '@/lib/api/client';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import type { User as UserType, Prompt } from '@/lib/types/index';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser, isAuthenticated } = useAuthStore();
    const username = params.username as string;

    const [user, setUser] = useState<UserType | null>(null);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'prompts'>('prompts');
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        if (username) {
            fetchUserProfile();
        }
    }, [username]);

    const fetchUserProfile = async () => {
        try {
            setIsLoading(true);

            // Fetch all prompts and filter by creator username
            const promptsResponse = await promptsApi.getPrompts({
                limit: 100,
            });

            if (promptsResponse.data.success && promptsResponse.data.data) {
                const data = promptsResponse.data.data as any;
                const allPrompts = data.prompts || [];

                // Filter prompts by creator username and only show public (non-paid) ones
                const userPrompts = allPrompts.filter(
                    (p: Prompt) => {
                        const creator = typeof p.creator === 'string' ? null : p.creator;
                        return creator?.username === username;
                    }
                );

                if (userPrompts.length > 0 && userPrompts[0].creator) {
                    setUser(userPrompts[0].creator as UserType);
                    setPrompts(userPrompts);
                } else {
                    throw new Error('User not found');
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            toast.error('User not found');
            router.push('/explore');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollow = () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        // TODO: Implement follow functionality
        toast.success('Follow functionality coming soon!');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // If viewing own profile, redirect to /profile
    if (currentUser && currentUser.username === username) {
        router.push('/profile');
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Profile Header */}
            <div className="border-b bg-white dark:bg-zinc-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Avatar */}
                        <div className="relative">
                            {user.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt={user.username}
                                    className="h-32 w-32 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-32 w-32 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-4xl font-bold">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {user.isVerified && (
                                <div className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-1">
                                    <Star className="h-4 w-4 text-white fill-white" />
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{user.username}</h1>
                                {user.role === 'admin' && (
                                    <Badge variant="default">Admin</Badge>
                                )}
                            </div>
                            {user.bio && (
                                <p className="text-zinc-600 dark:text-zinc-400 mb-4">{user.bio}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                {user.website && (
                                    <a
                                        href={user.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-purple-600"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        {user.website}
                                    </a>
                                )}
                                {user.createdAt && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4 mb-4">
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span className="font-semibold">{user.stats?.followersCount || 0}</span>{' '}
                                    <span className="text-zinc-600 dark:text-zinc-400">followers</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold">{user.stats?.followingCount || 0}</span>{' '}
                                    <span className="text-zinc-600 dark:text-zinc-400">following</span>
                                </div>
                            </div>
                            <Button onClick={handleFollow}>
                                Follow
                            </Button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {prompts.length}
                                    </div>
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Prompts</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {user.stats?.totalCopies || 0}
                                    </div>
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Copies</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {user.reputation?.score || 0}
                                    </div>
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Reputation</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-pink-600">
                                        {user.reputation?.badges?.length || 0}
                                    </div>
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Badges</div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b bg-white dark:bg-zinc-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('prompts')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'prompts'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                        >
                            <Grid className="h-4 w-4" />
                            Public Prompts
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'prompts' && (
                    <div>
                        {!prompts || prompts.length === 0 ? (
                            <div className="text-center py-12">
                                <Grid className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No public prompts yet</h3>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    This user hasn't published any prompts
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                                {prompts.map((prompt) => (
                                    <Link key={prompt._id} href={`/prompts/${prompt._id}`}>
                                        <div className="group relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900 cursor-pointer">
                                            {/* Image */}
                                            {prompt.proofImages && prompt.proofImages.length > 0 && (
                                                <img
                                                    src={prompt.proofImages[0]}
                                                    alt={prompt.title}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                />
                                            )}
                                            {(!prompt.proofImages || prompt.proofImages.length === 0) && (
                                                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-600 to-pink-600">
                                                    <span className="text-6xl font-bold text-white">
                                                        {prompt.title.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-4">
                                                {/* Stats */}
                                                <div className="flex items-center gap-6 text-white">
                                                    <div className="flex items-center gap-2">
                                                        <Heart className="h-5 w-5 fill-white" />
                                                        <span className="font-semibold">{prompt.stats?.totalLikes || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MessageCircle className="h-5 w-5 fill-white" />
                                                        <span className="font-semibold">{prompt.stats?.totalComments || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Copy className="h-5 w-5" />
                                                        <span className="font-semibold">{prompt.stats?.copies || 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Caption & User Info Overlay (Bottom) */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    {/* Left: User Info */}
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        {user.profilePicture ? (
                                                            <img
                                                                src={user.profilePicture}
                                                                alt={user.username}
                                                                className="h-8 w-8 rounded-full object-cover shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                                {user.username.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-white text-sm font-semibold truncate">
                                                                {user.username}
                                                            </p>
                                                            <p className="text-white/80 text-xs truncate">
                                                                {prompt.title}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Right: Like & Save Icons */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <div className="flex items-center gap-1 text-white">
                                                            <Heart className="h-4 w-4" />
                                                            <span className="text-xs">{prompt.stats?.totalLikes || 0}</span>
                                                        </div>
                                                        {prompt.isPaid && (
                                                            <Badge variant="outline" className="text-green-400 border-green-400 text-xs">
                                                                ${prompt.price}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2"
                            onClick={() => setShowLoginModal(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="mx-auto w-12 h-12 bg-linear-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
                                    <User className="h-6 w-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Sign in to follow {user?.username}</h2>
                                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                                    Join our community to follow creators and stay updated with their latest prompts
                                </p>
                            </div>
                            <div className="space-y-3">
                                <Link href="/login" className="block">
                                    <Button className="w-full" size="lg">
                                        Sign In
                                    </Button>
                                </Link>
                                <Link href="/register" className="block">
                                    <Button variant="outline" className="w-full" size="lg">
                                        Create Account
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => setShowLoginModal(false)}
                                >
                                    Continue Browsing
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
