/**
 * Next.js Caching Configuration
 * This file defines revalidation periods for different types of data
 */

export const CACHE_REVALIDATE = {
    // Static content - revalidate every hour
    POOLS_LIST: 3600, // 1 hour

    // Semi-dynamic content - revalidate every 5 minutes
    PROMPTS_LIST: 300, // 5 minutes
    TRENDING_PROMPTS: 300, // 5 minutes
    FEATURED_POOL: 300, // 5 minutes

    // Dynamic content - revalidate every minute
    POOL_DETAIL: 60, // 1 minute
    PROMPT_DETAIL: 60, // 1 minute
    LEADERBOARD: 60, // 1 minute

    // User-specific content - no caching
    USER_PROFILE: 0, // No cache
    MY_POOLS: 0, // No cache
    MY_PROMPTS: 0, // No cache
} as const;

/**
 * Cache tags for on-demand revalidation
 */
export const CACHE_TAGS = {
    POOLS: 'pools',
    PROMPTS: 'prompts',
    USERS: 'users',
    LEADERBOARD: 'leaderboard',
    COMMENTS: 'comments',
} as const;

/**
 * Fetch options generator for Next.js cache configuration
 */
export function getCacheConfig(revalidate: number, tags?: string[]) {
    return {
        next: {
            revalidate,
            tags: tags || [],
        },
    };
}
