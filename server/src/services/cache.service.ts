import { getRedisClient } from '../config/redis';

export class CacheService {
    private static getRedis() {
        return getRedisClient();
    }

    /**
     * Check if Redis is available
     */
    private static isRedisAvailable(): boolean {
        const client = this.getRedis();
        return client !== null;
    }

    // Cache keys
    private static keys = {
        user: (id: string) => `user:${id}`,
        prompt: (id: string) => `prompt:${id}`,
        promptStats: (id: string) => `prompt:stats:${id}`,
        userPrompts: (userId: string, page: number) => `user:prompts:${userId}:${page}`,
        popularPrompts: (page: number) => `popular:prompts:${page}`,
        userProfile: (id: string) => `profile:${id}`,
        promptComments: (promptId: string, page: number) => `comments:${promptId}:${page}`,
        userFollowers: (userId: string) => `followers:${userId}`,
        userFollowing: (userId: string) => `following:${userId}`,
        poolList: (page: number, type?: string) => `pools:${type || 'all'}:${page}`,
        communityCallList: (page: number) => `calls:${page}`,
        savedPrompts: (userId: string) => `saved:${userId}`,
        userRatings: (userId: string) => `ratings:user:${userId}`,
        promptRatings: (promptId: string) => `ratings:prompt:${promptId}`,
        searchResults: (query: string, page: number) => `search:${query}:${page}`,
        trendingTags: () => 'trending:tags',
        userFeed: (userId: string, page: number) => `feed:${userId}:${page}`
    };

    // Cache durations in seconds
    private static durations = {
        SHORT: 300,        // 5 minutes
        MEDIUM: 1800,      // 30 minutes
        LONG: 3600,        // 1 hour
        VERY_LONG: 86400,  // 24 hours
        WEEK: 604800       // 1 week
    };

    /**
     * Get cached data
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            const client = this.getRedis();
            if (!client || !this.isRedisAvailable()) {
                return null; // Return null if Redis not available
            }

            const data = await client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set cached data with expiration
     */
    static async set(key: string, data: any, expireInSeconds?: number): Promise<void> {
        try {
            const client = this.getRedis();
            if (!client || !this.isRedisAvailable()) {
                return; // Skip caching if Redis not available
            }

            const serializedData = JSON.stringify(data);

            if (expireInSeconds) {
                await client.setEx(key, expireInSeconds, serializedData);
            } else {
                await client.set(key, serializedData);
            }
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    /**
     * Delete cached data
     */
    static async delete(key: string | string[]): Promise<void> {
        try {
            const client = this.getRedis();
            if (!client || !this.isRedisAvailable()) {
                return; // Skip if Redis not available
            }

            if (Array.isArray(key)) {
                await client.del(key);
            } else {
                await client.del(key);
            }
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    /**
     * Delete keys by pattern
     */
    static async deletePattern(pattern: string): Promise<void> {
        try {
            const client = this.getRedis();
            if (!client || !this.isRedisAvailable()) {
                return; // Skip if Redis not available
            }

            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(keys);
            }
        } catch (error) {
            console.error('Cache delete pattern error:', error);
        }
    }

    /**
     * Health check
     */
    static async healthCheck(): Promise<boolean> {
        try {
            const client = this.getRedis();
            if (!client) return false;

            await client.ping();
            return true;
        } catch (error) {
            console.error('Redis health check failed:', error);
            return false;
        }
    }

    /**
     * Cache user data
     */
    static async cacheUser(userId: string, userData: any): Promise<void> {
        await this.set(this.keys.user(userId), userData, this.durations.LONG);
    }

    /**
     * Get cached user data
     */
    static async getUser(userId: string): Promise<any> {
        return this.get(this.keys.user(userId));
    }

    /**
     * Cache prompt data
     */
    static async cachePrompt(promptId: string, promptData: any): Promise<void> {
        await this.set(this.keys.prompt(promptId), promptData, this.durations.MEDIUM);
    }

    /**
     * Get cached prompt data
     */
    static async getPrompt(promptId: string): Promise<any> {
        return this.get(this.keys.prompt(promptId));
    }

    /**
     * Invalidate prompt-related caches
     */
    static async invalidatePromptCaches(promptId: string): Promise<void> {
        const patterns = [
            `prompt:${promptId}*`,
            `comments:${promptId}*`,
            `ratings:prompt:${promptId}*`,
            'popular:prompts:*',
            'search:*',
            'feed:*'
        ];

        for (const pattern of patterns) {
            await this.deletePattern(pattern);
        }
    }

    /**
     * Invalidate user-related caches
     */
    static async invalidateUserCaches(userId: string): Promise<void> {
        await this.delete([
            this.keys.user(userId),
            this.keys.userProfile(userId),
            this.keys.userFollowers(userId),
            this.keys.userFollowing(userId),
            this.keys.savedPrompts(userId),
            this.keys.userRatings(userId)
        ]);
    }

    /**
     * Cache popular prompts
     */
    static async cachePopularPrompts(page: number, prompts: any[]): Promise<void> {
        await this.set(this.keys.popularPrompts(page), prompts, this.durations.MEDIUM);
    }

    /**
     * Get cached popular prompts
     */
    static async getPopularPrompts(page: number): Promise<any[]> {
        const result = await this.get<any[]>(this.keys.popularPrompts(page));
        return Array.isArray(result) ? result : [];
    }
}