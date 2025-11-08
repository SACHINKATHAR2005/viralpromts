import { Router, type IRouter } from 'express';
import {
    createPrompt,
    getPrompts,
    getPromptById,
    updatePrompt,
    deletePrompt,
    copyPrompt,
    getMyPrompts,
    togglePinPrompt
} from '../controllers/prompt.controller';
import {
    authenticate,
    optionalAuth,
    requireVerified,
    requireMonetization
} from '../middleware/auth.middleware';
import {
    validatePromptCreate,
    validatePromptUpdate,
    validateObjectId
} from '../middleware/validation.middleware';

const router: IRouter = Router();

/**
 * Prompt Routes
 */

// Get all public prompts (with optional filtering)
// GET /api/prompts
router.get('/', optionalAuth, getPrompts);

// Get user's own prompts
// GET /api/prompts/my
router.get('/my', authenticate, getMyPrompts);

// Create new prompt
// POST /api/prompts
router.post('/', authenticate, validatePromptCreate, createPrompt);

// Get single prompt by ID
// GET /api/prompts/:id
router.get('/:id', validateObjectId(), optionalAuth, getPromptById);

// Update prompt
// PUT /api/prompts/:id
router.put('/:id', validateObjectId(), authenticate, validatePromptUpdate, updatePrompt);

// Delete prompt
// DELETE /api/prompts/:id
router.delete('/:id', validateObjectId(), authenticate, deletePrompt);

// Pin/Unpin prompt to profile
// PATCH /api/prompts/:id/pin
router.patch('/:id/pin', validateObjectId(), authenticate, togglePinPrompt);

// Copy/Purchase prompt
// POST /api/prompts/:id/copy
router.post('/:id/copy', validateObjectId(), authenticate, copyPrompt);

export default router;