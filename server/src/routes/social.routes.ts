import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { RateLimitService } from '../middleware/rateLimit.middleware';
import {
    likePrompt,
    unlikePrompt,
    addComment,
    getComments,
    followUser,
    unfollowUser,
    savePrompt
} from '../controllers/social.controller';

const router: Router = Router();

/**
 * @route   POST /api/social/like/:promptId
 * @desc    Like a prompt
 * @access  Private
 */
router.post('/like/:promptId', authenticate, RateLimitService.socialLimit, likePrompt);

/**
 * @route   DELETE /api/social/like/:promptId
 * @desc    Unlike a prompt
 * @access  Private
 */
router.delete('/like/:promptId', authenticate, RateLimitService.socialLimit, unlikePrompt);

/**
 * @route   POST /api/social/comment/:promptId
 * @desc    Add comment to a prompt
 * @access  Private
 */
router.post('/comment/:promptId', authenticate, RateLimitService.commentLimit, addComment);

/**
 * @route   GET /api/social/comments/:promptId
 * @desc    Get comments for a prompt
 * @access  Public
 */
router.get('/comments/:promptId', getComments);

/**
 * @route   POST /api/social/follow/:userId
 * @desc    Follow a user
 * @access  Private
 */
router.post('/follow/:userId', authenticate, RateLimitService.socialLimit, followUser);

/**
 * @route   DELETE /api/social/follow/:userId
 * @desc    Unfollow a user
 * @access  Private
 */
router.delete('/follow/:userId', authenticate, RateLimitService.socialLimit, unfollowUser);

/**
 * @route   POST /api/social/save/:promptId
 * @desc    Save a prompt to collection
 * @access  Private
 */
router.post('/save/:promptId', authenticate, RateLimitService.socialLimit, savePrompt);

export default router;