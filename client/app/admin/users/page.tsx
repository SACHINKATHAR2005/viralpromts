'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface User {
    _id: string;
    username: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    isBlocked: boolean;
    isVerified: boolean;
    monetizationEnabled: boolean;
    profilePicture?: string;
    bio?: string;
    createdAt: string;
    promptCount?: number;
    followerCount?: number;
}

interface PaginatedResponse {
    users: User[];
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
        totalUsers: number;
    };
}

export default function AdminUsersPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);

    // Check admin access
    useEffect(() => {
        if (user && user.role !== 'admin') {
            toast.error('Access denied. Admin only.');
            router.push('/');
        }
    }, [user, router]);

    // Fetch users
    const fetchUsers = async (page = 1, search = '') => {
        try {
            setLoading(true);
            const response = await adminApi.getUsers({
                page,
                limit: 20,
            });

            if (response.data.success) {
                const data = response.data.data as PaginatedResponse;
                let filteredUsers = data.users;

                // Client-side search filter
                if (search.trim()) {
                    const query = search.toLowerCase().trim();
                    filteredUsers = filteredUsers.filter(
                        (u) =>
                            u.username.toLowerCase().includes(query) ||
                            u.email.toLowerCase().includes(query) ||
                            u.name.toLowerCase().includes(query)
                    );
                }

                setUsers(filteredUsers);
                setTotalPages(data.pagination.totalPages);
                setTotalUsers(data.pagination.totalUsers);
                setCurrentPage(page);
            }
        } catch (error: any) {
            console.error('Error fetching users:', error);
            toast.error(error.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers(currentPage, searchQuery);
        }
    }, [user]);

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers(1, searchQuery);
    };

    // Toggle user block status
    const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
        try {
            setProcessingUserId(userId);
            const action = currentStatus ? 'unblock' : 'block';
            await adminApi.toggleUserStatus(userId, action);
            toast.success(`User ${action}ed successfully`);
            fetchUsers(currentPage, searchQuery);
        } catch (error: any) {
            console.error('Error toggling user status:', error);
            toast.error(error.response?.data?.message || 'Failed to update user status');
        } finally {
            setProcessingUserId(null);
        }
    };

    // Toggle verification
    const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
        try {
            setProcessingUserId(userId);
            const action = currentStatus ? 'unverify' : 'verify';
            await adminApi.toggleUserVerification(userId, action);
            toast.success(`User ${action}ied successfully`);
            fetchUsers(currentPage, searchQuery);
        } catch (error: any) {
            console.error('Error toggling verification:', error);
            toast.error(error.response?.data?.message || 'Failed to update verification');
        } finally {
            setProcessingUserId(null);
        }
    };

    // Toggle monetization
    const handleToggleMonetization = async (userId: string, currentStatus: boolean) => {
        try {
            setProcessingUserId(userId);
            const action = currentStatus ? 'disable' : 'enable';
            await adminApi.toggleMonetization(userId, action);
            toast.success(`Monetization ${action}d successfully`);
            fetchUsers(currentPage, searchQuery);
        } catch (error: any) {
            console.error('Error toggling monetization:', error);
            toast.error(error.response?.data?.message || 'Failed to update monetization');
        } finally {
            setProcessingUserId(null);
        }
    };

    // Delete user
    const handleDeleteUser = async (userId: string, username: string) => {
        if (!confirm(`Are you sure you want to permanently delete user @${username}? This action cannot be undone.`)) {
            return;
        }

        try {
            setProcessingUserId(userId);
            await adminApi.deleteUser(userId);
            toast.success('User deleted successfully');
            fetchUsers(currentPage, searchQuery);
        } catch (error: any) {
            console.error('Error deleting user:', error);
            toast.error(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setProcessingUserId(null);
        }
    };

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="mt-2 text-gray-600">
                            Manage all users on the platform. Total users: {totalUsers}
                        </p>
                    </div>

                    {/* Search Bar */}
                    <Card className="p-6 mb-6">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <Input
                                type="text"
                                placeholder="Search by username, email, or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit">Search</Button>
                            {searchQuery && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSearchQuery('');
                                        fetchUsers(1, '');
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </form>
                    </Card>

                    {/* Users Table */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="mt-2 text-gray-600">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <Card className="p-12 text-center">
                            <p className="text-gray-600">No users found</p>
                        </Card>
                    ) : (
                        <div className="bg-white shadow-md rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stats
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Joined
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((u) => (
                                            <tr key={u._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="shrink-0 h-10 w-10">
                                                            {u.profilePicture ? (
                                                                <img
                                                                    src={u.profilePicture}
                                                                    alt={u.username}
                                                                    className="h-10 w-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                                                                    {u.username.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {u.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                @{u.username}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {u.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        <Badge
                                                            variant={u.role === 'admin' ? 'default' : 'outline'}
                                                        >
                                                            {u.role}
                                                        </Badge>
                                                        {u.isBlocked && (
                                                            <Badge variant="destructive">Blocked</Badge>
                                                        )}
                                                        {u.isVerified && (
                                                            <Badge className="bg-blue-500">Verified</Badge>
                                                        )}
                                                        {u.monetizationEnabled && (
                                                            <Badge className="bg-green-500">Monetized</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div>Prompts: {u.promptCount || 0}</div>
                                                    <div>Followers: {u.followerCount || 0}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                size="sm"
                                                                variant={u.isBlocked ? 'default' : 'destructive'}
                                                                onClick={() => handleToggleBlock(u._id, u.isBlocked)}
                                                                disabled={processingUserId === u._id || u.role === 'admin'}
                                                            >
                                                                {u.isBlocked ? 'Unblock' : 'Block'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant={u.isVerified ? 'outline' : 'default'}
                                                                onClick={() => handleToggleVerification(u._id, u.isVerified)}
                                                                disabled={processingUserId === u._id}
                                                            >
                                                                {u.isVerified ? 'Unverify' : 'Verify'}
                                                            </Button>
                                                        </div>
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleToggleMonetization(u._id, u.monetizationEnabled)
                                                                }
                                                                disabled={processingUserId === u._id}
                                                            >
                                                                {u.monetizationEnabled ? 'Disable $' : 'Enable $'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleDeleteUser(u._id, u.username)}
                                                                disabled={processingUserId === u._id || u.role === 'admin'}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <Button
                                            onClick={() => fetchUsers(currentPage - 1, searchQuery)}
                                            disabled={currentPage === 1}
                                            variant="outline"
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            onClick={() => fetchUsers(currentPage + 1, searchQuery)}
                                            disabled={currentPage === totalPages}
                                            variant="outline"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                                <span className="font-medium">{totalPages}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                <Button
                                                    onClick={() => fetchUsers(currentPage - 1, searchQuery)}
                                                    disabled={currentPage === 1}
                                                    variant="outline"
                                                    className="rounded-r-none"
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    onClick={() => fetchUsers(currentPage + 1, searchQuery)}
                                                    disabled={currentPage === totalPages}
                                                    variant="outline"
                                                    className="rounded-l-none"
                                                >
                                                    Next
                                                </Button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
