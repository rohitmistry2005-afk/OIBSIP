import { Router } from 'express';
import { triggerLowStockCheck } from '../controllers/internal.controller.js';
import { authenticateCronSecret } from '../middleware/cron-auth.middleware.js';

const router = Router();

router.post('/low-stock', authenticateCronSecret, triggerLowStockCheck);

export default router;
