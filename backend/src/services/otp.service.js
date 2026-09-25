import crypto from 'crypto';

const OTP_DIGITS_REGEX = /^\d{6}$/;
const DEFAULT_EXPIRY_MINUTES = 10;
const DEFAULT_COOLDOWN_SECONDS = 60;
export const MAX_OTP_ATTEMPTS = 5;

/**
 * Generates a cryptographically secure 6-digit OTP string (000000 - 999999).
 * Uses Node.js crypto.randomInt (CSPRNG).
 * @returns {string} Exactly 6 numeric digits.
 */
export function generateOtp() {
  const randomValue = crypto.randomInt(0, 1000000);
  return randomValue.toString().padStart(6, '0');
}

/**
 * Computes the SHA-256 hex digest of a raw OTP.
 * Plaintext OTPs are NEVER persisted to the database.
 * @param {string} otp - The raw 6-digit OTP.
 * @returns {string} 64-character hex hash string.
 */
export function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

/**
 * Calculates the expiration timestamp for an OTP.
 * @param {number} [minutes=10] - Number of minutes until expiration.
 * @returns {Date} Expiration date in UTC.
 */
export function getOtpExpiry(minutes = DEFAULT_EXPIRY_MINUTES) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Checks whether an OTP has expired.
 * @param {Date|string|null} expiresAt - The stored expiration timestamp.
 * @returns {boolean} True if expired or missing, false otherwise.
 */
export function isOtpExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

/**
 * Enforces the server-side resend cooldown period (default 60 seconds).
 * @param {Date|string|null} lastSentAt - Timestamp when the previous OTP was dispatched.
 * @param {number} [cooldownSeconds=60] - Cooldown period in seconds.
 * @returns {{ allowed: boolean, retryAfter: number }}
 */
export function canResendOtp(lastSentAt, cooldownSeconds = DEFAULT_COOLDOWN_SECONDS) {
  if (!lastSentAt) {
    return { allowed: true, retryAfter: 0 };
  }

  const elapsedMs = Date.now() - new Date(lastSentAt).getTime();
  const cooldownMs = cooldownSeconds * 1000;

  if (elapsedMs < cooldownMs) {
    const remainingMs = cooldownMs - elapsedMs;
    const retryAfter = Math.max(1, Math.ceil(remainingMs / 1000));
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Securely verifies a submitted OTP against the stored SHA-256 hash using timing-safe comparison.
 * @param {string} submittedOtp - The 6-digit OTP submitted by the client.
 * @param {string} storedHash - The SHA-256 hash stored in MongoDB.
 * @returns {boolean} True if valid match, false otherwise.
 */
export function verifyOtpHash(submittedOtp, storedHash) {
  if (typeof submittedOtp !== 'string' || !OTP_DIGITS_REGEX.test(submittedOtp)) {
    return false;
  }
  if (typeof storedHash !== 'string' || storedHash.length !== 64) {
    return false;
  }

  const computedHash = hashOtp(submittedOtp);
  try {
    const bufA = Buffer.from(computedHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return computedHash === storedHash;
  }
}

/**
 * Invalidates the pending OTP fields on a user record.
 * @param {object} user - Mongoose User document or plain object.
 */
export function invalidateOtp(user) {
  if (!user) return;
  user.emailOtpHash = null;
  user.emailOtpExpiresAt = null;
  user.emailOtpAttempts = 0;
}
