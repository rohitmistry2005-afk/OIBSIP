import { Inventory } from '../models/inventory.model.js';
import { sendLowStockEmail } from './email.service.js';
import { env } from '../config/env.js';

export async function checkLowStockAndNotify() {
  const items = await Inventory.find({});
  const eligible = items.filter((item) => item.quantity < item.threshold && !item.lowStockAlertSentAt);

  if (!eligible.length) {
    return { checked: items.length, notified: 0 };
  }

  if (!env.adminEmail) {
    console.warn('[low-stock] ADMIN_EMAIL is not configured; skipping email notification.');
    return { checked: items.length, notified: 0, skipped: eligible.length };
  }

  let notified = 0;
  for (const item of eligible) {
    try {
      await sendLowStockEmail({
        adminEmail: env.adminEmail,
        item: {
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          threshold: item.threshold,
          unit: item.unit,
        },
      });
      item.lowStockAlertSentAt = new Date();
      await item.save();
      notified += 1;
    } catch (error) {
      console.error(`[low-stock] Failed notification for ${item.name}:`, error.message);
    }
  }

  return { checked: items.length, notified };
}
