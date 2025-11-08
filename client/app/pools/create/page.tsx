'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Trophy,
    Users,
    TrendingUp,
    Sparkles,
    Calendar,
    Award,
} from 'lucide-react';
import { poolApi } from '@/lib/api/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import ProtectedRoute from '@/components/ProtectedRoute';

function CreatePoolContent() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'challenge' as 'collaborative' | 'challenge' | 'voting' | 'resource',
        category: '',
        tags: '',
        maxParticipants: '',
        isPrivate: false,
        requireApproval: false,
        allowVoting: true,
        // Challenge fields
        prize: '',
        startDate: '',
        endDate: '',
        rules: '',
        judging: 'community' as 'community' | 'moderator' | 'automatic',
        maxSubmissions: '1',
        // Voting fields
        votingStartDate: '',
        votingEndDate: '',
        votingType: 'updown' as 'updown' | 'rating' | 'ranking',
        allowMultipleVotes: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.description || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsSubmitting(true);

            const poolData: any = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                category: formData.category,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
                maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
                isPrivate: formData.isPrivate,
                requireApproval: formData.requireApproval,
                allowVoting: formData.allowVoting,
            };

            // Add challenge fields if type is challenge
            if (formData.type === 'challenge') {
                poolData.challenge = {
                    prize: formData.prize,
                    startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
                    endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
                    rules: formData.rules,
                    judging: formData.judging,
                    maxSubmissions: parseInt(formData.maxSubmissions) || 1,
                };
            }

            // Add voting fields if type is voting
            if (formData.type === 'voting') {
                poolData.voting = {
                    startDate: formData.votingStartDate ? new Date(formData.votingStartDate).toISOString() : undefined,
                    endDate: formData.votingEndDate ? new Date(formData.votingEndDate).toISOString() : undefined,
                    votingType: formData.votingType,
                    allowMultipleVotes: formData.allowMultipleVotes,
                };
            }

            const response = await poolApi.createPool(poolData);

            if (response.data.success && response.data.data) {
                const pool = response.data.data.pool;
                toast.success('Pool created successfully!');
                router.push(`/pools/${pool._id}`);
            }
        } catch (error: any) {
            console.error('Error creating pool:', error);
            toast.error(error.response?.data?.message || 'Failed to create pool');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTypeIcon = (type: string) => {
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

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="border-b bg-white dark:bg-zinc-900">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Pools
                        </Button>
                    </div>
                    <div className="flex items-center gap-3">
                        <Trophy className="h-10 w-10 text-purple-600" />
                        <div>
                            <h1 className="text-3xl font-bold">Create New Pool</h1>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Set up a challenge, voting pool, or collaborative space
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Basic Information</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Pool Title <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., AI Product Photography Challenge"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe the pool's purpose and goals..."
                                    className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-white dark:bg-zinc-950"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Pool Type <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {(['challenge', 'voting', 'collaborative', 'resource'] as const).map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, type }))}
                                            className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${formData.type === type
                                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20'
                                                : 'border-zinc-200 dark:border-zinc-800 hover:border-purple-300'
                                                }`}
                                        >
                                            {getTypeIcon(type)}
                                            <span className="text-sm font-medium capitalize">{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-950"
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        <option value="Art & Design">Art & Design</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Writing">Writing</option>
                                        <option value="Code">Code</option>
                                        <option value="Music">Music</option>
                                        <option value="Video">Video</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Max Participants
                                    </label>
                                    <Input
                                        type="number"
                                        name="maxParticipants"
                                        value={formData.maxParticipants}
                                        onChange={handleChange}
                                        placeholder="Leave empty for unlimited"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Tags (comma separated)
                                </label>
                                <Input
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleChange}
                                    placeholder="AI, photography, product, marketing"
                                />
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="isPrivate"
                                        checked={formData.isPrivate}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Private Pool</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="requireApproval"
                                        checked={formData.requireApproval}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Require Approval to Join</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="allowVoting"
                                        checked={formData.allowVoting}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Allow Voting</span>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Challenge Settings */}
                    {formData.type === 'challenge' && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-yellow-600" />
                                    Challenge Settings
                                </h2>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Prize</label>
                                    <Input
                                        name="prize"
                                        value={formData.prize}
                                        onChange={handleChange}
                                        placeholder="e.g., $1000 cash + feature on homepage"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Start Date</label>
                                        <Input
                                            type="datetime-local"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">End Date</label>
                                        <Input
                                            type="datetime-local"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Rules & Guidelines</label>
                                    <textarea
                                        name="rules"
                                        value={formData.rules}
                                        onChange={handleChange}
                                        placeholder="Enter the challenge rules and guidelines..."
                                        className="w-full min-h-[150px] px-3 py-2 border rounded-md bg-white dark:bg-zinc-950"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Judging Method</label>
                                        <select
                                            name="judging"
                                            value={formData.judging}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-950"
                                        >
                                            <option value="community">Community Voting</option>
                                            <option value="moderator">Moderator Review</option>
                                            <option value="automatic">Automatic (by stats)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Max Submissions per User</label>
                                        <Input
                                            type="number"
                                            name="maxSubmissions"
                                            value={formData.maxSubmissions}
                                            onChange={handleChange}
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Voting Settings */}
                    {formData.type === 'voting' && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                    Voting Settings
                                </h2>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Voting Start Date</label>
                                        <Input
                                            type="datetime-local"
                                            name="votingStartDate"
                                            value={formData.votingStartDate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Voting End Date</label>
                                        <Input
                                            type="datetime-local"
                                            name="votingEndDate"
                                            value={formData.votingEndDate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Voting Type</label>
                                    <select
                                        name="votingType"
                                        value={formData.votingType}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-950"
                                    >
                                        <option value="updown">Upvote/Downvote</option>
                                        <option value="rating">Star Rating (1-5)</option>
                                        <option value="ranking">Ranked Choice</option>
                                    </select>
                                </div>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="allowMultipleVotes"
                                        checked={formData.allowMultipleVotes}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Allow users to vote on multiple submissions</span>
                                </label>
                            </CardContent>
                        </Card>
                    )}

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} size="lg">
                            {isSubmitting ? 'Creating...' : 'Create Pool'}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default function CreatePoolPage() {
    return (
        <ProtectedRoute>
            <CreatePoolContent />
        </ProtectedRoute>
    );
}
