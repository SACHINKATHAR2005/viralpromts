'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Search,
    Trophy,
    Users,
    Clock,
    Flame,
    Sparkles,
    Calendar,
    Award,
    Plus,
    TrendingUp,
} from 'lucide-react';
import { poolApi } from '@/lib/api/client';
import type { Pool } from '@/lib/types/index';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

export default function PoolsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [pools, setPools] = useState<Pool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('active');

    useEffect(() => {
        fetchPools();
    }, [filterType, filterStatus]);

    const fetchPools = async () => {
        try {
            setIsLoading(true);
            const filters: any = {
                status: filterStatus === 'all' ? undefined : filterStatus,
                type: filterType === 'all' ? undefined : filterType,
                search: searchQuery || undefined,
                sortBy: 'createdAt',
                sortOrder: 'desc' as const,
            };

            const response = await poolApi.getPools(filters);
            if (response.data.success && response.data.data) {
                const data = response.data.data as any;
                setPools(data.pools || []);
            }
        } catch (error) {
            console.error('Error fetching pools:', error);
            toast.error('Failed to load pools');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPools();
    };

    const getPoolIcon = (type: string) => {
        switch (type) {
            case 'challenge':
                return <Trophy className="h-5 w-5" />;
            case 'voting':
                return <TrendingUp className="h-5 w-5" />;
            case 'collaborative':
                return <Users className="h-5 w-5" />;
            case 'resource':
                return <Sparkles className="h-5 w-5" />;
            default:
                return <Award className="h-5 w-5" />;
        }
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

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Hero Section */}
            <div className="border-b bg-white dark:bg-zinc-900">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Trophy className="h-12 w-12 text-purple-600" />
                            <h1 className="text-4xl font-bold">Prompt Pools</h1>
                        </div>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
                            Join challenges, compete with others, and win prizes
                        </p>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    type="search"
                                    placeholder="Search pools by name, category, or tags..."
                                    className="pl-10 pr-4 h-12 bg-zinc-100 dark:bg-zinc-800 border-none text-base"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                            <Badge
                                variant={filterStatus === 'active' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setFilterStatus('active')}
                            >
                                <Flame className="h-3 w-3 mr-1" />
                                Active
                            </Badge>
                            <Badge
                                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setFilterStatus('pending')}
                            >
                                <Clock className="h-3 w-3 mr-1" />
                                Upcoming
                            </Badge>
                            <Badge
                                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setFilterStatus('completed')}
                            >
                                <Award className="h-3 w-3 mr-1" />
                                Completed
                            </Badge>
                            <Badge
                                variant={filterStatus === 'all' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setFilterStatus('all')}
                            >
                                All Pools
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <Badge
                                variant={filterType === 'all' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setFilterType('all')}
                            >
                                All Types
                            </Badge>
                            <Badge
                                variant={filterType === 'challenge' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setFilterType('challenge')}
                            >
                                <Trophy className="h-3 w-3 mr-1" />
                                Challenges
                            </Badge>
                            <Badge
                                variant={filterType === 'voting' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setFilterType('voting')}
                            >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Voting
                            </Badge>
                            <Badge
                                variant={filterType === 'collaborative' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setFilterType('collaborative')}
                            >
                                <Users className="h-3 w-3 mr-1" />
                                Collaborative
                            </Badge>
                        </div>

                        {/* Create Pool Button */}
                        {isAuthenticated && (
                            <div className="mt-6">
                                <Link href="/pools/create">
                                    <Button size="lg">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create New Pool
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pools Grid */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    </div>
                ) : !pools || pools.length === 0 ? (
                    <div className="text-center py-12">
                        <Trophy className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No pools found</h3>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            {searchQuery
                                ? 'Try adjusting your search or filters'
                                : 'Be the first to create a pool!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pools.map((pool) => {
                            const creator = typeof pool.creator === 'string' ? null : pool.creator;
                            const participantCount = Array.isArray(pool.participants) ? pool.participants.length : 0;
                            const promptCount = Array.isArray(pool.prompts) ? pool.prompts.length : 0;

                            return (
                                <Link key={pool._id} href={`/pools/${pool._id}`}>
                                    <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                                        <CardHeader>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {getPoolIcon(pool.type)}
                                                    <Badge variant="secondary" className="capitalize">
                                                        {pool.type}
                                                    </Badge>
                                                </div>
                                                <div className={`h-2 w-2 rounded-full ${getStatusColor(pool.status)}`} />
                                            </div>
                                            <h3 className="font-bold text-lg line-clamp-2">{pool.title}</h3>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-4">
                                                {pool.description}
                                            </p>

                                            {/* Pool Stats */}
                                            <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    <span>{participantCount}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Sparkles className="h-4 w-4" />
                                                    <span>{promptCount} prompts</span>
                                                </div>
                                            </div>

                                            {/* Challenge/Voting Info */}
                                            {pool.type === 'challenge' && pool.challenge?.endDate && (
                                                <div className="flex items-center gap-2 text-sm mb-2">
                                                    <Calendar className="h-4 w-4 text-purple-600" />
                                                    <span className="text-zinc-600 dark:text-zinc-400">
                                                        Ends {formatDistanceToNow(new Date(pool.challenge.endDate), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            )}

                                            {pool.challenge?.prize && (
                                                <div className="flex items-center gap-2 text-sm mb-2">
                                                    <Trophy className="h-4 w-4 text-yellow-600" />
                                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                        {pool.challenge.prize}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Creator */}
                                            {creator && (
                                                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                                    {creator.profilePicture ? (
                                                        <img
                                                            src={creator.profilePicture}
                                                            alt={creator.username}
                                                            className="h-6 w-6 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-6 w-6 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                                                            {creator.username.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                        by {creator.username}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Featured Badge */}
                                            {pool.featured && (
                                                <Badge variant="default" className="mt-2 bg-yellow-500">
                                                    <Flame className="h-3 w-3 mr-1" />
                                                    Featured
                                                </Badge>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
