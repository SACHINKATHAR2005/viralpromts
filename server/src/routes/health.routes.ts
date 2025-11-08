import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router: Router = Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: 'checking',
            redis: 'checking'
        }
    };

    try {
        // Check MongoDB connection
        if (mongoose.connection.readyState === 1) {
            healthCheck.services.database = 'connected';
        } else {
            healthCheck.services.database = 'disconnected';
        }

        // Check Redis if you have it configured
        // Add redis check here if needed

        res.status(200).json(healthCheck);
    } catch (error) {
        healthCheck.message = 'ERROR';
        res.status(503).json(healthCheck);
    }
});

// Liveness probe (for Kubernetes/container orchestration)
router.get('/live', (req: Request, res: Response) => {
    res.status(200).json({ status: 'alive' });
});

// Readiness probe
router.get('/ready', async (req: Request, res: Response) => {
    if (mongoose.connection.readyState === 1) {
        res.status(200).json({ status: 'ready' });
    } else {
        res.status(503).json({ status: 'not ready' });
    }
});

export default router;
