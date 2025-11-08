import { Router } from 'express';
import { submitFeedback, getAllFeedback, updateFeedbackStatus, deleteFeedback } from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router: Router = Router();

// Public route - anyone can submit feedback
router.post('/', submitFeedback);

// Admin routes
router.get('/', authenticate, requireAdmin, getAllFeedback);
router.put('/:feedbackId', authenticate, requireAdmin, updateFeedbackStatus);
router.delete('/:feedbackId', authenticate, requireAdmin, deleteFeedback);

export default router;
