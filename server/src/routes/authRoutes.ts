import { Router } from 'express';
import { login, signup, googleLogin, forgotPassword, getMe } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);

export default router;
