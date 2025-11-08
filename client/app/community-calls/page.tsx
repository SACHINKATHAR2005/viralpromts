'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Calendar, Users, Clock, Plus, Video } from 'lucide-react';
import { communityCallApi } from '@/lib/api/client';
import type { CommunityCall } from '@/lib/types/index';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CommunityCallsPage() {
    const [calls, setCalls] = useState<CommunityCall[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCalls();
    }, []);

    const fetchCalls = async () => {
        try {
            const response = await communityCallApi.getCalls();
            if (response.data.success && response.data.data) {
                setCalls(response.data.data.items);
            }
        } catch (error) {
            console.error('Failed to fetch calls:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <Phone className="h-10 w-10 text-green-600" />
                            Community Calls
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Join live sessions with prompt creators and experts
                        </p>
                    </div>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Schedule Call
                    </Button>
                </div>

                {/* Calls Grid */}
                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
                        ))}
                    </div>
                ) : !calls || calls.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Phone className="mx-auto h-16 w-16 text-zinc-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Upcoming Calls</h3>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            Be the first to schedule a community call!
                        </p>
                        <Button>Schedule First Call</Button>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {calls.map((call) => (
                            <Card key={call._id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-2">{call.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>{call.scheduledDate ? format(new Date(call.scheduledDate), 'PPP') : 'TBA'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                                            <Clock className="h-4 w-4" />
                                            <span>{call.scheduledDate ? format(new Date(call.scheduledDate), 'p') : 'TBA'}</span>
                                        </div>
                                    </div>
                                    <Video className="h-8 w-8 text-green-600" />
                                </div>

                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                                    {call.description}
                                </p>

                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-sm text-zinc-500">
                                        <Users className="h-4 w-4" />
                                        {call.maxParticipants ? `Max ${call.maxParticipants}` : 'Unlimited'}
                                    </span>

                                    <Link href={`/community-calls/${call._id}`}>
                                        <Button size="sm">Join Call</Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
