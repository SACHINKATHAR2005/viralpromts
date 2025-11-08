"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = require("../config/redis");
class CacheService {
    static getRedis() {
        return (0, redis_1.getRedisClient)();
    }
    static isRedisAvailable() {
        const client = this.getRedis();
        return client !== null;
    }
    static async get(key) {
        try {
            const client = this.getRedis();
            if (!client || !this.isRedisAvailable()) {
                return null;
            }
            const data = await client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    static async set(key, data, expireInSeconds) {
        try {
            const client = this.getRedis();
            if (!client || !this.isRedisAvailable()) {
                return;
            }
            const serializedData = JSON.stringify(data);
            if (expireInSeconds) {
                await client.setEx(key, expireInSeconds, serializedData);
            }
            else {
                await client.set(key, serializedData);
            }
        }
        catch (error) {
            console.error('Cache set error:', error);
        }
    }
    static async delete(key) {
        try {
            const client = this.getRedis();
            if (!client || !this.isRedisAvailable()) {
                return;
            }
            if (Array.isArray(key)) {
                await client.del(key);
            }
            else {
                await client.del(key);
            }
        }
        catch (error) {
            console.error('Cache delete error:', error);
        }
    }
    static async deletePattern(pattern) {
        try {
            const client = this.getRedis();
            if (!client || !this.isRedisAvailable()) {
                return;
            }
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(keys);
            }
        }
        catch (error) {
            console.error('Cache delete pattern error:', error);
        }
    }
    static async healthCheck() {
        try {
            const client = this.getRedis();
            if (!client)
                return false;
            await client.ping();
            return true;
        }
        catch (error) {
            console.error('Redis health check failed:', error);
            return false;
        }
    }
    static async cacheUser(userId, userData) {
        await this.set(this.keys.user(userId), userData, this.durations.LONG);
    }
    static async getUser(userId) {
        return this.get(this.keys.user(userId));
    }
    static async cachePrompt(promptId, promptData) {
        await this.set(this.keys.prompt(promptId), promptData, this.durations.MEDIUM);
    }
    static async getPrompt(promptId) {
        return this.get(this.keys.prompt(promptId));
    }
    static async invalidatePromptCaches(promptId) {
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
    static async invalidateUserCaches(userId) {
        await this.delete([
            this.keys.user(userId),
            this.keys.userProfile(userId),
            this.keys.userFollowers(userId),
            this.keys.userFollowing(userId),
            this.keys.savedPrompts(userId),
            this.keys.userRatings(userId)
        ]);
    }
    static async cachePopularPrompts(page, prompts) {
        await this.set(this.keys.popularPrompts(page), prompts, this.durations.MEDIUM);
    }
    static async getPopularPrompts(page) {
        const result = await this.get(this.keys.popularPrompts(page));
        return Array.isArray(result) ? result : [];
    }
}
exports.CacheService = CacheService;
CacheService.keys = {
    user: (id) => `user:${id}`,
    prompt: (id) => `prompt:${id}`,
    promptStats: (id) => `prompt:stats:${id}`,
    userPrompts: (userId, page) => `user:prompts:${userId}:${page}`,
    popularPrompts: (page) => `popular:prompts:${page}`,
    userProfile: (id) => `profile:${id}`,
    promptComments: (promptId, page) => `comments:${promptId}:${page}`,
    userFollowers: (userId) => `followers:${userId}`,
    userFollowing: (userId) => `following:${userId}`,
    poolList: (page, type) => `pools:${type || 'all'}:${page}`,
    communityCallList: (page) => `calls:${page}`,
    savedPrompts: (userId) => `saved:${userId}`,
    userRatings: (userId) => `ratings:user:${userId}`,
    promptRatings: (promptId) => `ratings:prompt:${promptId}`,
    searchResults: (query, page) => `search:${query}:${page}`,
    trendingTags: () => 'trending:tags',
    userFeed: (userId, page) => `feed:${userId}:${page}`
};
CacheService.durations = {
    SHORT: 300,
    MEDIUM: 1800,
    LONG: 3600,
    VERY_LONG: 86400,
    WEEK: 604800
};
//# sourceMappingURL=cache.service.js.map