import { checkLowStockAndNotify } from '../services/notification.service.js';

export async function runLowStockCheckNow() {
  return checkLowStockAndNotify();
}
