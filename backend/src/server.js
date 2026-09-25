import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { startLowStockJob } from './jobs/low-stock.job.js';
import { validateProductionConfig } from './middleware/security.middleware.js';

async function start() {
  try {
    validateProductionConfig();
    await connectDatabase();
    app.listen(env.port, () => {
      console.log(`API server running on http://localhost:${env.port}`);
      console.log(`[razorpay] Configuration present: ${Boolean(env.razorpayKeyId && env.razorpayKeySecret)} | Key ID present: ${Boolean(env.razorpayKeyId)} | Secret present: ${Boolean(env.razorpayKeySecret)}`);
      startLowStockJob();
      console.log('[low-stock] Cron scheduled every 5 minutes');
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

start();
