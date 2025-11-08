export declare class CacheService {
    private static getRedis;
    private static isRedisAvailable;
    private static keys;
    private static durations;
    static get<T>(key: string): Promise<T | null>;
    static set(key: string, data: any, expireInSeconds?: number): Promise<void>;
    static delete(key: string | string[]): Promise<void>;
    static deletePattern(pattern: string): Promise<void>;
    static healthCheck(): Promise<boolean>;
    static cacheUser(userId: string, userData: any): Promise<void>;
    static getUser(userId: string): Promise<any>;
    static cachePrompt(promptId: string, promptData: any): Promise<void>;
    static getPrompt(promptId: string): Promise<any>;
    static invalidatePromptCaches(promptId: string): Promise<void>;
    static invalidateUserCaches(userId: string): Promise<void>;
    static cachePopularPrompts(page: number, prompts: any[]): Promise<void>;
    static getPopularPrompts(page: number): Promise<any[]>;
}
//# sourceMappingURL=cache.service.d.ts.map