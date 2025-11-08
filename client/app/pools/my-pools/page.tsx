'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Trophy,
    Users,
    Target,
    TrendingUp,
    Calendar,
    Award,
    Edit,
    Trash2,
    Eye,
    Plus,
    BarChart3,
} from 'lucide-react';
import { poolApi } from '@/lib/api/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

interface Pool {
    _id: string;
    title: string;
    description: string;
    type: 'challenge' | 'voting' | 'collaborative' | 'resource';
    status: 'active' | 'upcoming' | 'completed' | 'cancelled' | 'pending';
    category: string;
    tags: string[];
    participants: any[];
    prompts: any[];
    stats: {
        totalPrompts: number;
        totalParticipants: number;
        totalVotes: number;
    };
    challenge?: {
        prize?: string;
        endDate?: string;
    };
    createdAt: string;
}

function MyPoolsContent() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [pools, setPools] = useState<Pool[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        fetchMyPools();
    }, []);

    const fetchMyPools = async () => {
        try {
            setLoading(true);
            const response = await poolApi.getMyPools();
            const poolsData = response.data.data?.pools || response.data.data || [];
            setPools(Array.isArray(poolsData) ? poolsData : []);
        } catch (error) {
            console.error('Error fetching pools:', error);
            toast.error('Failed to load your pools');
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'challenge':
                return <Target className="h-5 w-5 text-purple-600" />;
            case 'voting':
                return <Trophy className="h-5 w-5 text-blue-600" />;
            case 'collaborative':
                return <Users className="h-5 w-5 text-green-600" />;
            default:
                return <Award className="h-5 w-5 text-orange-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-600 text-white hover:bg-green-700',
            upcoming: 'bg-blue-600 text-white hover:bg-blue-700',
            completed: 'bg-zinc-600 text-white hover:bg-zinc-700',
            pending: 'bg-yellow-600 text-white hover:bg-yellow-700',
            cancelled: 'bg-red-600 text-white hover:bg-red-700',
        };
        return (
            <Badge className={styles[status] || styles.pending}>
                {status}
            </Badge>
        );
    };

    const filteredPools = pools.filter(pool => {
        if (filter === 'all') return true;
        if (filter === 'active') return pool.status === 'active';
        if (filter === 'completed') return pool.status === 'completed';
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-zinc-600 dark:text-zinc-400">Loading your pools...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/pools')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Pools
                        </Button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">My Pools</h1>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Manage and monitor your created pools
                            </p>
                        </div>
                        <Link href="/pools/create">
                            <Button size="lg">
                                <Plus className="h-4 w-4 mr-2" />
                                Create New Pool
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    <Badge
                        variant={filter === 'all' ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setFilter('all')}
                    >
                        All ({pools.length})
                    </Badge>
                    <Badge
                        variant={filter === 'active' ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setFilter('active')}
                    >
                        Active ({pools.filter(p => p.status === 'active').length})
                    </Badge>
                    <Badge
                        variant={filter === 'completed' ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setFilter('completed')}
                    >
                        Completed ({pools.filter(p => p.status === 'completed').length})
                    </Badge>
                </div>

                {/* Pool List */}
                {filteredPools.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Trophy className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Pools Yet</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                {filter === 'all'
                                    ? "You haven't created any pools yet. Start by creating your first pool!"
                                    : `No ${filter} pools found.`}
                            </p>
                            {filter === 'all' && (
                                <Link href="/pools/create">
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Your First Pool
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredPools.map((pool) => (
                            <Card key={pool._id} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Left: Pool Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-3">
                                                {getTypeIcon(pool.type)}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {getStatusBadge(pool.status)}
                                                        <Badge variant="outline" className="capitalize">
                                                            {pool.type}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="text-xl font-bold mb-2">
                                                        {pool.title}
                                                    </h3>
                                                    <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                                                        {pool.description}
                                                    </p>

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {pool.tags.slice(0, 3).map((tag) => (
                                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>

                                                    {/* Stats */}
                                                    <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                                                        <div className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            <span>{pool.stats?.totalParticipants || pool.participants.length} participants</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <TrendingUp className="h-4 w-4" />
                                                            <span>{pool.stats?.totalPrompts || pool.prompts.length} submissions</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <BarChart3 className="h-4 w-4" />
                                                            <span>{pool.stats?.totalVotes || 0} votes</span>
                                                        </div>
                                                        {pool.challenge?.prize && (
                                                            <div className="flex items-center gap-1">
                                                                <Award className="h-4 w-4 text-yellow-600" />
                                                                <span className="text-yellow-700 dark:text-yellow-500 font-semibold">
                                                                    {pool.challenge.prize}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {pool.challenge?.endDate && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>
                                                                    Ends {new Date(pool.challenge.endDate).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex md:flex-col gap-2 md:items-end justify-end">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => router.push(`/pools/${pool._id}`)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/pools/${pool._id}/analytics`)}
                                            >
                                                <BarChart3 className="h-4 w-4 mr-2" />
                                                Analytics
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Created Date */}
                                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                        <p className="text-xs text-zinc-500">
                                            Created {new Date(pool.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MyPoolsPage() {
    return (
        <ProtectedRoute>
            <MyPoolsContent />
        </ProtectedRoute>
    );
}
