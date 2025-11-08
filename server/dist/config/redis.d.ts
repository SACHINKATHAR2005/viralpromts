import { RedisClientType } from 'redis';
export declare const connectRedis: () => Promise<void>;
export declare const getRedisClient: () => RedisClientType | null;
export declare const disconnectRedis: () => Promise<void>;
export declare const setCache: (key: string, value: any, expireInSeconds?: number) => Promise<void>;
export declare const getCache: (key: string) => Promise<any | null>;
export declare const deleteCache: (key: string) => Promise<void>;
export declare const clearCache: (pattern?: string) => Promise<void>;
//# sourceMappingURL=redis.d.ts.map