import { runLowStockCheckNow } from '../jobs/low-stock.job.js';

export async function triggerLowStockCheck(req, res) {
  try {
    const result = await runLowStockCheckNow();
    return res.status(200).json({
      success: true,
      message: 'Low stock check completed successfully',
      result: {
        checked: result?.checked ?? 0,
        notified: result?.notified ?? 0,
      },
    });
  } catch (error) {
    console.error('[low-stock] Internal scheduler check failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
