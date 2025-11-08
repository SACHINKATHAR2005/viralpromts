"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const redis_1 = require("../config/redis");
class RateLimitService {
    static getRedis() {
        return (0, redis_1.getRedisClient)();
    }
    static createRateLimit(options) {
        const { windowMs, maxRequests, message = 'Too many requests, please try again later', skipSuccessfulRequests = false, skipFailedRequests = false, keyGenerator = (req) => req.ip || 'unknown' } = options;
        return async (req, res, next) => {
            try {
                const client = this.getRedis();
                if (!client) {
                    console.warn('Rate limiting skipped: Redis not available');
                    return next();
                }
                const key = `rate_limit:${keyGenerator(req)}`;
                const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
                const windowKey = `${key}:${windowStart}`;
                const currentRequests = await client?.get(windowKey);
                const requestCount = currentRequests ? parseInt(currentRequests) : 0;
                if (requestCount >= maxRequests) {
                    return res.status(429).json({
                        success: false,
                        message,
                        retryAfter: Math.ceil((windowStart + windowMs - Date.now()) / 1000)
                    });
                }
                const originalJson = res.json;
                let requestCounted = false;
                res.json = function (data) {
                    if (!requestCounted) {
                        const isSuccess = res.statusCode < 400;
                        const shouldCount = (!skipSuccessfulRequests || !isSuccess) &&
                            (!skipFailedRequests || isSuccess);
                        if (shouldCount) {
                            client?.incr(windowKey).then(() => {
                                client?.expire(windowKey, Math.ceil(windowMs / 1000));
                            }).catch(console.error);
                        }
                        requestCounted = true;
                    }
                    return originalJson.call(this, data);
                };
                res.set({
                    'X-RateLimit-Limit': maxRequests.toString(),
                    'X-RateLimit-Remaining': Math.max(0, maxRequests - requestCount - 1).toString(),
                    'X-RateLimit-Reset': Math.ceil((windowStart + windowMs) / 1000).toString()
                });
                next();
            }
            catch (error) {
                console.error('Rate limiting error:', error);
                next();
            }
        };
    }
    static async isRateLimited(userId, action, maxRequests, windowMs) {
        try {
            const client = this.getRedis();
            if (!client)
                return false;
            const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
            const key = `rate_limit:${action}:${userId}:${windowStart}`;
            const currentRequests = await client.get(key);
            const requestCount = currentRequests ? parseInt(currentRequests) : 0;
            return requestCount >= maxRequests;
        }
        catch (error) {
            console.error('Rate limit check error:', error);
            return false;
        }
    }
    static async incrementCounter(userId, action, windowMs) {
        try {
            const client = this.getRedis();
            if (!client)
                return;
            const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
            const key = `rate_limit:${action}:${userId}:${windowStart}`;
            await client.incr(key);
            await client.expire(key, Math.ceil(windowMs / 1000));
        }
        catch (error) {
            console.error('Rate limit increment error:', error);
        }
    }
    static async getRemainingRequests(userId, action, maxRequests, windowMs) {
        try {
            const client = this.getRedis();
            if (!client)
                return maxRequests;
            const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
            const key = `rate_limit:${action}:${userId}:${windowStart}`;
            const currentRequests = await client.get(key);
            const requestCount = currentRequests ? parseInt(currentRequests) : 0;
            return Math.max(0, maxRequests - requestCount);
        }
        catch (error) {
            console.error('Rate limit remaining check error:', error);
            return maxRequests;
        }
    }
    static async resetRateLimit(userId, action) {
        try {
            const client = this.getRedis();
            if (!client)
                return;
            const pattern = `rate_limit:${action}:${userId}:*`;
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(keys);
            }
        }
        catch (error) {
            console.error('Rate limit reset error:', error);
        }
    }
}
exports.RateLimitService = RateLimitService;
_a = RateLimitService;
RateLimitService.globalLimit = _a.createRateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 1000,
    message: 'Too many API requests from this IP, please try again later'
});
RateLimitService.authLimit = _a.createRateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later',
    keyGenerator: (req) => `auth:${req.ip}`
});
RateLimitService.socialLimit = _a.createRateLimit({
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: 'Too many social actions, please slow down',
    keyGenerator: (req) => `social:${req.authenticatedUser?.userId || req.ip}`
});
RateLimitService.uploadLimit = _a.createRateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 50,
    message: 'Upload limit exceeded, please try again later',
    keyGenerator: (req) => `upload:${req.authenticatedUser?.userId || req.ip}`
});
RateLimitService.searchLimit = _a.createRateLimit({
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: 'Too many search requests, please slow down',
    keyGenerator: (req) => `search:${req.ip}`
});
RateLimitService.commentLimit = _a.createRateLimit({
    windowMs: 5 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many comments, please wait before commenting again',
    keyGenerator: (req) => `comment:${req.authenticatedUser?.userId || req.ip}`
});
RateLimitService.creationLimit = _a.createRateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    message: 'Creation limit exceeded, please try again later',
    keyGenerator: (req) => `create:${req.authenticatedUser?.userId || req.ip}`
});
//# sourceMappingURL=rateLimit.middleware.js.map