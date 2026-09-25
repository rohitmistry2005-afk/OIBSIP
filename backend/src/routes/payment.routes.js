import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { createPaymentOrder, verifyPayment } from '../controllers/payment.controller.js';

const router = Router();
router.use(authenticateUser);
router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);

export default router;
