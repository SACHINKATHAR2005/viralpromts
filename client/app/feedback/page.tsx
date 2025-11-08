'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, MessageSquare, Bug, Lightbulb, Wrench } from 'lucide-react';
import { feedbackApi } from '@/lib/api/client';
import { toast } from 'sonner';

export default function FeedbackPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'other' as 'bug' | 'feature' | 'improvement' | 'other',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setIsSubmitting(true);
            await feedbackApi.submitFeedback(formData);
            toast.success('Feedback submitted successfully! Thank you for your input.');

            // Reset form
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
                category: 'other',
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = [
        { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-600' },
        { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-600' },
        { value: 'improvement', label: 'Improvement', icon: Wrench, color: 'text-blue-600' },
        { value: 'other', label: 'Other', icon: MessageSquare, color: 'text-zinc-600' },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    <h1 className="text-3xl font-bold mb-2">Send Feedback</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        We'd love to hear your thoughts, suggestions, or issues. Your feedback helps us improve!
                    </p>
                </div>

                <Card>
                    <CardHeader className="border-b p-6">
                        <h2 className="text-xl font-semibold">Feedback Form</h2>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your.email@example.com"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {categories.map((category) => {
                                        const Icon = category.icon;
                                        const isSelected = formData.category === category.value;
                                        return (
                                            <button
                                                key={category.value}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, category: category.value as any }))}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${isSelected
                                                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20'
                                                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                                    }`}
                                            >
                                                <Icon className={`h-6 w-6 ${isSelected ? 'text-purple-600' : category.color}`} />
                                                <span className={`text-sm font-medium ${isSelected ? 'text-purple-600' : ''}`}>
                                                    {category.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="Brief description of your feedback"
                                    required
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Please provide detailed information..."
                                    required
                                    rows={6}
                                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-zinc-950 resize-none"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="mt-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Note:</strong> We review all feedback and will respond to your email if we need more information.
                            Thank you for helping us make Viral Prompts better!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
