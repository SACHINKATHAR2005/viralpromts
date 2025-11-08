"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const upload_controller_1 = require("../controllers/upload.controller");
const router = (0, express_1.Router)();
router.post('/profile-photo', auth_middleware_1.authenticate, upload_middleware_1.uploadProfilePhotoMiddleware, upload_middleware_1.profilePhotoSecurityMiddleware, upload_controller_1.uploadProfilePhoto);
router.post('/prompt-proof', auth_middleware_1.authenticate, upload_middleware_1.uploadPromptProofMiddleware, upload_middleware_1.promptProofSecurityMiddleware, upload_controller_1.uploadPromptProof);
router.post('/documentation', auth_middleware_1.authenticate, upload_middleware_1.uploadDocumentationMiddleware, upload_middleware_1.documentationSecurityMiddleware, upload_controller_1.uploadDocumentation);
router.delete('/delete', auth_middleware_1.authenticate, upload_controller_1.deleteUploadedFile);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map