import { connectDatabase } from '../src/config/db.js';
import { runLowStockCheckNow } from '../src/jobs/low-stock.job.js';

try {
  await connectDatabase();
  const result = await runLowStockCheckNow();
  console.log('[low-stock] Manual check complete:', result);
  process.exit(0);
} catch (error) {
  console.error('[low-stock] Manual check failed:', error.message);
  process.exit(1);
}
