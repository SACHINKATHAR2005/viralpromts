import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/cache.service';
import { AuthRequest } from '../types/auth.types';

/**
 * Cache middleware for GET requests
 */
export const cacheMiddleware = (durationInSeconds: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            // Generate cache key based on URL and query parameters
            const cacheKey = `route:${req.originalUrl}`;

            // Try to get cached data
            const cachedData = await CacheService.get(cacheKey);

            if (cachedData) {
                return res.json(cachedData);
            }

            // Store original res.json
            const originalJson = res.json;

            // Override res.json to cache the response
            res.json = function (data: any) {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    CacheService.set(cacheKey, data, durationInSeconds).catch(console.error);
                }
                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next(); // Continue without caching
        }
    };
};

/**
 * User-specific cache middleware
 */
export const userCacheMiddleware = (durationInSeconds: number) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.method !== 'GET' || !req.authenticatedUser) {
            return next();
        }

        try {
            const userId = req.authenticatedUser.userId;
            const cacheKey = `user_route:${userId}:${req.originalUrl}`;

            const cachedData = await CacheService.get(cacheKey);

            if (cachedData) {
                return res.json(cachedData);
            }

            const originalJson = res.json;

            res.json = function (data: any) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    CacheService.set(cacheKey, data, durationInSeconds).catch(console.error);
                }
                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('User cache middleware error:', error);
            next();
        }
    };
};

/**
 * Cache invalidation middleware for write operations
 */
export const cacheInvalidationMiddleware = (patterns: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Store original res.json
        const originalJson = res.json;

        // Override res.json to invalidate cache after successful response
        res.json = function (data: any) {
            const result = originalJson.call(this, data);

            // Only invalidate cache on successful write operations
            if (res.statusCode >= 200 && res.statusCode < 300) {
                Promise.all(
                    patterns.map(pattern => CacheService.delete(pattern))
                ).catch(console.error);
            }

            return result;
        };

        next();
    };
};

/**
 * Smart cache invalidation for social actions
 */
export const socialCacheInvalidation = (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function (data: any) {
        const result = originalJson.call(this, data);

        if (res.statusCode >= 200 && res.statusCode < 300) {
            const userId = req.authenticatedUser?.userId;
            const { promptId, userId: targetUserId } = req.params;

            // Invalidate relevant caches based on action
            const invalidationPromises = [];

            if (promptId) {
                invalidationPromises.push(CacheService.invalidateUserCaches(promptId));
            }

            if (userId) {
                invalidationPromises.push(CacheService.invalidateUserCaches(userId));
            }

            if (targetUserId) {
                invalidationPromises.push(CacheService.invalidateUserCaches(targetUserId));
            }

            // Invalidate popular prompts and feeds
            invalidationPromises.push(
                CacheService.delete('popular:prompts:*'),
                CacheService.delete('feed:*')
            );

            Promise.all(invalidationPromises).catch(console.error);
        }

        return result;
    };

    next();
};