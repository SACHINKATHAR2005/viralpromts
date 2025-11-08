"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prompt_controller_1 = require("../controllers/prompt.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.optionalAuth, prompt_controller_1.getPrompts);
router.get('/my', auth_middleware_1.authenticate, prompt_controller_1.getMyPrompts);
router.post('/', auth_middleware_1.authenticate, validation_middleware_1.validatePromptCreate, prompt_controller_1.createPrompt);
router.get('/:id', (0, validation_middleware_1.validateObjectId)(), auth_middleware_1.optionalAuth, prompt_controller_1.getPromptById);
router.put('/:id', (0, validation_middleware_1.validateObjectId)(), auth_middleware_1.authenticate, validation_middleware_1.validatePromptUpdate, prompt_controller_1.updatePrompt);
router.delete('/:id', (0, validation_middleware_1.validateObjectId)(), auth_middleware_1.authenticate, prompt_controller_1.deletePrompt);
router.post('/:id/copy', (0, validation_middleware_1.validateObjectId)(), auth_middleware_1.authenticate, prompt_controller_1.copyPrompt);
exports.default = router;
//# sourceMappingURL=prompt.routes.js.map