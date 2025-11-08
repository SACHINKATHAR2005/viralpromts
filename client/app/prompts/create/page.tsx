'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, Upload, Eye, Save, AlertCircle, Clock } from 'lucide-react';
import { promptsApi, uploadApi } from '@/lib/api/client';
import { CATEGORIES, AI_PLATFORMS } from '@/lib/types/index';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

export default function CreatePromptPage() {
    return (
        <ProtectedRoute>
            <CreatePromptContent />
        </ProtectedRoute>
    );
}

function CreatePromptContent() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showRateLimitWarning, setShowRateLimitWarning] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        promptText: '',
        category: '',
        tags: [] as string[],
        aiPlatform: [] as string[],
        isPaid: false,
        price: 0,
        privacy: 'public' as 'public' | 'private' | 'followers',
        proofImages: [] as string[],
        proofType: 'image' as 'image' | 'video' | 'audio' | 'text',
    });

    const [currentTag, setCurrentTag] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddTag = () => {
        if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, currentTag.trim()]
            }));
            setCurrentTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const toggleAIPlatform = (platform: string) => {
        setFormData(prev => ({
            ...prev,
            aiPlatform: prev.aiPlatform.includes(platform)
                ? prev.aiPlatform.filter(p => p !== platform)
                : [...prev.aiPlatform, platform]
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingImage(true);
        try {
            const file = files[0];
            toast.loading('Uploading image...', { id: 'upload-image' });
            const response = await uploadApi.uploadPromptProof(file);

            if (response.data.success && response.data.data) {
                const uploadedImages = (response.data.data as any).proofImages || [];
                setFormData(prev => ({
                    ...prev,
                    proofImages: [...prev.proofImages, ...uploadedImages]
                }));
                toast.success('Image uploaded successfully', { id: 'upload-image' });
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error(error.response?.data?.message || 'Failed to upload image', { id: 'upload-image' });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            proofImages: prev.proofImages.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            toast.error('Please enter a title');
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Please enter a description');
            return;
        }
        if (!formData.promptText.trim()) {
            toast.error('Please enter the prompt text');
            return;
        }
        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }
        if (formData.aiPlatform.length === 0) {
            toast.error('Please select at least one AI platform');
            return;
        }

        setIsLoading(true);
        toast.loading('Creating prompt...', { id: 'create-prompt' });

        try {
            const response = await promptsApi.createPrompt({
                title: formData.title,
                description: formData.description,
                promptText: formData.promptText,
                category: formData.category,
                tags: formData.tags,
                aiPlatform: formData.aiPlatform,
                isPaid: formData.isPaid,
                price: formData.isPaid ? formData.price : 0,
                privacy: formData.privacy,
                proofImages: formData.proofImages,
                proofType: formData.proofType,
            });

            if (response.data.success && response.data.data) {
                toast.success('Prompt created successfully!', { id: 'create-prompt' });
                router.push(`/prompts/${response.data.data.prompt._id}`);
            }
        } catch (error: any) {
            console.error('Error creating prompt:', error);

            // Check if it's a rate limit error (429 status)
            if (error.response?.status === 429) {
                const errorData = error.response?.data;
                setShowRateLimitWarning(true);
                toast.error(errorData?.errors?.[0] || 'You have reached the limit of 3 prompts per 12 hours', {
                    id: 'create-prompt',
                    duration: 5000
                });
            } else {
                const errorMessage = error.response?.data?.errors?.join(', ') ||
                    error.response?.data?.message ||
                    'Failed to create prompt';
                toast.error(errorMessage, { id: 'create-prompt' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </div>
                        <Link href="/" className="text-xl font-bold">
                            Viral Prompts
                        </Link>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isLoading ? 'Publishing...' : 'Publish'}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Rate Limit Modal */}
                {showRateLimitWarning && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <Card className="max-w-md w-full border-red-200 bg-white dark:bg-zinc-950 shadow-xl">
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-4">
                                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                                        Rate Limit Reached
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                        You have reached the maximum of <strong className="text-red-600 dark:text-red-400">3 prompts per 12 hours</strong>.
                                        Please wait before creating more prompts.
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500 mb-6 bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg w-full">
                                        <Clock className="h-4 w-4 shrink-0" />
                                        <span>The limit resets 12 hours after your first prompt of the period</span>
                                    </div>
                                    <div className="flex gap-3 w-full">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => router.push('/explore')}
                                        >
                                            Browse Prompts
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            onClick={() => setShowRateLimitWarning(false)}
                                        >
                                            Got It
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Preview Modal */}
                {showPreview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-zinc-950 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b p-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Preview</h3>
                                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Title */}
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{formData.title || 'Untitled Prompt'}</h1>
                                    <p className="text-zinc-600 dark:text-zinc-400">{formData.description || 'No description provided'}</p>
                                </div>

                                {/* Meta Info */}
                                <div className="flex flex-wrap gap-2">
                                    {formData.category && (
                                        <Badge variant="secondary">{formData.category}</Badge>
                                    )}
                                    {formData.aiPlatform.map(platform => (
                                        <Badge key={platform} variant="outline">{platform}</Badge>
                                    ))}
                                    {formData.isPaid && (
                                        <Badge className="bg-green-500 text-white">${formData.price.toFixed(2)}</Badge>
                                    )}
                                </div>

                                {/* Prompt Text */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Prompt</h3>
                                    <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg font-mono text-sm whitespace-pre-wrap">
                                        {formData.promptText || 'No prompt text yet...'}
                                    </div>
                                </div>

                                {/* Tags */}
                                {formData.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold mb-2">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.tags.map(tag => (
                                                <Badge key={tag} variant="secondary">#{tag}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Proof Images */}
                                {formData.proofImages.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold mb-2">Example Results</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {formData.proofImages.map((image, index) => (
                                                <img
                                                    key={index}
                                                    src={image}
                                                    alt={`Result ${index + 1}`}
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <h2 className="text-2xl font-bold">Create New Prompt</h2>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Share your best AI prompts with the community
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="e.g., Create Stunning Product Photos with AI"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        className="text-lg"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        placeholder="Describe what this prompt does and what makes it effective..."
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        className="w-full min-h-[100px] px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 resize-none"
                                        rows={4}
                                    />
                                </div>

                                {/* Prompt Text */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Prompt <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        placeholder="Enter your prompt here..."
                                        value={formData.promptText}
                                        onChange={(e) => handleInputChange('promptText', e.target.value)}
                                        className="w-full min-h-[200px] px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono text-sm resize-none"
                                        rows={10}
                                    />
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                        {formData.promptText.length} characters
                                    </p>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                                    >
                                        <option value="">Select a category</option>
                                        {CATEGORIES.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* AI Platforms */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        AI Platforms <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {AI_PLATFORMS.map((platform) => (
                                            <Badge
                                                key={platform}
                                                variant={formData.aiPlatform.includes(platform) ? 'default' : 'outline'}
                                                className="cursor-pointer"
                                                onClick={() => toggleAIPlatform(platform)}
                                            >
                                                {platform}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Tags</label>
                                    <div className="flex gap-2 mb-2">
                                        <Input
                                            placeholder="Add a tag..."
                                            value={currentTag}
                                            onChange={(e) => setCurrentTag(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                        />
                                        <Button type="button" onClick={handleAddTag} variant="outline">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="gap-1">
                                                #{tag}
                                                <X
                                                    className="h-3 w-3 cursor-pointer"
                                                    onClick={() => handleRemoveTag(tag)}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Proof Images */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Example Results (Optional)
                                    </label>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                                        Upload images showing the results of using this prompt
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {formData.proofImages.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={image}
                                                    alt={`Proof ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
                                                <button
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="w-full h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                                            <div className="text-center">
                                                {uploadingImage ? (
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                                                ) : (
                                                    <>
                                                        <Upload className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                                                        <p className="text-xs text-zinc-600 dark:text-zinc-400">Upload Image</p>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={uploadingImage}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Settings */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <h3 className="font-semibold">Settings</h3>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Privacy */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Privacy</label>
                                    <select
                                        value={formData.privacy}
                                        onChange={(e) => handleInputChange('privacy', e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                                    >
                                        <option value="public">Public</option>
                                        <option value="followers">Followers Only</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>

                                {/* Monetization */}
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPaid}
                                            onChange={(e) => handleInputChange('isPaid', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-semibold">Monetize this prompt</span>
                                    </label>
                                    {formData.isPaid && (
                                        <div className="mt-2">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                                className="text-sm"
                                            />
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                                Price in USD
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tips Card */}
                        <Card className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                            <CardHeader>
                                <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                                    💡 Tips for Great Prompts
                                </h3>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-xs space-y-2 text-purple-800 dark:text-purple-200">
                                    <li>• Be specific and clear in your instructions</li>
                                    <li>• Include example outputs if possible</li>
                                    <li>• Test your prompt before publishing</li>
                                    <li>• Add relevant tags for discoverability</li>
                                    <li>• Explain what makes your prompt unique</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
