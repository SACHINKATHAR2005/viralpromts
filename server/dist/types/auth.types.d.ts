import { Request } from 'express';
export interface JWTPayload {
    userId: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    iat?: number;
    exp?: number;
}
export interface AuthRequest extends Request {
    authenticatedUser?: JWTPayload;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
}
//# sourceMappingURL=auth.types.d.ts.map