import { Router, type IRouter } from 'express';
import authRoutes from './auth.routes';
import promptRoutes from './prompt.routes';
import adminRoutes from './admin.routes';
import uploadRoutes from './upload.routes';
import socialRoutes from './social.routes';
import ratingRoutes from './rating.routes';
import poolRoutes from './pool.routes';
import communityCallRoutes from './communityCall.routes';
import feedbackRoutes from './feedback.routes';
import { CacheService } from '../services/cache.service';

const router: IRouter = Router();

// Health check route
router.get('/health', async (req, res) => {
    const redisHealth = await CacheService.healthCheck();

    res.status(200).json({
        success: true,
        message: 'API is healthy',
        data: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            services: {
                redis: redisHealth ? 'connected' : 'disconnected',
                database: 'connected' // MongoDB is connected if app starts
            }
        }
    });
});

// Authentication routes
router.use('/auth', authRoutes);

// Prompt routes
router.use('/prompts', promptRoutes);

// Social interaction routes (protected)
router.use('/social', socialRoutes);

// Rating routes (protected)
router.use('/ratings', ratingRoutes);

// Pool routes (mixed protection)
router.use('/pools', poolRoutes);

// Community Call routes (mixed protection)
router.use('/calls', communityCallRoutes);

// Upload routes (protected)
router.use('/upload', uploadRoutes);

// Feedback routes (public submission, admin viewing)
router.use('/feedback', feedbackRoutes);

// Admin routes (protected)
router.use('/admin', adminRoutes);

export default router;