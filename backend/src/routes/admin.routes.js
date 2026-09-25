import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/security.middleware.js';
import { adminLogin } from '../controllers/auth.controller.js';
import {
  getAdminInventory,
  getAdminOrder,
  getAdminOrders,
  patchAdminInventory,
  patchAdminOrderStatus,
} from '../controllers/admin.controller.js';

const router = Router();

// Public admin authentication endpoint: POST /api/admin/auth/login
router.post('/auth/login', authRateLimiter, adminLogin);

// Protected admin operations
router.use(authenticateAdmin);

router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrder);
router.patch('/orders/:id/status', patchAdminOrderStatus);
router.get('/inventory', getAdminInventory);
router.patch('/inventory/:id', patchAdminInventory);

export default router;
