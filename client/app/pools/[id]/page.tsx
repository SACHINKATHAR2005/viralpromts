'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Trophy,
    Users,
    Clock,
    Calendar,
    Award,
    ArrowLeft,
    UserPlus,
    UserMinus,
    Flame,
    TrendingUp,
    Heart,
    MessageCircle,
    ArrowUp,
    ArrowDown,
    Plus,
    Crown,
    Medal,
} from 'lucide-react';
import { poolApi } from '@/lib/api/client';
import type { Pool } from '@/lib/types/index';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

export default function PoolDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const poolId = params.id as string;

    const [pool, setPool] = useState<Pool | null>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'submissions' | 'leaderboard'>('leaderboard');

    useEffect(() => {
        if (poolId) {
            fetchPoolData();
        }
    }, [poolId]);

    const fetchPoolData = async () => {
        try {
            setIsLoading(true);
            const [poolResponse, leaderboardResponse] = await Promise.all([
                poolApi.getPool(poolId),
                poolApi.getPoolLeaderboard(poolId, 50)
            ]);

            if (poolResponse.data.success && poolResponse.data.data) {
                setPool(poolResponse.data.data.pool);
            }

            if (leaderboardResponse.data.success && leaderboardResponse.data.data) {
                setLeaderboard(leaderboardResponse.data.data.leaderboard || []);
            }
        } catch (error) {
            console.error('Error fetching pool:', error);
            toast.error('Failed to load pool');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinPool = async () => {
        if (!isAuthenticated) {
            toast.error('Please sign in to join this pool');
            router.push('/login');
            return;
        }

        try {
            setIsJoining(true);
            await poolApi.joinPool(poolId);
            toast.success('Successfully joined the pool!');
            fetchPoolData();
        } catch (error: any) {
            console.error('Error joining pool:', error);
            toast.error(error.response?.data?.message || 'Failed to join pool');
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeavePool = async () => {
        if (!isAuthenticated) return;

        try {
            setIsJoining(true);
            await poolApi.leavePool(poolId);
            toast.success('Left the pool');
            fetchPoolData();
        } catch (error: any) {
            console.error('Error leaving pool:', error);
            toast.error(error.response?.data?.message || 'Failed to leave pool');
        } finally {
            setIsJoining(false);
        }
    };

    const handleVote = async (promptId: string, voteValue: number) => {
        if (!isAuthenticated) {
            toast.error('Please sign in to vote');
            router.push('/login');
            return;
        }

        try {
            await poolApi.voteOnPrompt(poolId, promptId, voteValue);
            toast.success('Vote recorded!');
            fetchPoolData();
        } catch (error: any) {
            console.error('Error voting:', error);
            toast.error(error.response?.data?.message || 'Failed to vote');
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-6 w-6 text-zinc-400" />;
        if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
        return null;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500';
            case 'pending':
                return 'bg-yellow-500';
            case 'completed':
                return 'bg-blue-500';
            case 'cancelled':
                return 'bg-red-500';
            default:
                return 'bg-zinc-500';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!pool) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center">
                    <Trophy className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Pool not found</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                        This pool doesn't exist or has been removed
                    </p>
                    <Link href="/pools">
                        <Button>Browse Pools</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const creator = typeof pool.creator === 'string' ? null : pool.creator;
    const participantCount = Array.isArray(pool.participants) ? pool.participants.length : 0;
    const promptCount = Array.isArray(pool.prompts) ? pool.prompts.length : 0;
    const isParticipant = isAuthenticated && Array.isArray(pool.participants) && pool.participants.some(
        (p: any) => (typeof p === 'string' ? p === user?._id : p._id === user?._id)
    );

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="border-b bg-white dark:bg-zinc-900">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Pools
                        </Button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <Trophy className="h-10 w-10 text-purple-600" />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="secondary" className="capitalize">
                                            {pool.type}
                                        </Badge>
                                        <div className={`h-2 w-2 rounded-full ${getStatusColor(pool.status)}`} />
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                                            {pool.status}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-bold">{pool.title}</h1>
                                </div>
                            </div>

                            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
                                {pool.description}
                            </p>

                            {/* Pool Stats */}
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-zinc-600" />
                                    <span className="font-semibold">{participantCount}</span>
                                    <span className="text-zinc-600 dark:text-zinc-400">participants</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-zinc-600" />
                                    <span className="font-semibold">{promptCount}</span>
                                    <span className="text-zinc-600 dark:text-zinc-400">submissions</span>
                                </div>
                                {pool.challenge?.endDate && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-zinc-600" />
                                        <span className="text-zinc-600 dark:text-zinc-400">
                                            Ends {formatDistanceToNow(new Date(pool.challenge.endDate), { addSuffix: true })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Creator */}
                            {creator && (
                                <div className="flex items-center gap-2 mt-4">
                                    {creator.profilePicture ? (
                                        <img
                                            src={creator.profilePicture}
                                            alt={creator.username}
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                                            {creator.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Created by <Link href={`/profile/${creator.username}`} className="font-semibold hover:text-purple-600">{creator.username}</Link>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            {isAuthenticated ? (
                                isParticipant ? (
                                    <>
                                        <Button variant="outline" onClick={handleLeavePool} disabled={isJoining}>
                                            <UserMinus className="h-4 w-4 mr-2" />
                                            Leave Pool
                                        </Button>
                                        <Link href={`/prompts/create?pool=${poolId}`}>
                                            <Button className="w-full">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Submit Prompt
                                            </Button>
                                        </Link>
                                    </>
                                ) : (
                                    <Button onClick={handleJoinPool} disabled={isJoining} size="lg">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Join Pool
                                    </Button>
                                )
                            ) : (
                                <Button onClick={() => router.push('/login')} size="lg">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Sign in to Join
                                </Button>
                            )}

                            {pool.featured && (
                                <Badge variant="default" className="bg-yellow-500 justify-center">
                                    <Flame className="h-3 w-3 mr-1" />
                                    Featured Pool
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Challenge/Prize Info */}
                    {pool.challenge && (
                        <Card className="mt-6 bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {pool.challenge.prize && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Trophy className="h-4 w-4 text-yellow-600" />
                                                <span className="text-sm font-semibold">Prize</span>
                                            </div>
                                            <p className="text-lg font-bold">{pool.challenge.prize}</p>
                                        </div>
                                    )}
                                    {pool.challenge.judging && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Award className="h-4 w-4 text-purple-600" />
                                                <span className="text-sm font-semibold">Judging</span>
                                            </div>
                                            <p className="capitalize">{pool.challenge.judging}</p>
                                        </div>
                                    )}
                                    {pool.challenge.maxSubmissions && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-semibold">Max Submissions</span>
                                            </div>
                                            <p>{pool.challenge.maxSubmissions} per person</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b bg-white dark:bg-zinc-900">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'leaderboard'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                        >
                            <TrendingUp className="h-4 w-4" />
                            Leaderboard
                        </button>
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'details'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                        >
                            <Calendar className="h-4 w-4" />
                            Details
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'leaderboard' && (
                    <div>
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-12">
                                <Trophy className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No submissions yet</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                    Be the first to submit a prompt to this pool!
                                </p>
                                {isParticipant && (
                                    <Link href={`/prompts/create?pool=${poolId}`}>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Submit Prompt
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {leaderboard.map((entry, index) => (
                                    <Card key={entry.prompt._id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                {/* Rank */}
                                                <div className="flex flex-col items-center justify-center min-w-[60px]">
                                                    {getRankIcon(index + 1)}
                                                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                                        #{index + 1}
                                                    </div>
                                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                        {entry.totalVotes} votes
                                                    </div>
                                                </div>

                                                {/* Prompt Info */}
                                                <div className="flex-1">
                                                    <Link href={`/prompts/${entry.prompt._id}`}>
                                                        <h3 className="text-lg font-semibold hover:text-purple-600 transition-colors mb-2">
                                                            {entry.prompt.title}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                                                        {entry.prompt.description}
                                                    </p>

                                                    {/* Creator */}
                                                    <div className="flex items-center gap-2">
                                                        {entry.creator.profilePicture ? (
                                                            <img
                                                                src={entry.creator.profilePicture}
                                                                alt={entry.creator.username}
                                                                className="h-6 w-6 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-6 w-6 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                                                                {entry.creator.username.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <Link href={`/profile/${entry.creator.username}`} className="text-sm font-semibold hover:text-purple-600">
                                                            {entry.creator.username}
                                                        </Link>
                                                    </div>
                                                </div>

                                                {/* Voting */}
                                                {isAuthenticated && (
                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleVote(entry.prompt._id, 1)}
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                        </Button>
                                                        {pool.voting?.votingType === 'updown' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleVote(entry.prompt._id, -1)}
                                                            >
                                                                <ArrowDown className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="max-w-3xl">
                        <Card>
                            <CardHeader>
                                <h2 className="text-2xl font-bold">Pool Information</h2>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Rules */}
                                {pool.challenge?.rules && (
                                    <div>
                                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                                            <Award className="h-5 w-5 text-purple-600" />
                                            Rules
                                        </h3>
                                        <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                                            {pool.challenge.rules}
                                        </p>
                                    </div>
                                )}

                                {/* Dates */}
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-purple-600" />
                                        Important Dates
                                    </h3>
                                    <div className="space-y-2">
                                        {pool.challenge?.startDate && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-zinc-600 dark:text-zinc-400">Start Date:</span>
                                                <span className="font-semibold">
                                                    {new Date(pool.challenge.startDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                        {pool.challenge?.endDate && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-zinc-600 dark:text-zinc-400">End Date:</span>
                                                <span className="font-semibold">
                                                    {new Date(pool.challenge.endDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Tags */}
                                {pool.tags && pool.tags.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {pool.tags.map((tag, index) => (
                                                <Badge key={index} variant="outline">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}
