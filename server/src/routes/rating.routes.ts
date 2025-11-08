import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    ratePrompt,
    updateRating,
    getPromptRatings,
    deleteRating,
    markReviewHelpful
} from '../controllers/rating.controller';

const router: Router = Router();

/**
 * @route   POST /api/ratings/:promptId
 * @desc    Rate a prompt
 * @access  Private
 */
router.post('/:promptId', authenticate, ratePrompt);

/**
 * @route   PUT /api/ratings/:promptId
 * @desc    Update a rating
 * @access  Private
 */
router.put('/:promptId', authenticate, updateRating);

/**
 * @route   GET /api/ratings/:promptId
 * @desc    Get ratings for a prompt
 * @access  Public
 */
router.get('/:promptId', getPromptRatings);

/**
 * @route   DELETE /api/ratings/:promptId
 * @desc    Delete a rating
 * @access  Private
 */
router.delete('/:promptId', authenticate, deleteRating);

/**
 * @route   POST /api/ratings/:ratingId/helpful
 * @desc    Mark a review as helpful
 * @access  Private
 */
router.post('/:ratingId/helpful', authenticate, markReviewHelpful);

export default router;