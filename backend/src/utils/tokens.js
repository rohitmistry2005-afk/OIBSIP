import crypto from 'crypto';

export function createRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getTokenExpiry(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
