import express from 'express';
import { register, login, updatePassword, uploadProfileImage, getUserProfile } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/password', updatePassword);
router.post('/profile-image', uploadProfileImage);
router.get('/profile/:userId', getUserProfile);

export default router;