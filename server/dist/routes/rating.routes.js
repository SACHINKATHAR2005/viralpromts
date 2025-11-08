"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rating_controller_1 = require("../controllers/rating.controller");
const router = (0, express_1.Router)();
router.post('/:promptId', auth_middleware_1.authenticate, rating_controller_1.ratePrompt);
router.put('/:promptId', auth_middleware_1.authenticate, rating_controller_1.updateRating);
router.get('/:promptId', rating_controller_1.getPromptRatings);
router.delete('/:promptId', auth_middleware_1.authenticate, rating_controller_1.deleteRating);
router.post('/:ratingId/helpful', auth_middleware_1.authenticate, rating_controller_1.markReviewHelpful);
exports.default = router;
//# sourceMappingURL=rating.routes.js.map