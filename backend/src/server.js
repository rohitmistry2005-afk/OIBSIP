import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { validateProductionConfig } from './middleware/security.middleware.js';

async function start() {
  try {
    validateProductionConfig();
    await connectDatabase();
    app.listen(env.port, () => {
      console.log(`API server running on http://localhost:${env.port}`);
      console.log(`[razorpay] Configuration present: ${Boolean(env.razorpayKeyId && env.razorpayKeySecret)} | Key ID present: ${Boolean(env.razorpayKeyId)} | Secret present: ${Boolean(env.razorpayKeySecret)}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

start();
