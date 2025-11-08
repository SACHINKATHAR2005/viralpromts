"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const redis_1 = require("../config/redis");
class SessionService {
    static getRedis() {
        try {
            return (0, redis_1.getRedisClient)();
        }
        catch (error) {
            console.error('Redis not available:', error);
            return null;
        }
    }
    static isRedisAvailable() {
        return this.getRedis() !== null;
    }
    static async safeRedisOperation(operation, fallback) {
        try {
            const client = this.getRedis();
            if (!client)
                return fallback;
            return await operation(client);
        }
        catch (error) {
            console.error('Redis operation failed:', error);
            return fallback;
        }
    }
    static async createSession(sessionId, sessionData, rememberMe = false) {
        await this.safeRedisOperation(async (client) => {
            const sessionKey = this.keys.session(sessionId);
            const userSessionsKey = this.keys.userSessions(sessionData.userId);
            const duration = rememberMe ? this.durations.REMEMBER_ME : this.durations.SESSION;
            await client.setEx(sessionKey, duration, JSON.stringify(sessionData));
            await client.sAdd(userSessionsKey, sessionId);
            await client.expire(userSessionsKey, duration);
            await this.trackActiveUser(sessionData.userId);
        }, undefined);
    }
    static async getSession(sessionId) {
        return this.safeRedisOperation(async (client) => {
            const sessionKey = this.keys.session(sessionId);
            const data = await client.get(sessionKey);
            if (!data)
                return null;
            const sessionData = JSON.parse(data);
            sessionData.lastActivity = new Date();
            await client.setEx(sessionKey, this.durations.SESSION, JSON.stringify(sessionData));
            await this.trackActiveUser(sessionData.userId);
            return sessionData;
        }, null);
    }
    static async updateSession(sessionId, updates) {
        await this.safeRedisOperation(async (client) => {
            const sessionKey = this.keys.session(sessionId);
            const existingData = await client.get(sessionKey);
            if (!existingData)
                return;
            const sessionData = { ...JSON.parse(existingData), ...updates };
            await client.setEx(sessionKey, this.durations.SESSION, JSON.stringify(sessionData));
        }, undefined);
    }
    static async deleteSession(sessionId) {
        await this.safeRedisOperation(async (client) => {
            const sessionKey = this.keys.session(sessionId);
            const sessionData = await client.get(sessionKey);
            if (sessionData) {
                const { userId } = JSON.parse(sessionData);
                const userSessionsKey = this.keys.userSessions(userId);
                await client.sRem(userSessionsKey, sessionId);
            }
            await client.del(sessionKey);
        }, undefined);
    }
    static async deleteUserSessions(userId) {
        await this.safeRedisOperation(async (client) => {
            const userSessionsKey = this.keys.userSessions(userId);
            const sessionIds = await client.sMembers(userSessionsKey);
            const deletePromises = sessionIds.map((sessionId) => client.del(this.keys.session(sessionId)));
            await Promise.all(deletePromises);
            await client.del(userSessionsKey);
        }, undefined);
    }
    static async getUserSessions(userId) {
        return this.safeRedisOperation(async (client) => {
            const userSessionsKey = this.keys.userSessions(userId);
            const sessionIds = await client.sMembers(userSessionsKey);
            const sessions = [];
            for (const sessionId of sessionIds) {
                const sessionKey = this.keys.session(sessionId);
                const data = await client.get(sessionKey);
                if (data) {
                    sessions.push(JSON.parse(data));
                }
            }
            return sessions;
        }, []);
    }
    static async blacklistToken(tokenData) {
        await this.safeRedisOperation(async (client) => {
            const tokenKey = this.keys.blacklistedToken(tokenData.jti);
            const userBlacklistKey = this.keys.userBlacklist(tokenData.userId);
            const ttl = Math.max(0, tokenData.exp - Math.floor(Date.now() / 1000));
            if (ttl > 0) {
                await client.setEx(tokenKey, ttl, JSON.stringify(tokenData));
                await client.sAdd(userBlacklistKey, tokenData.jti);
                await client.expire(userBlacklistKey, ttl);
            }
        }, undefined);
    }
    static async isTokenBlacklisted(jti) {
        return this.safeRedisOperation(async (client) => {
            const tokenKey = this.keys.blacklistedToken(jti);
            const exists = await client.exists(tokenKey);
            return exists === 1;
        }, false);
    }
    static async trackActiveUser(userId) {
        await this.safeRedisOperation(async (client) => {
            const activeUsersKey = this.keys.activeUsers();
            await client.zAdd(activeUsersKey, {
                score: Date.now(),
                value: userId
            });
            const cutoff = Date.now() - (15 * 60 * 1000);
            await client.zRemRangeByScore(activeUsersKey, 0, cutoff);
        }, undefined);
    }
    static async getActiveUsersCount() {
        return this.safeRedisOperation(async (client) => {
            const activeUsersKey = this.keys.activeUsers();
            return await client.zCard(activeUsersKey);
        }, 0);
    }
    static async trackLoginAttempt(identifier, success = false) {
        return this.safeRedisOperation(async (client) => {
            const key = this.keys.loginAttempts(identifier);
            if (success) {
                await client.del(key);
                return 0;
            }
            else {
                const attempts = await client.incr(key);
                await client.expire(key, this.durations.LOGIN_ATTEMPTS);
                return attempts;
            }
        }, 0);
    }
    static async getLoginAttempts(identifier) {
        return this.safeRedisOperation(async (client) => {
            const key = this.keys.loginAttempts(identifier);
            const attempts = await client.get(key);
            return attempts ? parseInt(attempts) : 0;
        }, 0);
    }
    static async storePasswordResetToken(token, userId) {
        await this.safeRedisOperation(async (client) => {
            const key = this.keys.passwordReset(token);
            await client.setEx(key, this.durations.PASSWORD_RESET, userId);
        }, undefined);
    }
    static async consumePasswordResetToken(token) {
        return this.safeRedisOperation(async (client) => {
            const key = this.keys.passwordReset(token);
            const userId = await client.get(key);
            if (userId) {
                await client.del(key);
            }
            return userId;
        }, null);
    }
    static async storeEmailVerificationToken(token, userId) {
        await this.safeRedisOperation(async (client) => {
            const key = this.keys.emailVerification(token);
            await client.setEx(key, this.durations.EMAIL_VERIFY, userId);
        }, undefined);
    }
    static async consumeEmailVerificationToken(token) {
        return this.safeRedisOperation(async (client) => {
            const key = this.keys.emailVerification(token);
            const userId = await client.get(key);
            if (userId) {
                await client.del(key);
            }
            return userId;
        }, null);
    }
    static async cleanup() {
        await this.safeRedisOperation(async (client) => {
            const cutoff = Date.now() - (15 * 60 * 1000);
            await client.zRemRangeByScore(this.keys.activeUsers(), 0, cutoff);
        }, undefined);
    }
    static async healthCheck() {
        return this.safeRedisOperation(async (client) => {
            await client.ping();
            return true;
        }, false);
    }
}
exports.SessionService = SessionService;
SessionService.keys = {
    session: (sessionId) => `session:${sessionId}`,
    userSessions: (userId) => `user_sessions:${userId}`,
    blacklistedToken: (jti) => `blacklist:${jti}`,
    userBlacklist: (userId) => `user_blacklist:${userId}`,
    activeUsers: () => 'active_users',
    loginAttempts: (identifier) => `login_attempts:${identifier}`,
    passwordReset: (token) => `password_reset:${token}`,
    emailVerification: (token) => `email_verify:${token}`
};
SessionService.durations = {
    SESSION: 24 * 60 * 60,
    REMEMBER_ME: 30 * 24 * 60 * 60,
    ACTIVE_USER: 15 * 60,
    LOGIN_ATTEMPTS: 15 * 60,
    PASSWORD_RESET: 60 * 60,
    EMAIL_VERIFY: 24 * 60 * 60
};
//# sourceMappingURL=session.service.js.map