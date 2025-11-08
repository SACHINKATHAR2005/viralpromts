"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const social_controller_1 = require("../controllers/social.controller");
const router = (0, express_1.Router)();
router.post('/like/:promptId', auth_middleware_1.authenticate, rateLimit_middleware_1.RateLimitService.socialLimit, social_controller_1.likePrompt);
router.delete('/like/:promptId', auth_middleware_1.authenticate, rateLimit_middleware_1.RateLimitService.socialLimit, social_controller_1.unlikePrompt);
router.post('/comment/:promptId', auth_middleware_1.authenticate, rateLimit_middleware_1.RateLimitService.commentLimit, social_controller_1.addComment);
router.get('/comments/:promptId', social_controller_1.getComments);
router.post('/follow/:userId', auth_middleware_1.authenticate, rateLimit_middleware_1.RateLimitService.socialLimit, social_controller_1.followUser);
router.delete('/follow/:userId', auth_middleware_1.authenticate, rateLimit_middleware_1.RateLimitService.socialLimit, social_controller_1.unfollowUser);
router.post('/save/:promptId', auth_middleware_1.authenticate, rateLimit_middleware_1.RateLimitService.socialLimit, social_controller_1.savePrompt);
exports.default = router;
//# sourceMappingURL=social.routes.js.map