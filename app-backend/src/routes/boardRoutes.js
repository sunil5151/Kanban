import express from 'express';
import {
  getAllBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard
} from '../controllers/boardController.js';

const router = express.Router();

// Get all boards
router.get('/', getAllBoards);

// Get a specific board with its tasks
router.get('/:boardId', getBoardById);

// Create a new board
router.post('/', createBoard);

// Update a board
router.put('/:boardId', updateBoard);

// Delete a board
router.delete('/:boardId', deleteBoard);

export default router;