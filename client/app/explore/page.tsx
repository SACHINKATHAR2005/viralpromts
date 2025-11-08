'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Search,
    Sparkles,
    Heart,
    MessageCircle,
    Bookmark,
    TrendingUp,
    Filter,
    SlidersHorizontal,
    User,
    LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePromptStore } from '@/store/usePromptStore';
import { promptsApi } from '@/lib/api/client';
import { CATEGORIES, AI_PLATFORMS } from '@/lib/types/index';
import type { Prompt } from '@/lib/types/index';

export default function ExplorePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { prompts, filters, setPrompts, setFilters, setLoading, isLoading } = usePromptStore();

    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Handle URL search params
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch) {
            setSearchQuery(urlSearch);
            setFilters({ search: urlSearch, page: 1 });
        }
    }, [searchParams]);

    useEffect(() => {
        fetchPrompts();
    }, [filters]);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const response = await promptsApi.getPrompts(filters);
            if (response.data.success && response.data.data) {
                // Backend returns 'prompts' array
                const data = response.data.data as any;
                setPrompts(data.prompts || []);
            }
        } catch (error) {
            console.error('Failed to fetch prompts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters({ search: searchQuery, page: 1 });
    };

    const handleCategoryFilter = (category: string) => {
        setFilters({ category: category === filters.category ? '' : category });
    };

    const handleSortChange = (sortBy: 'latest' | 'trending' | 'popular' | 'rating') => {
        setFilters({ sortBy });
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Search Bar Section */}
            <div className="border-b bg-white dark:bg-zinc-900 py-4">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    type="search"
                                    placeholder="Search prompts, creators, tags..."
                                    className="pl-10 pr-4 h-12 bg-zinc-100 dark:bg-zinc-800 border-none text-base"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>

                        {/* Filter Button */}
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <SlidersHorizontal className="h-5 w-5" />
                            <span className="hidden sm:inline">Filters</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Advanced Filters Bar */}
            {showFilters && (
                <div className="border-b bg-white dark:bg-zinc-900 py-4">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="space-y-4">
                            {/* Sort Options */}
                            <div>
                                <p className="text-sm font-medium mb-2">Sort by:</p>
                                <div className="flex flex-wrap gap-2">
                                    {(['latest', 'trending', 'popular', 'rating'] as const).map((sort) => (
                                        <Badge
                                            key={sort}
                                            variant={filters.sortBy === sort ? 'default' : 'outline'}
                                            className="cursor-pointer capitalize"
                                            onClick={() => handleSortChange(sort)}
                                        >
                                            {sort === 'latest' && <TrendingUp className="mr-1 h-3 w-3" />}
                                            {sort}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <p className="text-sm font-medium mb-2">Categories:</p>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map((category) => (
                                        <Badge
                                            key={category}
                                            variant={filters.category === category ? 'default' : 'outline'}
                                            className="cursor-pointer"
                                            onClick={() => handleCategoryFilter(category)}
                                        >
                                            {category}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* AI Platforms */}
                            <div>
                                <p className="text-sm font-medium mb-2">AI Platform:</p>
                                <div className="flex flex-wrap gap-2">
                                    {AI_PLATFORMS.map((platform) => (
                                        <Badge
                                            key={platform}
                                            variant="outline"
                                            className="cursor-pointer"
                                        >
                                            {platform}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Filters */}
            <div className="border-b bg-white dark:bg-zinc-900 py-3">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        <Badge
                            variant={!filters.category ? 'default' : 'outline'}
                            className="cursor-pointer whitespace-nowrap"
                            onClick={() => setFilters({ category: '' })}
                        >
                            All
                        </Badge>
                        {CATEGORIES.slice(0, 6).map((category) => (
                            <Badge
                                key={category}
                                variant={filters.category === category ? 'default' : 'outline'}
                                className="cursor-pointer whitespace-nowrap"
                                onClick={() => handleCategoryFilter(category)}
                            >
                                {category}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : !prompts || prompts.length === 0 ? (
                    <div className="text-center py-16">
                        <Sparkles className="mx-auto h-16 w-16 text-zinc-300 mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                            No prompts found
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Try adjusting your filters or search query
                        </p>
                    </div>
                ) : (
                    <InstagramGrid prompts={prompts} />
                )}
            </main>
        </div>
    );
}

// Instagram Grid Component
function InstagramGrid({ prompts }: { prompts: Prompt[] }) {
    const router = useRouter();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {prompts.map((prompt) => {
                const creator = typeof prompt.creator === 'object' ? prompt.creator : null;

                return (
                    <div
                        key={prompt._id}
                        className="group relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900 cursor-pointer"
                        onClick={() => router.push(`/prompts/${prompt._id}`)}
                    >
                        {/* Image */}
                        {prompt.proofImages && prompt.proofImages.length > 0 ? (
                            <img
                                src={prompt.proofImages[0]}
                                alt={prompt.title}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                        ) : (
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
                            </div>
                        </div>

                        {/* Caption & User Info Overlay (Bottom) */}
                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4">
                            <div className="flex items-start justify-between gap-3">
                                {/* Left: User Info */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {creator && (
                                        <>
                                            {creator.profilePicture ? (
                                                <img
                                                    src={creator.profilePicture}
                                                    alt={creator.username}
                                                    className="h-8 w-8 rounded-full object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                    {creator.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-white text-sm font-semibold truncate">
                                                    {creator.username}
                                                </p>
                                                <p className="text-white/80 text-xs truncate">
                                                    {prompt.title}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Right: Like & Price */}
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
                );
            })}
        </div>
    );
}

// Old Masonry Grid Component (Deprecated)
function MasonryGrid({ prompts }: { prompts: Prompt[] }) {
    const router = useRouter();

    return (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {prompts.map((prompt) => (
                <PromptCard key={prompt._id} prompt={prompt} onClick={() => router.push(`/prompts/${prompt._id}`)} />
            ))}
        </div>
    );
}

// Prompt Card Component
function PromptCard({ prompt, onClick }: { prompt: Prompt; onClick: () => void }) {
    const [isHovered, setIsHovered] = useState(false);
    const { toggleLike, toggleSave } = usePromptStore();
    const { isAuthenticated } = useAuthStore();

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            alert('Please login to like prompts');
            return;
        }
        toggleLike(prompt._id);
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            alert('Please login to save prompts');
            return;
        }
        toggleSave(prompt._id);
    };

    const creator = typeof prompt.creator === 'object' ? prompt.creator : null;

    return (
        <Card
            className="group relative break-inside-avoid mb-4 overflow-hidden cursor-pointer transition-all hover:shadow-xl border-zinc-200 dark:border-zinc-800"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {/* Image */}
            {prompt.proofImages && prompt.proofImages.length > 0 && (
                <div className="relative aspect-auto">
                    <img
                        src={prompt.proofImages[0]}
                        alt={prompt.title}
                        className="w-full h-auto object-cover"
                    />
                    {/* Overlay on Hover */}
                    {isHovered && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white/90 hover:bg-white"
                                onClick={handleSave}
                            >
                                <Bookmark className={`h-4 w-4 ${prompt.isSaved ? 'fill-current' : ''}`} />
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white/90 hover:bg-white"
                                onClick={handleLike}
                            >
                                <Heart className={`h-4 w-4 ${prompt.isLiked ? 'fill-current text-red-500' : ''}`} />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-lg line-clamp-2 text-zinc-900 dark:text-zinc-100">
                    {prompt.title}
                </h3>

                {/* Description */}
                {prompt.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                        {prompt.description}
                    </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                        {prompt.category}
                    </Badge>
                    {prompt.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-zinc-500">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {prompt.stats.totalLikes}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {prompt.stats.totalComments}
                        </span>
                    </div>
                    {prompt.isPaid && (
                        <Badge variant="default" className="bg-green-600">
                            ${prompt.price}
                        </Badge>
                    )}
                </div>

                {/* Creator */}
                {creator && (
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="h-8 w-8 rounded-full bg-linear-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-semibold">
                            {creator.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {creator.username}
                        </span>
                        {creator.isVerified && (
                            <Sparkles className="h-4 w-4 text-purple-600" />
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
