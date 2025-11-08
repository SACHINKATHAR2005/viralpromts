/**
 * JSON-LD Structured Data Utilities
 * For better SEO and rich snippets in search results
 */

export function getWebsiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Viral Prompts',
        description: 'Discover and share creative AI prompts for ChatGPT, Midjourney, and more',
        url: 'https://viralprompts.com',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://viralprompts.com/explore?search={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

export function getOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Viral Prompts',
        description: 'A platform for discovering, sharing, and collaborating on creative AI prompts',
        url: 'https://viralprompts.com',
        logo: 'https://viralprompts.com/logo.png',
        sameAs: [
            'https://twitter.com/viralprompts',
            'https://github.com/viralprompts',
        ],
    };
}

export function getPromptSchema(prompt: {
    title: string;
    description: string;
    creator: { username: string };
    category: string;
    tags: string[];
    createdAt: string;
    stats: { totalLikes: number; totalComments: number; averageRating: number };
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: prompt.title,
        description: prompt.description,
        author: {
            '@type': 'Person',
            name: prompt.creator.username,
        },
        genre: prompt.category,
        keywords: prompt.tags.join(', '),
        datePublished: prompt.createdAt,
        interactionStatistic: [
            {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/LikeAction',
                userInteractionCount: prompt.stats.totalLikes,
            },
            {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/CommentAction',
                userInteractionCount: prompt.stats.totalComments,
            },
        ],
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: prompt.stats.averageRating,
            ratingCount: prompt.stats.totalLikes,
        },
    };
}

export function getPoolSchema(pool: {
    title: string;
    description: string;
    type: string;
    challenge?: { prize?: string; endDate?: string };
    stats: { totalParticipants: number; totalPrompts: number };
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CompetitionEvent',
        name: pool.title,
        description: pool.description,
        eventStatus: 'https://schema.org/EventScheduled',
        ...(pool.challenge?.endDate && {
            endDate: pool.challenge.endDate,
        }),
        ...(pool.challenge?.prize && {
            offers: {
                '@type': 'Offer',
                description: pool.challenge.prize,
            },
        }),
        performer: {
            '@type': 'Organization',
            name: 'Viral Prompts Community',
        },
        attendeeCount: pool.stats.totalParticipants,
    };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}
