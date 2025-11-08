import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        redisClient = createClient({
            url: redisUrl,
            password: process.env.REDIS_PASSWORD || undefined,
            database: parseInt(process.env.REDIS_DB || '0'),
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
            }
        });

        redisClient.on('error', (error) => {
            console.error('❌ Redis Client Error:', error);
        });

        redisClient.on('connect', () => {
            console.log('🔗 Redis Client connecting...');
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis Client ready');
        });

        redisClient.on('reconnecting', () => {
            console.log('🔄 Redis Client reconnecting...');
        });

        redisClient.on('end', () => {
            console.log('🔌 Redis Client disconnected');
        });

        await redisClient.connect();

        // Test the connection
        await redisClient.ping();
        console.log('✅ Redis connected and responding');

    } catch (error) {
        console.error('❌ Redis connection error:', error);
        // Don't throw error - app should work without Redis
        console.log('⚠️ Continuing without Redis cache...');
    }
};

export const getRedisClient = (): RedisClientType | null => {
    return redisClient || null;
};

export const disconnectRedis = async (): Promise<void> => {
    try {
        if (redisClient) {
            await redisClient.quit();
            console.log('🔌 Redis disconnected');
        }
    } catch (error) {
        console.error('❌ Redis disconnection error:', error);
    }
};

// Cache utility functions
export const setCache = async (key: string, value: any, expireInSeconds?: number): Promise<void> => {
    try {
        if (!redisClient || !redisClient.isReady) {
            return; // Fail silently if Redis is not available
        }

        const serializedValue = JSON.stringify(value);

        if (expireInSeconds) {
            await redisClient.setEx(key, expireInSeconds, serializedValue);
        } else {
            await redisClient.set(key, serializedValue);
        }
    } catch (error) {
        console.error('❌ Cache set error:', error);
        // Fail silently - don't break the app if cache fails
    }
};

export const getCache = async (key: string): Promise<any | null> => {
    try {
        if (!redisClient || !redisClient.isReady) {
            return null; // Return null if Redis is not available
        }

        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('❌ Cache get error:', error);
        return null; // Return null on error
    }
};

export const deleteCache = async (key: string): Promise<void> => {
    try {
        if (!redisClient || !redisClient.isReady) {
            return;
        }

        await redisClient.del(key);
    } catch (error) {
        console.error('❌ Cache delete error:', error);
    }
};

export const clearCache = async (pattern?: string): Promise<void> => {
    try {
        if (!redisClient || !redisClient.isReady) {
            return;
        }

        if (pattern) {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } else {
            await redisClient.flushDb();
        }
    } catch (error) {
        console.error('❌ Cache clear error:', error);
    }
};