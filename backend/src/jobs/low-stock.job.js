import cron from 'node-cron';
import { checkLowStockAndNotify } from '../services/notification.service.js';

export function startLowStockJob() {
  // Every 5 minutes. The alert timestamp prevents repeated alerts for unchanged low stock.
  const task = cron.schedule('*/5 * * * *', async () => {
    try {
      const result = await checkLowStockAndNotify();
      if (result.notified) console.log(`[low-stock] Sent ${result.notified} alert(s).`);
    } catch (error) {
      console.error('[low-stock] Scheduled check failed:', error.message);
    }
  });

  return task;
}

export async function runLowStockCheckNow() {
  return checkLowStockAndNotify();
}
