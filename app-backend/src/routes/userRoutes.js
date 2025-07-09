import express from 'express';
import { getAllStores, submitRating } from '../controllers/userController.js';

const router = express.Router();

// Keeping original paths for API compatibility
router.get('/stores', getAllStores);
router.post('/stores/:storeId/rate', submitRating);

export default router;