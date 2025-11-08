'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    User,
    MapPin,
    Link as LinkIcon,
    Calendar,
    Settings,
    LogOut,
    Heart,
    Bookmark,
    Grid,
    Activity,
    Edit,
    Plus,
    Star,
    MessageCircle,
    Copy,
    Users,
    Trash2,
    Pin,
    PinOff,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { promptsApi, socialApi, authApi, uploadApi } from '@/lib/api/client';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import type { Prompt } from '@/lib/types/index';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <ProfileContent />
        </ProtectedRoute>
    );
}

function ProfileContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'prompts' | 'saved' | 'activity'>('prompts');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
    const [savedPrompts, setSavedPrompts] = useState<Prompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const [editForm, setEditForm] = useState({
        username: user?.username || '',
        bio: user?.bio || '',
        website: user?.website || '',
    });

    useEffect(() => {
        if (user) {
            fetchMyPrompts();
        }
    }, [user]);

    const fetchMyPrompts = async () => {
        try {
            setIsLoading(true);
            const response = await promptsApi.getMyPrompts();
            if (response.data.success && response.data.data) {
                // Backend returns 'prompts' array
                const data = response.data.data as any;
                setMyPrompts(data.prompts || []);
            }
        } catch (error) {
            console.error('Error fetching prompts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePrompt = async (promptId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
            return;
        }

        try {
            await promptsApi.deletePrompt(promptId);
            toast.success('Prompt deleted successfully');
            // Refresh prompts list
            fetchMyPrompts();
        } catch (error) {
            console.error('Error deleting prompt:', error);
            toast.error('Failed to delete prompt');
        }
    };

    const handleTogglePin = async (promptId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const response = await promptsApi.togglePinPrompt(promptId);
            if (response.data.success && response.data.data) {
                const isPinned = response.data.data.isPinned;
                toast.success(isPinned ? 'Prompt pinned to your profile' : 'Prompt unpinned');
                // Refresh to update UI
                window.location.reload();
            }
        } catch (error) {
            console.error('Error toggling pin:', error);
            toast.error('Failed to pin/unpin prompt');
        }
    };

    const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        try {
            setIsUploadingPhoto(true);
            const response = await uploadApi.uploadProfilePhoto(file);

            if (response.data.success) {
                toast.success('Profile photo updated successfully');
                // Refresh page to show new photo
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Error uploading profile photo:', error);
            toast.error(error.response?.data?.message || 'Failed to upload profile photo');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleUpdateProfile = async () => {
        try {
            await authApi.updateProfile(editForm);
            setIsEditingProfile(false);
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <header className="border-b bg-white dark:bg-zinc-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="text-xl font-bold">
                            Viral Prompts
                        </Link>
                        <div className="flex items-center gap-2">
                            <Link href="/prompts/create">
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Prompt
                                </Button>
                            </Link>
                            <Link href="/explore">
                                <Button variant="ghost" size="sm">
                                    Explore
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Profile Header */}
            <div className="border-b bg-white dark:bg-zinc-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Avatar */}
                        <div className="relative group">
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

                            {/* Upload Button Overlay */}
                            <label
                                htmlFor="profile-photo-upload"
                                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                            >
                                <div className="text-center text-white">
                                    {isUploadingPhoto ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto"></div>
                                    ) : (
                                        <>
                                            <Edit className="h-6 w-6 mx-auto mb-1" />
                                            <span className="text-xs">Change Photo</span>
                                        </>
                                    )}
                                </div>
                            </label>
                            <input
                                id="profile-photo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleProfilePhotoUpload}
                                disabled={isUploadingPhoto}
                            />

                            {user.isVerified && (
                                <div className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-1">
                                    <Star className="h-4 w-4 text-white fill-white" />
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1">
                            {isEditingProfile ? (
                                <div className="space-y-4">
                                    <Input
                                        placeholder="Username"
                                        value={editForm.username}
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Bio"
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                                        rows={3}
                                    />
                                    <Input
                                        placeholder="Website"
                                        value={editForm.website}
                                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={handleUpdateProfile} size="sm">Save</Button>
                                        <Button onClick={() => setIsEditingProfile(false)} variant="outline" size="sm">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
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
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span className="font-semibold">{user.stats.followersCount}</span>{' '}
                                            <span className="text-zinc-600 dark:text-zinc-400">followers</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">{user.stats.followingCount}</span>{' '}
                                            <span className="text-zinc-600 dark:text-zinc-400">following</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {!isEditingProfile && (
                                <div className="flex gap-2">
                                    <Button onClick={() => setIsEditingProfile(true)} variant="outline" size="sm">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                    <Button onClick={handleLogout} variant="outline" size="sm">
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Logout
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {user.stats.totalPrompts}
                                    </div>
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Prompts</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        ${user.stats.totalEarnings.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Earned</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {user.stats.totalCopies}
                                    </div>
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Copies</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {user.reputation.score}
                                    </div>
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Reputation</div>
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
                            Prompts
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'saved'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                        >
                            <Bookmark className="h-4 w-4" />
                            Saved
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'activity'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                        >
                            <Activity className="h-4 w-4" />
                            Activity
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'prompts' && (
                    <div>
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                            </div>
                        ) : !myPrompts || myPrompts.length === 0 ? (
                            <div className="text-center py-12">
                                <Grid className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No prompts yet</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                    Create your first prompt to get started
                                </p>
                                <Link href="/prompts/create">
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Prompt
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myPrompts.map((prompt) => (
                                    <div key={prompt._id} className="relative group">
                                        <Link href={`/prompts/${prompt._id}`}>
                                            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                                                <CardHeader>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary">{prompt.category}</Badge>
                                                            {user?.pinnedPrompt === prompt._id && (
                                                                <Badge variant="default" className="bg-purple-600">
                                                                    <Pin className="h-3 w-3 mr-1" />
                                                                    Pinned
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {prompt.isPaid && (
                                                            <Badge variant="outline" className="text-green-600">
                                                                ${prompt.price}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="font-semibold line-clamp-2">{prompt.title}</h3>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-4">
                                                        {prompt.description}
                                                    </p>
                                                    <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1">
                                                                <Heart className="h-3 w-3" />
                                                                {prompt.stats.totalLikes}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <MessageCircle className="h-3 w-3" />
                                                                {prompt.stats.totalComments}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Copy className="h-3 w-3" />
                                                                {prompt.stats.copies}
                                                            </div>
                                                        </div>
                                                        {prompt.ratings.count > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                                {prompt.ratings.average.toFixed(1)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>

                                        {/* Action Buttons (Delete & Pin) */}
                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={(e) => handleTogglePin(prompt._id, e)}
                                                title={user?.pinnedPrompt === prompt._id ? 'Unpin from profile' : 'Pin to profile'}
                                            >
                                                {user?.pinnedPrompt === prompt._id ? (
                                                    <PinOff className="h-4 w-4" />
                                                ) : (
                                                    <Pin className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={(e) => handleDeletePrompt(prompt._id, e)}
                                                title="Delete prompt"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div className="text-center py-12">
                        <Bookmark className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Saved prompts</h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Your saved prompts will appear here
                        </p>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="text-center py-12">
                        <Activity className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Activity feed</h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Your recent activity will appear here
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
