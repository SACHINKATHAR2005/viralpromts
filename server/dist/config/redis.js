"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCache = exports.deleteCache = exports.getCache = exports.setCache = exports.disconnectRedis = exports.getRedisClient = exports.connectRedis = void 0;
const redis_1 = require("redis");
let redisClient;
const connectRedis = async () => {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = (0, redis_1.createClient)({
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
        await redisClient.ping();
        console.log('✅ Redis connected and responding');
    }
    catch (error) {
        console.error('❌ Redis connection error:', error);
        console.log('⚠️ Continuing without Redis cache...');
    }
};
exports.connectRedis = connectRedis;
const getRedisClient = () => {
    return redisClient || null;
};
exports.getRedisClient = getRedisClient;
const disconnectRedis = async () => {
    try {
        if (redisClient) {
            await redisClient.quit();
            console.log('🔌 Redis disconnected');
        }
    }
    catch (error) {
        console.error('❌ Redis disconnection error:', error);
    }
};
exports.disconnectRedis = disconnectRedis;
const setCache = async (key, value, expireInSeconds) => {
    try {
        if (!redisClient || !redisClient.isReady) {
            return;
        }
        const serializedValue = JSON.stringify(value);
        if (expireInSeconds) {
            await redisClient.setEx(key, expireInSeconds, serializedValue);
        }
        else {
            await redisClient.set(key, serializedValue);
        }
    }
    catch (error) {
        console.error('❌ Cache set error:', error);
    }
};
exports.setCache = setCache;
const getCache = async (key) => {
    try {
        if (!redisClient || !redisClient.isReady) {
            return null;
        }
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    }
    catch (error) {
        console.error('❌ Cache get error:', error);
        return null;
    }
};
exports.getCache = getCache;
const deleteCache = async (key) => {
    try {
        if (!redisClient || !redisClient.isReady) {
            return;
        }
        await redisClient.del(key);
    }
    catch (error) {
        console.error('❌ Cache delete error:', error);
    }
};
exports.deleteCache = deleteCache;
const clearCache = async (pattern) => {
    try {
        if (!redisClient || !redisClient.isReady) {
            return;
        }
        if (pattern) {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }
        else {
            await redisClient.flushDb();
        }
    }
    catch (error) {
        console.error('❌ Cache clear error:', error);
    }
};
exports.clearCache = clearCache;
//# sourceMappingURL=redis.js.map