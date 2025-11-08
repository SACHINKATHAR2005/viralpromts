import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import { AuthRequest } from '../types/auth.types';

interface RateLimitOptions {
    windowMs: number;     // Time window in milliseconds
    maxRequests: number;  // Maximum requests per window
    message?: string;     // Custom error message
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
}

export class RateLimitService {
    private static getRedis() {
        return getRedisClient();
    }

    /**
     * Create rate limiting middleware
     */
    static createRateLimit(options: RateLimitOptions) {
        const {
            windowMs,
            maxRequests,
            message = 'Too many requests, please try again later',
            skipSuccessfulRequests = false,
            skipFailedRequests = false,
            keyGenerator = (req: Request) => req.ip || 'unknown'
        } = options;

        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const client = this.getRedis();

                // If Redis is not available, skip rate limiting
                if (!client) {
                    console.warn('Rate limiting skipped: Redis not available');
                    return next();
                }

                const key = `rate_limit:${keyGenerator(req)}`;
                const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
                const windowKey = `${key}:${windowStart}`;

                // Get current request count
                const currentRequests = await client?.get(windowKey);
                const requestCount = currentRequests ? parseInt(currentRequests) : 0;

                // Check if limit exceeded
                if (requestCount >= maxRequests) {
                    return res.status(429).json({
                        success: false,
                        message,
                        retryAfter: Math.ceil((windowStart + windowMs - Date.now()) / 1000)
                    });
                }

                // Store original res.json to track successful/failed requests
                const originalJson = res.json;
                let requestCounted = false;

                res.json = function (data: any) {
                    if (!requestCounted) {
                        const isSuccess = res.statusCode < 400;
                        const shouldCount = (!skipSuccessfulRequests || !isSuccess) &&
                            (!skipFailedRequests || isSuccess);

                        if (shouldCount) {
                            // Increment counter
                            client?.incr(windowKey).then(() => {
                                client?.expire(windowKey, Math.ceil(windowMs / 1000));
                            }).catch(console.error);
                        }
                        requestCounted = true;
                    }
                    return originalJson.call(this, data);
                };

                // Set rate limit headers
                res.set({
                    'X-RateLimit-Limit': maxRequests.toString(),
                    'X-RateLimit-Remaining': Math.max(0, maxRequests - requestCount - 1).toString(),
                    'X-RateLimit-Reset': Math.ceil((windowStart + windowMs) / 1000).toString()
                });

                next();
            } catch (error) {
                console.error('Rate limiting error:', error);
                // Continue without rate limiting if Redis fails
                next();
            }
        };
    }

    /**
     * Global API rate limiting
     */
    static globalLimit = this.createRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,        // 1000 requests per 15 minutes
        message: 'Too many API requests from this IP, please try again later'
    });

    /**
     * Authentication rate limiting
     */
    static authLimit = this.createRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,           // 5 auth attempts per 15 minutes
        message: 'Too many authentication attempts, please try again later',
        keyGenerator: (req: Request) => `auth:${req.ip}`
    });

    /**
     * Social action rate limiting (likes, comments, follows)
     */
    static socialLimit = this.createRateLimit({
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 30,          // 30 social actions per minute
        message: 'Too many social actions, please slow down',
        keyGenerator: (req: AuthRequest) => `social:${req.authenticatedUser?.userId || req.ip}`
    });

    /**
     * Upload rate limiting
     */
    static uploadLimit = this.createRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 50,          // 50 uploads per hour
        message: 'Upload limit exceeded, please try again later',
        keyGenerator: (req: AuthRequest) => `upload:${req.authenticatedUser?.userId || req.ip}`
    });

    /**
     * Search rate limiting
     */
    static searchLimit = this.createRateLimit({
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 60,          // 60 searches per minute
        message: 'Too many search requests, please slow down',
        keyGenerator: (req: Request) => `search:${req.ip}`
    });

    /**
     * Comment rate limiting
     */
    static commentLimit = this.createRateLimit({
        windowMs: 5 * 60 * 1000,  // 5 minutes
        maxRequests: 10,          // 10 comments per 5 minutes
        message: 'Too many comments, please wait before commenting again',
        keyGenerator: (req: AuthRequest) => `comment:${req.authenticatedUser?.userId || req.ip}`
    });

    /**
     * Pool/Community call creation rate limiting
     */
    static creationLimit = this.createRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 5,           // 5 creations per hour
        message: 'Creation limit exceeded, please try again later',
        keyGenerator: (req: AuthRequest) => `create:${req.authenticatedUser?.userId || req.ip}`
    });

    /**
     * Check if user is rate limited for specific action
     */
    static async isRateLimited(userId: string, action: string, maxRequests: number, windowMs: number): Promise<boolean> {
        try {
            const client = this.getRedis();
            if (!client) return false; // Fail open if Redis unavailable

            const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
            const key = `rate_limit:${action}:${userId}:${windowStart}`;

            const currentRequests = await client.get(key);
            const requestCount = currentRequests ? parseInt(currentRequests) : 0;

            return requestCount >= maxRequests;
        } catch (error) {
            console.error('Rate limit check error:', error);
            return false; // Fail open
        }
    }

    /**
     * Increment rate limit counter
     */
    static async incrementCounter(userId: string, action: string, windowMs: number): Promise<void> {
        try {
            const client = this.getRedis();
            if (!client) return; // Skip if Redis unavailable

            const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
            const key = `rate_limit:${action}:${userId}:${windowStart}`;

            await client.incr(key);
            await client.expire(key, Math.ceil(windowMs / 1000));
        } catch (error) {
            console.error('Rate limit increment error:', error);
        }
    }

    /**
     * Get remaining requests for user action
     */
    static async getRemainingRequests(userId: string, action: string, maxRequests: number, windowMs: number): Promise<number> {
        try {
            const client = this.getRedis();
            if (!client) return maxRequests; // Fail open if Redis unavailable

            const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
            const key = `rate_limit:${action}:${userId}:${windowStart}`;

            const currentRequests = await client.get(key);
            const requestCount = currentRequests ? parseInt(currentRequests) : 0;

            return Math.max(0, maxRequests - requestCount);
        } catch (error) {
            console.error('Rate limit remaining check error:', error);
            return maxRequests; // Fail open
        }
    }

    /**
     * Reset rate limit for user action (admin function)
     */
    static async resetRateLimit(userId: string, action: string): Promise<void> {
        try {
            const client = this.getRedis();
            if (!client) return; // Skip if Redis unavailable

            const pattern = `rate_limit:${action}:${userId}:*`;
            const keys = await client.keys(pattern);

            if (keys.length > 0) {
                await client.del(keys);
            }
        } catch (error) {
            console.error('Rate limit reset error:', error);
        }
    }
}
