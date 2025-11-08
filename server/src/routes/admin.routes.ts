import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router: Router = Router();

// Apply authentication and admin role requirement to all admin routes
router.use(authenticate);
router.use(requireAdmin);

// User Management Routes
router.get('/users', (req, res) => adminController.getAllUsers(req, res));
router.get('/users/:userId', (req, res) => adminController.getUserById(req, res));
router.put('/users/:userId/status', (req, res) => adminController.toggleUserStatus(req, res));
router.put('/users/:userId/monetization', (req, res) => adminController.toggleMonetization(req, res));
router.put('/users/:userId/verification', (req, res) => adminController.toggleUserVerification(req, res));
router.delete('/users/:userId', (req, res) => adminController.deleteUser(req, res));

// Prompt Moderation Routes
router.get('/prompts', (req, res) => adminController.getAllPrompts(req, res));
router.put('/prompts/:promptId/status', (req, res) => adminController.togglePromptStatus(req, res));

// Pool Management Routes
router.get('/pools', (req, res) => adminController.getAllPools(req, res));
router.delete('/pools/:poolId', (req, res) => adminController.deletePool(req, res));
router.put('/pools/:poolId/status', (req, res) => adminController.updatePoolStatus(req, res));

// Platform Statistics
router.get('/stats', (req, res) => adminController.getStats(req, res));

export default router;