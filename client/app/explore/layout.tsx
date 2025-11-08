import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Explore Prompts',
    description: 'Browse thousands of creative AI prompts for ChatGPT, Midjourney, Stable Diffusion, Claude, and more. Filter by category, AI platform, and discover trending prompts from the community.',
    keywords: [
        'explore prompts',
        'browse AI prompts',
        'ChatGPT prompts',
        'Midjourney prompts',
        'Stable Diffusion prompts',
        'Claude prompts',
        'trending prompts',
        'popular prompts',
        'AI prompt library',
        'prompt marketplace',
        'creative AI prompts',
        'prompt engineering examples',
        'AI writing prompts',
        'image generation prompts',
        'prompt templates',
        'prompt discovery',
    ],
    openGraph: {
        title: 'Explore Prompts - Viral Prompts',
        description: 'Browse thousands of creative AI prompts for ChatGPT, Midjourney, Stable Diffusion, and more.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Explore Prompts - Viral Prompts',
        description: 'Browse thousands of creative AI prompts for ChatGPT, Midjourney, Stable Diffusion, and more.',
    },
};

export default function ExploreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
