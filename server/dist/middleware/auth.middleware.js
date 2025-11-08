"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.requireMonetization = exports.requireVerified = exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token;
        if (req.cookies && req.cookies.authToken) {
            token = req.cookies.authToken;
        }
        else if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required',
                errors: ['No authentication token provided']
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET is not defined in environment variables');
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                errors: ['Server configuration error']
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await User_1.User.findById(decoded.userId).select('-password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
                errors: ['User not found']
            });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({
                success: false,
                message: 'Account deactivated',
                errors: ['Account access denied']
            });
            return;
        }
        req.authenticatedUser = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
                errors: ['Token verification failed']
            });
            return;
        }
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Token expired',
                errors: ['Please login again']
            });
            return;
        }
        if (error.name === 'NotBeforeError') {
            res.status(401).json({
                success: false,
                message: 'Token not active',
                errors: ['Token not yet valid']
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Authentication failed']
        });
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token;
        if (req.cookies && req.cookies.authToken) {
            token = req.cookies.authToken;
        }
        else if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        if (!token) {
            next();
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            next();
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await User_1.User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
            req.authenticatedUser = {
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role
            };
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireVerified = async (req, res, next) => {
    if (!req.authenticatedUser) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
            errors: ['User not authenticated']
        });
        return;
    }
    const user = await User_1.User.findById(req.authenticatedUser.userId).select('-password');
    if (!user || !user.isVerified) {
        res.status(403).json({
            success: false,
            message: 'Verified account required',
            errors: ['Account verification needed']
        });
        return;
    }
    next();
};
exports.requireVerified = requireVerified;
const requireMonetization = async (req, res, next) => {
    if (!req.authenticatedUser) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
            errors: ['User not authenticated']
        });
        return;
    }
    const user = await User_1.User.findById(req.authenticatedUser.userId).select('-password');
    if (!user || !user.monetizationUnlocked) {
        res.status(403).json({
            success: false,
            message: 'Monetization access required',
            errors: ['Monetization not unlocked']
        });
        return;
    }
    next();
};
exports.requireMonetization = requireMonetization;
const optionalAuthenticate = async (req, res, next) => {
    try {
        await (0, exports.authenticate)(req, res, () => {
            next();
        });
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=auth.middleware.js.map