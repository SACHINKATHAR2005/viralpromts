"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
router.post('/register', rateLimit_middleware_1.RateLimitService.authLimit, validation_middleware_1.validateRegister, auth_controller_1.register);
router.post('/login', rateLimit_middleware_1.RateLimitService.authLimit, validation_middleware_1.validateLogin, auth_controller_1.login);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getMe);
router.put('/profile', auth_middleware_1.authenticate, validation_middleware_1.validateProfileUpdate, auth_controller_1.updateProfile);
router.post('/logout', auth_controller_1.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map