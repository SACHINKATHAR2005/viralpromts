import { getRedisClient } from '../config/redis';
import { Types } from 'mongoose';

interface SessionData {
    userId: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    lastActivity: Date;
    ipAddress?: string;
    userAgent?: string;
}

interface BlacklistedToken {
    jti: string;          // JWT ID
    userId: string;
    exp: number;          // Expiration timestamp
    reason?: string;      // Reason for blacklisting
}

export class SessionService {
    /**
     * Get Redis client safely
     */
    private static getRedis() {
        try {
            return getRedisClient();
        } catch (error) {
            console.error('Redis not available:', error);
            return null;
        }
    }

    /**
     * Check if Redis is available
     */
    private static isRedisAvailable(): boolean {
        return this.getRedis() !== null;
    }

    // Session key generators
    private static keys = {
        session: (sessionId: string) => `session:${sessionId}`,
        userSessions: (userId: string) => `user_sessions:${userId}`,
        blacklistedToken: (jti: string) => `blacklist:${jti}`,
        userBlacklist: (userId: string) => `user_blacklist:${userId}`,
        activeUsers: () => 'active_users',
        loginAttempts: (identifier: string) => `login_attempts:${identifier}`,
        passwordReset: (token: string) => `password_reset:${token}`,
        emailVerification: (token: string) => `email_verify:${token}`
    };

    // Cache durations
    private static durations = {
        SESSION: 24 * 60 * 60,        // 24 hours
        REMEMBER_ME: 30 * 24 * 60 * 60, // 30 days
        ACTIVE_USER: 15 * 60,         // 15 minutes
        LOGIN_ATTEMPTS: 15 * 60,      // 15 minutes
        PASSWORD_RESET: 60 * 60,      // 1 hour
        EMAIL_VERIFY: 24 * 60 * 60    // 24 hours
    };

    /**
     * Execute Redis operation safely
     */
    private static async safeRedisOperation<T>(operation: (client: any) => Promise<T>, fallback: T): Promise<T> {
        try {
            const client = this.getRedis();
            if (!client) return fallback;
            return await operation(client);
        } catch (error) {
            console.error('Redis operation failed:', error);
            return fallback;
        }
    }

    /**
     * Create a new session
     */
    static async createSession(sessionId: string, sessionData: SessionData, rememberMe: boolean = false): Promise<void> {
        await this.safeRedisOperation(async (client) => {
            const sessionKey = this.keys.session(sessionId);
            const userSessionsKey = this.keys.userSessions(sessionData.userId);

            const duration = rememberMe ? this.durations.REMEMBER_ME : this.durations.SESSION;

            // Store session data
            await client.setEx(sessionKey, duration, JSON.stringify(sessionData));

            // Add session to user's session list
            await client.sAdd(userSessionsKey, sessionId);
            await client.expire(userSessionsKey, duration);

            // Track active user
            await this.trackActiveUser(sessionData.userId);
        }, undefined);
    }

    /**
     * Get session data
     */
    static async getSession(sessionId: string): Promise<SessionData | null> {
        return this.safeRedisOperation(async (client) => {
            const sessionKey = this.keys.session(sessionId);

            const data = await client.get(sessionKey);
            if (!data) return null;

            const sessionData = JSON.parse(data) as SessionData;

            // Update last activity
            sessionData.lastActivity = new Date();
            await client.setEx(sessionKey, this.durations.SESSION, JSON.stringify(sessionData));

            // Track active user
            await this.trackActiveUser(sessionData.userId);

            return sessionData;
        }, null);
    }

