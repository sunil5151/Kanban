import express from 'express';
import { initDatabase } from '../controllers/initController.js';

const router = express.Router();

router.get('/', initDatabase);

export default router;