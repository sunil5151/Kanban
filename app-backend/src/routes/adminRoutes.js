import express from 'express';
import { getAllUsers, getUserById, createUser, getAllStores, createStore, getStoreByOwnerId, getStoreRatingUsers } from '../controllers/adminController.js';

const router = express.Router();

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);

// Company management routes (keeping original paths for API compatibility)
router.get('/stores', getAllStores);
router.post('/stores', createStore);
router.get('/stores/owner/:ownerId', getStoreByOwnerId);
router.get('/stores/:storeId/ratings/users', getStoreRatingUsers);

export default router;