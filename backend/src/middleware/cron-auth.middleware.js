import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function authenticateCronSecret(req, res, next) {
  const serverSecret = env.cronSecret;

  if (!serverSecret) {
    console.error('[cron] Scheduler invoked but CRON_SECRET is not configured on the server.');
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const rawHeader = req.headers['x-cron-secret'];
  const clientSecret = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

  if (!clientSecret || typeof clientSecret !== 'string') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const clientBuffer = Buffer.from(clientSecret);
  const serverBuffer = Buffer.from(serverSecret);

  if (clientBuffer.length !== serverBuffer.length || !crypto.timingSafeEqual(clientBuffer, serverBuffer)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
}
