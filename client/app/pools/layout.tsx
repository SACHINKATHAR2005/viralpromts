import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pools & Challenges',
    description: 'Join creative challenges, vote on the best prompts, and collaborate with the community. Participate in ProductHunt-style pools with prizes and recognition.',
    keywords: [
        'prompt challenges',
        'AI challenges',
        'prompt competitions',
        'voting pools',
        'collaborative pools',
        'prompt contests',
        'creative challenges',
        'community voting',
        'prompt leaderboards',
        'challenge prizes',
        'AI prompt contests',
        'community challenges',
        'prompt battles',
        'creative competitions',
    ],
    openGraph: {
        title: 'Pools & Challenges - Viral Prompts',
        description: 'Join creative challenges, vote on the best prompts, and collaborate with the community.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Pools & Challenges - Viral Prompts',
        description: 'Join creative challenges, vote on the best prompts, and collaborate with the community.',
    },
};

export default function PoolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
