import express from 'express';
import { getConflicts, resolveConflict } from '../controllers/conflictController.js';

const router = express.Router();

// Get conflicts for a user
router.get('/user/:userId', getConflicts);

// Resolve a conflict
router.post('/:conflictId/resolve', resolveConflict);

export default router;