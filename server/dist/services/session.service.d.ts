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
    jti: string;
    userId: string;
    exp: number;
    reason?: string;
}
export declare class SessionService {
    private static getRedis;
    private static isRedisAvailable;
    private static keys;
    private static durations;
    private static safeRedisOperation;
    static createSession(sessionId: string, sessionData: SessionData, rememberMe?: boolean): Promise<void>;
    static getSession(sessionId: string): Promise<SessionData | null>;
    static updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void>;
    static deleteSession(sessionId: string): Promise<void>;
    static deleteUserSessions(userId: string): Promise<void>;
    static getUserSessions(userId: string): Promise<SessionData[]>;
    static blacklistToken(tokenData: BlacklistedToken): Promise<void>;
    static isTokenBlacklisted(jti: string): Promise<boolean>;
    static trackActiveUser(userId: string): Promise<void>;
    static getActiveUsersCount(): Promise<number>;
    static trackLoginAttempt(identifier: string, success?: boolean): Promise<number>;
    static getLoginAttempts(identifier: string): Promise<number>;
    static storePasswordResetToken(token: string, userId: string): Promise<void>;
    static consumePasswordResetToken(token: string): Promise<string | null>;
    static storeEmailVerificationToken(token: string, userId: string): Promise<void>;
    static consumeEmailVerificationToken(token: string): Promise<string | null>;
    static cleanup(): Promise<void>;
    static healthCheck(): Promise<boolean>;
}
export {};
//# sourceMappingURL=session.service.d.ts.map