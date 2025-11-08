import { Router, type IRouter } from 'express';
import {
    register,
    login,
    getMe,
    updateProfile,
    logout
} from '../controllers/auth.controller';
import {
    authenticate,
    optionalAuth
} from '../middleware/auth.middleware';
import { RateLimitService } from '../middleware/rateLimit.middleware';
import {
    validateRegister,
    validateLogin,
    validateProfileUpdate
} from '../middleware/validation.middleware';

const router: IRouter = Router();

/**
 * Authentication Routes
 */

// Register new user
// POST /api/auth/register
router.post('/register', RateLimitService.authLimit, validateRegister, register);

// Login user
// POST /api/auth/login
router.post('/login', RateLimitService.authLimit, validateLogin, login);

// Get current user profile
// GET /api/auth/me
router.get('/me', authenticate, getMe);

// Update user profile
// PUT /api/auth/profile
router.put('/profile', authenticate, validateProfileUpdate, updateProfile);

// Logout user (client-side token removal)
// POST /api/auth/logout
router.post('/logout', logout);

export default router;