'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Heart,
    Bookmark,
    Share2,
    Copy,
    Star,
    MessageCircle,
    TrendingUp,
    User,
    Calendar,
    Eye,
    ArrowLeft,
    MoreVertical,
    ThumbsUp,
    Send,
    X,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePromptStore } from '@/store/usePromptStore';
import { promptsApi, socialApi } from '@/lib/api/client';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import type { Prompt, Comment } from '@/lib/types/index';
import { toast } from 'sonner';

export default function PromptDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { selectedPrompt, setSelectedPrompt, toggleLike, toggleSave, incrementStat } = usePromptStore();

    const [isLoading, setIsLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [relatedPrompts, setRelatedPrompts] = useState<Prompt[]>([]);
    const [showFullPrompt, setShowFullPrompt] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchPrompt(params.id as string);
            fetchComments(params.id as string);
        }
    }, [params.id]);

    const fetchPrompt = async (id: string) => {
        try {
            setIsLoading(true);
            const response = await promptsApi.getPrompt(id);
            if (response.data.success && response.data.data) {
                setSelectedPrompt(response.data.data.prompt);
                // Fetch related prompts
                fetchRelatedPrompts(response.data.data.prompt);
            }
        } catch (error) {
            console.error('Error fetching prompt:', error);
            router.push('/404');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRelatedPrompts = async (prompt: Prompt) => {
        try {
            const response = await promptsApi.getPrompts({
                category: prompt.category,
                limit: 4,
            });
            if (response.data.success && response.data.data) {
                // Backend returns 'prompts' array, not 'items'
                const data = response.data.data as any;
                const prompts = data.prompts || [];
                setRelatedPrompts(
                    prompts.filter((p: Prompt) => p._id !== prompt._id).slice(0, 3)
                );
            }
        } catch (error) {
            console.error('Error fetching related prompts:', error);
        }
    };

    const fetchComments = async (promptId: string) => {
        try {
            const response = await socialApi.getComments(promptId);
            if (response.data.success && response.data.data) {
                // Backend returns 'comments' array
                const data = response.data.data as any;
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

        if (!selectedPrompt) return;

        try {
            if (selectedPrompt.isLiked) {
                await socialApi.unlikePrompt(selectedPrompt._id);
                toast.success('Removed from liked prompts');
            } else {
                await socialApi.likePrompt(selectedPrompt._id);
                toast.success('Added to liked prompts');
            }
            toggleLike(selectedPrompt._id);
        } catch (error) {
            console.error('Error toggling like:', error);
            toast.error('Failed to update like status');
        }
    };

    const handleSave = async () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

        if (!selectedPrompt) return;

        try {
            await socialApi.savePrompt(selectedPrompt._id);
            toggleSave(selectedPrompt._id);
            toast.success('Prompt saved successfully');
        } catch (error) {
            console.error('Error saving prompt:', error);
            toast.error('Failed to save prompt');
        }
    };

    const handleCopy = async () => {
        if (!selectedPrompt) return;

        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

        try {
            toast.loading('Copying prompt...', { id: 'copy-prompt' });

            // Call the copy endpoint to get decrypted prompt
            const response = await promptsApi.copyPrompt(selectedPrompt._id);

            if (response.data.success && response.data.data) {
                const decryptedPrompt = response.data.data.prompt.promptText;

                // Copy to clipboard
                await navigator.clipboard.writeText(decryptedPrompt);

                // Update stats
                incrementStat(selectedPrompt._id, 'copies');

                // Success message
                toast.success('Prompt copied to clipboard successfully!', { id: 'copy-prompt' });
            }
        } catch (error: any) {
            console.error('Error copying prompt:', error);
            const errorMsg = error.response?.data?.message || 'Failed to copy prompt';
            toast.error(errorMsg, { id: 'copy-prompt' });
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: selectedPrompt?.title,
                    text: selectedPrompt?.description,
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

        if (!newComment.trim() || !selectedPrompt) return;

        try {
            setIsSubmittingComment(true);
            const response = await socialApi.addComment(selectedPrompt._id, {
                content: newComment,
            });
            if (response.data.success && response.data.data) {
                setComments([response.data.data.comment, ...comments]);
                setNewComment('');
                incrementStat(selectedPrompt._id, 'comments');
                toast.success('Comment posted successfully');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            toast.error('Failed to post comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!selectedPrompt) {
        return null;
    }

    const creator = typeof selectedPrompt.creator === 'string' ? null : selectedPrompt.creator;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Main Content */}
            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>

                {/* Title & Category */}
                <div className="mb-6">
                    <Badge variant="secondary" className="mb-3">
                        {selectedPrompt.category}
                    </Badge>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                        {selectedPrompt.title}
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                        {selectedPrompt.description}
                    </p>
                </div>

                {/* Creator Info & Stats */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b">
                    <div className="flex items-center gap-3">
                        {creator && (
                            <Link href={`/profile/${creator.username}`}>
                                <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                    {creator.profilePicture ? (
                                        <img
                                            src={creator.profilePicture}
                                            alt={creator.username}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                                            {creator.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold">{creator.username}</p>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            {creator.stats?.followersCount || 0} followers
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {selectedPrompt.stats.views}
                        </div>
                        <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {selectedPrompt.stats.totalLikes}
                        </div>
                        <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {selectedPrompt.stats.totalComments}
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDistanceToNow(new Date(selectedPrompt.createdAt), { addSuffix: true })}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <Button
                        variant={selectedPrompt.isLiked ? 'default' : 'outline'}
                        onClick={handleLike}
                        className="flex-1 sm:flex-none"
                    >
                        <Heart
                            className={`h-4 w-4 mr-2 ${selectedPrompt.isLiked ? 'fill-current' : ''}`}
                        />
                        {selectedPrompt.isLiked ? 'Liked' : 'Like'}
                    </Button>
                    <Button
                        variant={selectedPrompt.isSaved ? 'default' : 'outline'}
                        onClick={handleSave}
                        className="flex-1 sm:flex-none"
                    >
                        <Bookmark
                            className={`h-4 w-4 mr-2 ${selectedPrompt.isSaved ? 'fill-current' : ''}`}
                        />
                        {selectedPrompt.isSaved ? 'Saved' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={handleCopy} className="flex-1 sm:flex-none">
                        <Copy className="h-4 w-4 mr-2" />
                        {selectedPrompt.isPaid ? `Copy ($${selectedPrompt.price})` : 'Copy'}
                    </Button>
                    <Button variant="outline" onClick={handleShare} className="flex-1 sm:flex-none">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                </div>

                {/* Prompt Content */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">The Prompt</h2>
                            {selectedPrompt.isPaid && (
                                <Badge variant="outline" className="text-green-600">
                                    ${selectedPrompt.price}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <div className="bg-zinc-100 dark:bg-zinc-900 p-8 rounded-lg text-center">
                                <div className="mb-4">
                                    <Copy className="h-12 w-12 mx-auto text-zinc-400 mb-3" />
                                    <h3 className="text-lg font-semibold mb-2">
                                        Protected Content
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {selectedPrompt.isPaid
                                            ? `This is a premium prompt. Click "Copy" to unlock and copy to clipboard.`
                                            : selectedPrompt.privacy === 'followers'
                                                ? 'This prompt is visible to followers only. Click "Copy" to get the full prompt.'
                                                : 'Click the "Copy" button below to get this prompt in your clipboard.'}
                                    </p>
                                </div>
                                <Button onClick={handleCopy} size="lg">
                                    <Copy className="h-4 w-4 mr-2" />
                                    {selectedPrompt.isPaid ? `Copy Prompt ($${selectedPrompt.price})` : 'Copy Prompt'}
                                </Button>
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3">
                                    Prompts are encrypted to prevent web scraping and unauthorized access
                                </p>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            {selectedPrompt.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    #{tag}
                                </Badge>
                            ))}
                        </div>

                        {/* AI Platforms */}
                        <div className="mt-4">
                            <p className="text-sm font-semibold mb-2">Compatible with:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedPrompt.aiPlatform.map((platform) => (
                                    <Badge key={platform} variant="outline">
                                        {platform}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Proof Images */}
                {selectedPrompt.proofImages.length > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Example Results</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedPrompt.proofImages.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`Result ${index + 1}`}
                                        className="w-full h-auto rounded-lg"
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Rating */}
                {selectedPrompt.ratings.count > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Ratings</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex items-center gap-1 text-2xl font-bold">
                                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                                    {selectedPrompt.ratings.average.toFixed(1)}
                                </div>
                                <span className="text-zinc-600 dark:text-zinc-400">
                                    ({selectedPrompt.ratings.count} ratings)
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Effectiveness</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(selectedPrompt.ratings.breakdown.effectiveness / 5) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {selectedPrompt.ratings.breakdown.effectiveness.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Clarity</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(selectedPrompt.ratings.breakdown.clarity / 5) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {selectedPrompt.ratings.breakdown.clarity.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Creativity</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(selectedPrompt.ratings.breakdown.creativity / 5) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {selectedPrompt.ratings.breakdown.creativity.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Value</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(selectedPrompt.ratings.breakdown.value / 5) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {selectedPrompt.ratings.breakdown.value.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Comments Section */}
                <Card className="mb-8">
                    <CardHeader>
                        <h2 className="text-xl font-semibold">
                            Comments ({selectedPrompt.stats.totalComments})
                        </h2>
                    </CardHeader>
                    <CardContent>
                        {/* Add Comment Form */}
                        {isAuthenticated ? (
                            <form onSubmit={handleCommentSubmit} className="mb-6">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="submit" disabled={isSubmittingComment || !newComment.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-center">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                                    Sign in to leave a comment
                                </p>
                                <Button size="sm" onClick={() => setShowLoginModal(true)}>
                                    Sign In
                                </Button>
                            </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-4">
                            {!comments || comments.length === 0 ? (
                                <p className="text-center text-zinc-600 dark:text-zinc-400 py-8">
                                    No comments yet. Be the first to comment!
                                </p>
                            ) : (
                                comments.map((comment) => {
                                    // Backend returns 'user' field when populated
                                    const commentUser = comment.user || (typeof comment.userId === 'string' ? null : comment.userId);
                                    return (
                                        <div key={comment._id} className="flex gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                            {commentUser?.profilePicture ? (
                                                <img
                                                    src={commentUser.profilePicture}
                                                    alt={commentUser.username || 'User'}
                                                    className="h-10 w-10 rounded-full object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-semibold shrink-0">
                                                    {commentUser?.username?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold text-sm">
                                                        {commentUser?.username || 'Anonymous'}
                                                    </p>
                                                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                                        {formatDistanceToNow(new Date(comment.createdAt), {
                                                            addSuffix: true,
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{comment.content}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Related Prompts */}
                {relatedPrompts && relatedPrompts.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Related Prompts</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {relatedPrompts.map((prompt) => (
                                <Link key={prompt._id} href={`/prompts/${prompt._id}`}>
                                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                                        <CardHeader>
                                            <Badge variant="secondary" className="w-fit mb-2">
                                                {prompt.category}
                                            </Badge>
                                            <h3 className="font-semibold line-clamp-2">{prompt.title}</h3>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                                                {prompt.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                                                <div className="flex items-center gap-2">
                                                    <Heart className="h-3 w-3" />
                                                    {prompt.stats.totalLikes}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Star className="h-3 w-3" />
                                                    {prompt.ratings.average.toFixed(1)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
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
                        <CardHeader>
                            <div className="text-center">
                                <div className="mx-auto w-12 h-12 bg-linear-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
                                    <User className="h-6 w-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Sign in to continue</h2>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Join our community to like, save, and interact with prompts
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent>
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