    /**
     * Update session data
     */
    static async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
        await this.safeRedisOperation(async (client) => {
            const sessionKey = this.keys.session(sessionId);

            const existingData = await client.get(sessionKey);
            if (!existingData) return;

            const sessionData = { ...JSON.parse(existingData), ...updates };
            await client.setEx(sessionKey, this.durations.SESSION, JSON.stringify(sessionData));
        }, undefined);
    }

    /**
     * Delete a session
     */
    static async deleteSession(sessionId: string): Promise<void> {
        await this.safeRedisOperation(async (client) => {
            const sessionKey = this.keys.session(sessionId);

            // Get session data to get userId
            const sessionData = await client.get(sessionKey);
            if (sessionData) {
                const { userId } = JSON.parse(sessionData);
                const userSessionsKey = this.keys.userSessions(userId);

                // Remove from user's session list
                await client.sRem(userSessionsKey, sessionId);
            }

            // Delete session
            await client.del(sessionKey);
        }, undefined);
    }

    /**
     * Delete all sessions for a user
     */
    static async deleteUserSessions(userId: string): Promise<void> {
        await this.safeRedisOperation(async (client) => {
            const userSessionsKey = this.keys.userSessions(userId);

            // Get all session IDs for user
            const sessionIds = await client.sMembers(userSessionsKey);

            // Delete all sessions
            const deletePromises = sessionIds.map((sessionId: string) =>
                client.del(this.keys.session(sessionId))
            );
            await Promise.all(deletePromises);

            // Delete user sessions set
            await client.del(userSessionsKey);
        }, undefined);
    }

    /**
     * Get all sessions for a user
     */
    static async getUserSessions(userId: string): Promise<SessionData[]> {
        return this.safeRedisOperation(async (client) => {
            const userSessionsKey = this.keys.userSessions(userId);

            const sessionIds = await client.sMembers(userSessionsKey);
            const sessions: SessionData[] = [];

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

    /**
     * Blacklist a JWT token
     */
    static async blacklistToken(tokenData: BlacklistedToken): Promise<void> {
        await this.safeRedisOperation(async (client) => {
            const tokenKey = this.keys.blacklistedToken(tokenData.jti);
            const userBlacklistKey = this.keys.userBlacklist(tokenData.userId);

            // Calculate TTL based on token expiration
            const ttl = Math.max(0, tokenData.exp - Math.floor(Date.now() / 1000));

            if (ttl > 0) {
                // Store blacklisted token
                await client.setEx(tokenKey, ttl, JSON.stringify(tokenData));

                // Add to user's blacklist
                await client.sAdd(userBlacklistKey, tokenData.jti);
                await client.expire(userBlacklistKey, ttl);
            }
        }, undefined);
    }

    /**
     * Check if token is blacklisted
     */
    static async isTokenBlacklisted(jti: string): Promise<boolean> {
        return this.safeRedisOperation(async (client) => {
            const tokenKey = this.keys.blacklistedToken(jti);
            const exists = await client.exists(tokenKey);
            return exists === 1;
        }, false); // Fail open for security
    }

    /**
     * Track active user
     */
    static async trackActiveUser(userId: string): Promise<void> {
        await this.safeRedisOperation(async (client) => {
            const activeUsersKey = this.keys.activeUsers();

            await client.zAdd(activeUsersKey, {
                score: Date.now(),
                value: userId
            });

            // Remove users inactive for more than 15 minutes
            const cutoff = Date.now() - (15 * 60 * 1000);
            await client.zRemRangeByScore(activeUsersKey, 0, cutoff);
        }, undefined);
    }

    /**
     * Get active users count
     */
    static async getActiveUsersCount(): Promise<number> {
        return this.safeRedisOperation(async (client) => {
            const activeUsersKey = this.keys.activeUsers();
            return await client.zCard(activeUsersKey);
        }, 0);
    }

    /**
     * Track login attempt
     */
    static async trackLoginAttempt(identifier: string, success: boolean = false): Promise<number> {
        return this.safeRedisOperation(async (client) => {
            const key = this.keys.loginAttempts(identifier);

            if (success) {
                // Clear attempts on successful login
                await client.del(key);
                return 0;
            } else {
                // Increment failed attempts
                const attempts = await client.incr(key);
                await client.expire(key, this.durations.LOGIN_ATTEMPTS);
                return attempts;
            }
        }, 0);
    }

    /**
     * Get login attempts count
     */
    static async getLoginAttempts(identifier: string): Promise<number> {
        return this.safeRedisOperation(async (client) => {
            const key = this.keys.loginAttempts(identifier);
            const attempts = await client.get(key);
            return attempts ? parseInt(attempts) : 0;
        }, 0);
    }

    /**
     * Store password reset token
     */
    static async storePasswordResetToken(token: string, userId: string): Promise<void> {
        await this.safeRedisOperation(async (client) => {
            const key = this.keys.passwordReset(token);
            await client.setEx(key, this.durations.PASSWORD_RESET, userId);
        }, undefined);
    }

    /**
     * Get and consume password reset token
     */
    static async consumePasswordResetToken(token: string): Promise<string | null> {
        return this.safeRedisOperation(async (client) => {
            const key = this.keys.passwordReset(token);
            const userId = await client.get(key);
            if (userId) {
                await client.del(key); // Consume token
            }
            return userId;
        }, null);
    }

    /**
     * Store email verification token
     */
    static async storeEmailVerificationToken(token: string, userId: string): Promise<void> {
        await this.safeRedisOperation(async (client) => {
            const key = this.keys.emailVerification(token);
            await client.setEx(key, this.durations.EMAIL_VERIFY, userId);
        }, undefined);
    }

    /**
     * Get and consume email verification token
     */
    static async consumeEmailVerificationToken(token: string): Promise<string | null> {
        return this.safeRedisOperation(async (client) => {
            const key = this.keys.emailVerification(token);
            const userId = await client.get(key);
            if (userId) {
                await client.del(key); // Consume token
            }
            return userId;
        }, null);
    }

    /**
     * Clean up expired sessions and tokens
     */
    static async cleanup(): Promise<void> {
        await this.safeRedisOperation(async (client) => {
            // Clean up active users older than 15 minutes
            const cutoff = Date.now() - (15 * 60 * 1000);
            await client.zRemRangeByScore(this.keys.activeUsers(), 0, cutoff);
        }, undefined);
    }

    /**
     * Health check
     */
    static async healthCheck(): Promise<boolean> {
        return this.safeRedisOperation(async (client) => {
            await client.ping();
            return true;
        }, false);
    }
}