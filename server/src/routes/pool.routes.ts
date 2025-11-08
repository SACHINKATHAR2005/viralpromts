import { Router } from 'express';
import { PoolController } from '../controllers/pool.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router: Router = Router();

// Public routes (with optional auth)
router.get('/', optionalAuthenticate, PoolController.getPools);
router.get('/:poolId', optionalAuthenticate, PoolController.getPool);

// Protected routes (require authentication)
router.use(authenticate); // All routes below require authentication

// Pool management
router.post('/', PoolController.createPool);
router.put('/:poolId', PoolController.updatePool);
router.delete('/:poolId', PoolController.deletePool);

// Pool participation
router.post('/:poolId/join', PoolController.joinPool);
router.post('/:poolId/leave', PoolController.leavePool);
router.post('/:poolId/prompts', PoolController.addPromptToPool);

// Pool voting
router.post('/:poolId/prompts/:promptId/vote', PoolController.voteOnPrompt);
router.get('/:poolId/leaderboard', PoolController.getPoolLeaderboard);

// User pools
router.get('/user/my-pools', PoolController.getUserPools);

export default router;