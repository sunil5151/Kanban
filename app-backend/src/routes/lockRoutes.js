import express from 'express';
import {
  lockTask,
  unlockTask,
  checkTaskLock
} from '../controllers/lockController.js';

const router = express.Router();

// Lock a task
router.post('/:taskId/lock', lockTask);

// Unlock a task
router.post('/:taskId/unlock', unlockTask);

// Check if a task is locked
router.get('/:taskId', checkTaskLock);

export default router;