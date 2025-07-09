import express from 'express';
import { getRecentLogs } from '../controllers/logController.js';

const router = express.Router();

// Get recent logs
router.get('/recent', getRecentLogs);

export default router;