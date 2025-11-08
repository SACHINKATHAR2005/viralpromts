"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialCacheInvalidation = exports.cacheInvalidationMiddleware = exports.userCacheMiddleware = exports.cacheMiddleware = void 0;
const cache_service_1 = require("../services/cache.service");
const cacheMiddleware = (durationInSeconds) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }
        try {
            const cacheKey = `route:${req.originalUrl}`;
            const cachedData = await cache_service_1.CacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }
            const originalJson = res.json;
            res.json = function (data) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cache_service_1.CacheService.set(cacheKey, data, durationInSeconds).catch(console.error);
                }
                return originalJson.call(this, data);
            };
            next();
        }
        catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};
exports.cacheMiddleware = cacheMiddleware;
const userCacheMiddleware = (durationInSeconds) => {
    return async (req, res, next) => {
        if (req.method !== 'GET' || !req.authenticatedUser) {
            return next();
        }
        try {
            const userId = req.authenticatedUser.userId;
            const cacheKey = `user_route:${userId}:${req.originalUrl}`;
            const cachedData = await cache_service_1.CacheService.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }
            const originalJson = res.json;
            res.json = function (data) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cache_service_1.CacheService.set(cacheKey, data, durationInSeconds).catch(console.error);
                }
                return originalJson.call(this, data);
            };
            next();
        }
        catch (error) {
            console.error('User cache middleware error:', error);
            next();
        }
    };
};
exports.userCacheMiddleware = userCacheMiddleware;
const cacheInvalidationMiddleware = (patterns) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        res.json = function (data) {
            const result = originalJson.call(this, data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
                Promise.all(patterns.map(pattern => cache_service_1.CacheService.delete(pattern))).catch(console.error);
            }
            return result;
        };
        next();
    };
};
exports.cacheInvalidationMiddleware = cacheInvalidationMiddleware;
const socialCacheInvalidation = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        const result = originalJson.call(this, data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const userId = req.authenticatedUser?.userId;
            const { promptId, userId: targetUserId } = req.params;
            const invalidationPromises = [];
            if (promptId) {
                invalidationPromises.push(cache_service_1.CacheService.invalidateUserCaches(promptId));
            }
            if (userId) {
                invalidationPromises.push(cache_service_1.CacheService.invalidateUserCaches(userId));
            }
            if (targetUserId) {
                invalidationPromises.push(cache_service_1.CacheService.invalidateUserCaches(targetUserId));
            }
            invalidationPromises.push(cache_service_1.CacheService.delete('popular:prompts:*'), cache_service_1.CacheService.delete('feed:*'));
            Promise.all(invalidationPromises).catch(console.error);
        }
        return result;
    };
    next();
};
exports.socialCacheInvalidation = socialCacheInvalidation;
//# sourceMappingURL=cache.middleware.js.map