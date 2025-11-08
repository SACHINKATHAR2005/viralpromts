"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_middleware_1 = require("./middleware/error.middleware");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const index_1 = __importDefault(require("./routes/index"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use(rateLimit_middleware_1.RateLimitService.globalLimit);
app.use(error_middleware_1.requestLogger);
app.use('/api', index_1.default);
app.get('/', (req, res) => {
    res.json({
        message: 'ViralPrompt API is working!',
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        documentation: '/api/health'
    });
});
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
const port = process.env.PORT || "6000";
Promise.all([
    (0, database_1.connectDB)(),
    (0, redis_1.connectRedis)()
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
//# sourceMappingURL=app.js.map