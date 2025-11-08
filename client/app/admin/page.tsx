'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    FileText,
    Trophy,
    MessageSquare,
    BarChart3,
    Shield,
    AlertCircle,
    TrendingUp,
    Activity,
} from 'lucide-react';
import { adminApi } from '@/lib/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { toast } from 'sonner';

function AdminDashboardContent() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is admin
        if (user && user.role !== 'admin') {
            toast.error('Access denied. Admin privileges required.');
            router.push('/');
            return;
        }

        if (user?.role === 'admin') {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const response = await adminApi.getStats();
            if (response.data.success && response.data.data) {
                setStats(response.data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center">
                    <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                        Admin privileges required to access this page
                    </p>
                    <Button onClick={() => router.push('/')}>Go to Home</Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-zinc-600 dark:text-zinc-400">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    const menuItems = [
        {
            title: 'User Management',
            href: '/admin/users',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-950/30',
            count: stats?.users?.total || 0,
            description: 'Manage users, verification, and monetization'
        },
        {
            title: 'Prompt Moderation',
            href: '/admin/prompts',
            icon: FileText,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100 dark:bg-purple-950/30',
            count: stats?.prompts?.total || 0,
            description: 'Review and moderate prompts'
        },
        {
            title: 'Pool Management',
            href: '/admin/pools',
            icon: Trophy,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100 dark:bg-yellow-950/30',
            count: 0,
            description: 'Manage challenges and pools'
        },
        {
            title: 'Feedback',
            href: '/admin/feedback',
            icon: MessageSquare,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-950/30',
            count: 0,
            description: 'View and respond to user feedback'
        },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="h-8 w-8 text-purple-600" />
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Manage and monitor your platform
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <Users className="h-8 w-8 text-blue-600" />
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold">{stats?.users?.total || 0}</p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Users</p>
                            <div className="flex gap-2 mt-3">
                                <Badge variant="secondary" className="text-xs">
                                    {stats?.users?.active || 0} Active
                                </Badge>
                                <Badge variant="outline" className="text-xs text-red-600">
                                    {stats?.users?.blocked || 0} Blocked
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <FileText className="h-8 w-8 text-purple-600" />
                                <Activity className="h-4 w-4 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold">{stats?.prompts?.total || 0}</p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Prompts</p>
                            <div className="flex gap-2 mt-3">
                                <Badge variant="secondary" className="text-xs">
                                    {stats?.prompts?.active || 0} Active
                                </Badge>
                                <Badge variant="outline" className="text-xs text-red-600">
                                    {stats?.prompts?.blocked || 0} Blocked
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <Shield className="h-8 w-8 text-green-600" />
                                <Badge className="text-xs bg-green-600">Verified</Badge>
                            </div>
                            <p className="text-2xl font-bold">{stats?.users?.verified || 0}</p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Verified Users</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <BarChart3 className="h-8 w-8 text-yellow-600" />
                                <Badge className="text-xs bg-yellow-600">Monetized</Badge>
                            </div>
                            <p className="text-2xl font-bold">{stats?.users?.monetized || 0}</p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Monetized Users</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href}>
                                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className={`${item.bgColor} p-3 rounded-lg shrink-0`}>
                                                    <Icon className={`h-6 w-6 ${item.color}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="font-semibold">{item.title}</h3>
                                                        {item.count > 0 && (
                                                            <Badge variant="secondary">{item.count}</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Alert Info */}
                <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-yellow-900 dark:text-yellow-100 font-semibold mb-1">
                                    Admin Responsibilities
                                </p>
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    As an admin, you have the power to block users, moderate content, and manage the platform.
                                    Please use these privileges responsibly and fairly.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <ProtectedRoute>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}
