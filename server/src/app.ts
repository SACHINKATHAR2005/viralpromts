import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
import { connectDB } from "./config/database";
import { connectRedis } from "./config/redis";
import cookieParser from "cookie-parser";
// Import middleware
import { requestLogger, errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { RateLimitService } from "./middleware/rateLimit.middleware";
import helmet from "helmet";
// Import routes
import apiRoutes from "./routes/index";

const app: Express = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // Frontend URL
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(helmet());
// Global rate limiting
app.use(RateLimitService.globalLimit);

// Request logging in development
app.use(requestLogger);

// API routes
app.use('/api', apiRoutes);

// Basic test route
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'ViralPrompt API is working!',
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        documentation: '/api/health'
    });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Export app for testing
export { app };

// Only start server if this file is run directly (not imported)
if (require.main === module) {
    const port = process.env.PORT as string || "6000";

    // Connect to database and Redis
    Promise.all([
        connectDB(),
        connectRedis()
    ]).then(() => {
        app.listen(port, () => {
            console.log(`✅ Server is running on port ${port}`);
            console.log(`🌐 API Health: http://localhost:${port}/api/health`);
            console.log(`📚 API Base: http://localhost:${port}/api`);
            console.log(`⚡ Redis Cache: Connected`);
        });
    }).catch((error) => {
        console.error('❌ Failed to connect to services:', error);
        process.exit(1);
    });
}