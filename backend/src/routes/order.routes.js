import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { createOrder, getMyOrder, listMyOrders } from '../controllers/order.controller.js';

const router = Router();
router.use(authenticateUser);
router.post('/', createOrder);
router.get('/my-orders', listMyOrders);
router.get('/:id', getMyOrder);

export default router;
