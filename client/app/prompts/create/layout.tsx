import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create Prompt',
    description: 'Share your creative AI prompts with the community. Upload proof of results, categorize your prompts, and monetize your best work.',
    keywords: [
        'create prompt',
        'share prompt',
        'upload prompt',
        'submit AI prompt',
        'monetize prompts',
        'sell prompts',
        'prompt creation',
        'AI prompt submission',
        'share AI prompts',
        'publish prompts',
    ],
    openGraph: {
        title: 'Create Prompt - Viral Prompts',
        description: 'Share your creative AI prompts with the community.',
        type: 'website',
    },
    robots: {
        index: false, // Don't index creation pages
        follow: true,
    },
};

export default function CreatePromptLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
