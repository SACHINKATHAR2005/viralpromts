import { Request } from 'express';
import { IUser } from './user.types';

// JWT payload interface
export interface JWTPayload {
    userId: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    iat?: number;
    exp?: number;
}

// Extended request interface with user data
export interface AuthRequest extends Request {
    authenticatedUser?: JWTPayload;
}

// Login request body
export interface LoginRequest {
    email: string;
    password: string;
}

// Register request body
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    role?: 'user' | 'admin'; // Optional, defaults to 'user'
}