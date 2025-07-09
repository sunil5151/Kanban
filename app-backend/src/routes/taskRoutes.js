import express from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
  smartAssign
} from '../controllers/taskController.js';

const router = express.Router();

// Get all tasks for a board
router.get('/board/:boardId', getAllTasks);

// Get a specific task
router.get('/:taskId', getTaskById);

// Create a new task
router.post('/', createTask);

// Update a task
router.put('/:taskId', updateTask);

// Delete a task

// Update task status (for drag-drop)
router.patch('/:taskId/status', updateTaskStatus);

// Assign a task to a user
router.patch('/:taskId/assign/:userId', assignTask);

// Smart assign a task
// ... existing code ...

// Delete a task (with and without userId)
router.delete('/:taskId', deleteTask);
router.delete('/:taskId/:userId', deleteTask);

// Smart assign a task (with and without userId)
router.patch('/:taskId/smart-assign', smartAssign);
router.patch('/:taskId/smart-assign/:userId', smartAssign);

export default router;