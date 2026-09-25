import { Router } from 'express';
import { authRateLimiter } from '../middleware/security.middleware.js';
import {
  adminLogin,
  forgotPassword,
  login,
  logout,
  me,
  register,
  resendOtp,
  resendVerification,
  resetPassword,
  verifyEmail,
  verifyOtp,
} from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, register);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authRateLimiter, resendVerification);
router.post('/verify-otp', authRateLimiter, verifyOtp);
router.post('/resend-otp', authRateLimiter, resendOtp);
router.post('/login', authRateLimiter, login);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password/:token', authRateLimiter, resetPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.get('/me', authenticateUser, me);
router.post('/logout', logout);
router.post('/admin/auth/login', authRateLimiter, adminLogin);

export default router;
