"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pool_controller_1 = require("../controllers/pool.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.optionalAuthenticate, pool_controller_1.PoolController.getPools);
router.get('/:poolId', auth_middleware_1.optionalAuthenticate, pool_controller_1.PoolController.getPool);
router.use(auth_middleware_1.authenticate);
router.post('/', pool_controller_1.PoolController.createPool);
router.put('/:poolId', pool_controller_1.PoolController.updatePool);
router.delete('/:poolId', pool_controller_1.PoolController.deletePool);
router.post('/:poolId/join', pool_controller_1.PoolController.joinPool);
router.post('/:poolId/leave', pool_controller_1.PoolController.leavePool);
router.post('/:poolId/prompts', pool_controller_1.PoolController.addPromptToPool);
router.get('/user/my-pools', pool_controller_1.PoolController.getUserPools);
exports.default = router;
//# sourceMappingURL=pool.routes.js.map