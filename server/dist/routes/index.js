"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const prompt_routes_1 = __importDefault(require("./prompt.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const upload_routes_1 = __importDefault(require("./upload.routes"));
const social_routes_1 = __importDefault(require("./social.routes"));
const rating_routes_1 = __importDefault(require("./rating.routes"));
const pool_routes_1 = __importDefault(require("./pool.routes"));
const communityCall_routes_1 = __importDefault(require("./communityCall.routes"));
const cache_service_1 = require("../services/cache.service");
const router = (0, express_1.Router)();
router.get('/health', async (req, res) => {
    const redisHealth = await cache_service_1.CacheService.healthCheck();
    res.status(200).json({
        success: true,
        message: 'API is healthy',
        data: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            services: {
                redis: redisHealth ? 'connected' : 'disconnected',
                database: 'connected'
            }
        }
    });
});
router.use('/auth', auth_routes_1.default);
router.use('/prompts', prompt_routes_1.default);
router.use('/social', social_routes_1.default);
router.use('/ratings', rating_routes_1.default);
router.use('/pools', pool_routes_1.default);
router.use('/calls', communityCall_routes_1.default);
router.use('/upload', upload_routes_1.default);
router.use('/admin', admin_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map