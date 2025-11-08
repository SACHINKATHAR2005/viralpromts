import { Router } from 'express';
import { CommunityCallController } from '../controllers/communityCall.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router: Router = Router();

// Public routes (with optional auth)
router.get('/', optionalAuthenticate, CommunityCallController.getCalls);
router.get('/:callId', optionalAuthenticate, CommunityCallController.getCall);

// Protected routes (require authentication)
router.use(authenticate); // All routes below require authentication

// Call management
router.post('/', CommunityCallController.createCall);
router.put('/:callId', CommunityCallController.updateCall);
router.post('/:callId/cancel', CommunityCallController.cancelCall);

// Call participation
router.post('/:callId/register', CommunityCallController.registerForCall);
router.post('/:callId/unregister', CommunityCallController.unregisterFromCall);

// Call execution (host only)
router.post('/:callId/start', CommunityCallController.startCall);
router.post('/:callId/end', CommunityCallController.endCall);
router.post('/:callId/attendance', CommunityCallController.markAttendance);

// Feedback
router.post('/:callId/feedback', CommunityCallController.addFeedback);

// User calls
router.get('/user/my-calls', CommunityCallController.getUserCalls);

export default router;