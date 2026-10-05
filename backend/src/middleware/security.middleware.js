import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const securityHeaders = helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false });
export const globalRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many requests. Please try again later.' } });
export const authRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: process.env.AUTH_RATE_LIMIT ? Number(process.env.AUTH_RATE_LIMIT) : 100, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many authentication attempts. Please try again later.' } });

export function validateProductionConfig() {
  if (env.nodeEnv !== 'production') return;
  const problems = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) problems.push('JWT_SECRET must be at least 32 characters in production.');
  if (!env.mongoUri) problems.push('MONGO_URI is required in production.');
  if (!env.clientUrl.startsWith('https://')) problems.push('CLIENT_URL should use HTTPS in production.');
  if (!env.cronSecret) problems.push('CRON_SECRET is required in production.');
  if (problems.length) throw new Error(`Invalid production configuration: ${problems.join(' ')}`);
}
