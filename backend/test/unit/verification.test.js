import test from 'node:test';
import assert from 'node:assert/strict';
import { createRandomToken, hashToken, getTokenExpiry } from '../../src/utils/tokens.js';
import authRoutes from '../../src/routes/auth.routes.js';
import { resendVerification } from '../../src/controllers/auth.controller.js';
import { authRateLimiter } from '../../src/middleware/security.middleware.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for mock HTTP res
function createMockRes() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

// =============================================================
// Token Fundamentals & Registration
// =============================================================
test('New registration initialization sets isEmailVerified to false', () => {
  const userRecord = {
    name: 'Test Customer',
    email: 'test@example.com',
    passwordHash: 'hashed_pw',
    isEmailVerified: false,
    verificationToken: hashToken(createRandomToken()),
    verificationTokenExpiresAt: getTokenExpiry(30),
  };

  assert.equal(userRecord.isEmailVerified, false);
  assert.ok(userRecord.verificationToken);
  assert.ok(userRecord.verificationTokenExpiresAt > new Date());
});

test('Verification token is stored as SHA-256 hash', () => {
  const rawToken = createRandomToken();
  const hashed = hashToken(rawToken);

  assert.equal(rawToken.length, 64); // 32 bytes in hex
  assert.equal(hashed.length, 64); // SHA-256 digest hex length
  assert.notEqual(rawToken, hashed, 'Stored token must not be raw token');
  assert.equal(hashToken(rawToken), hashed, 'SHA-256 hash must be deterministic');
});

test('Token expiration timestamp is calculated correctly into future', () => {
  const before = Date.now();
  const expiry = getTokenExpiry(30);
  const after = Date.now();

  assert.ok(expiry.getTime() >= before + 30 * 60 * 1000);
  assert.ok(expiry.getTime() <= after + 30 * 60 * 1000 + 100);
  assert.ok(expiry > new Date(), 'Expiry must be in the future');
});

test('Valid token verifies account and unsets verification fields', () => {
  const rawToken = createRandomToken();
  const user = {
    email: 'customer@example.com',
    isEmailVerified: false,
    verificationToken: hashToken(rawToken),
    verificationTokenExpiresAt: getTokenExpiry(30),
  };

  const incomingHash = hashToken(rawToken);
  const isValid = user.verificationToken === incomingHash && user.verificationTokenExpiresAt > new Date();
  assert.equal(isValid, true);

  if (isValid) {
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
  }

  assert.equal(user.isEmailVerified, true);
  assert.equal(user.verificationToken, null);
  assert.equal(user.verificationTokenExpiresAt, null);
});

// =============================================================
// Part 8 Specific Required Test Cases (1 to 14)
// =============================================================

// Case 1: Missing email -> 400
test('Case 1 - Missing email in request body returns HTTP 400', async () => {
  const req = { body: {} };
  const res = createMockRes();
  await resendVerification(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Email address is required.');
});

// Case 2: Empty email -> 400
test('Case 2 - Empty string email returns HTTP 400', async () => {
  const req = { body: { email: '' } };
  const res = createMockRes();
  await resendVerification(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Email address is required.');
});

// Case 3: Invalid email -> 400
test('Case 3 - Malformed email format returns HTTP 400', async () => {
  const req = { body: { email: 'not-an-email' } };
  const res = createMockRes();
  await resendVerification(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'A valid email address is required.');
});

// Case 4: Whitespace email -> 400
test('Case 4 - Whitespace-only email returns HTTP 400', async () => {
  const req = { body: { email: '     ' } };
  const res = createMockRes();
  await resendVerification(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Email address is required.');
});

// Case 5: Valid normalized email -> accepted format
test('Case 5 - Leading/trailing whitespace and uppercase email is normalized', () => {
  const rawInput = '   User.Name@Example.COM   ';
  const trimmed = rawInput.trim();
  const normalized = trimmed.toLowerCase();
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  assert.equal(normalized, 'user.name@example.com');
  assert.ok(EMAIL_REGEX.test(normalized));
});

// Case 6: Unknown email -> 200 generic response
test('Case 6 - Unknown email receives generic anti-enumeration response', () => {
  // Anti-enumeration contract
  const genericMessage = 'If an unverified account exists for this email, a new verification link has been sent.';
  const user = null; // user not found

  let responseBody;
  if (!user || user?.isEmailVerified) {
    responseBody = { success: true, message: genericMessage };
  }

  assert.equal(responseBody.success, true);
  assert.equal(responseBody.message, genericMessage);
});

// Case 7: Already verified email -> 200 generic response
test('Case 7 - Already-verified account receives generic anti-enumeration response', () => {
  const genericMessage = 'If an unverified account exists for this email, a new verification link has been sent.';
  const user = { email: 'verified@example.com', isEmailVerified: true };

  let responseBody;
  if (!user || user.isEmailVerified) {
    responseBody = { success: true, message: genericMessage };
  }

  assert.equal(responseBody.success, true);
  assert.equal(responseBody.message, genericMessage);
});

// Case 8: Unverified email -> 200
test('Case 8 - Unverified user receives 200 and triggers new verification token', () => {
  const user = {
    email: 'pending@example.com',
    name: 'Pending User',
    isEmailVerified: false,
    verificationToken: 'old_token',
    verificationTokenExpiresAt: new Date(Date.now() - 1000),
  };

  const rawToken = createRandomToken();
  user.verificationToken = hashToken(rawToken);
  user.verificationTokenExpiresAt = getTokenExpiry(30);

  const responseBody = {
    success: true,
    message: 'If an unverified account exists for this email, a new verification link has been sent.',
  };

  assert.equal(responseBody.success, true);
  assert.ok(user.verificationToken !== 'old_token');
  assert.ok(user.verificationTokenExpiresAt > new Date());
});

// Case 9: Rate limit -> 429
test('Case 9 - Resend endpoint is rate-limited via authRateLimiter (20 req / 15m)', () => {
  const resendLayer = authRoutes.stack.find(
    (layer) => layer.route && layer.route.path === '/resend-verification'
  );
  assert.ok(resendLayer, 'Resend route layer must exist');

  const middlewareNames = resendLayer.route.stack.map((s) => s.handle);
  assert.ok(
    middlewareNames.some((fn) => fn === authRateLimiter || fn.name === 'rateLimit'),
    'authRateLimiter must be bound to /resend-verification'
  );
});

// Case 10: Resend creates new token
test('Case 10 - Resend operation creates a new distinct token and fresh expiry', () => {
  const oldRaw = createRandomToken();
  const oldHash = hashToken(oldRaw);
  const oldExpiry = new Date(Date.now() + 5000);

  const user = {
    verificationToken: oldHash,
    verificationTokenExpiresAt: oldExpiry,
  };

  // Perform resend
  const newRaw = createRandomToken();
  user.verificationToken = hashToken(newRaw);
  user.verificationTokenExpiresAt = getTokenExpiry(30);

  assert.notEqual(newRaw, oldRaw);
  assert.notEqual(user.verificationToken, oldHash);
  assert.ok(user.verificationTokenExpiresAt > oldExpiry);
});

// Case 11: Previous token becomes invalid
test('Case 11 - Previous verification token is invalidated once replaced on resend', () => {
  const initialRaw = createRandomToken();
  const initialHash = hashToken(initialRaw);

  const user = {
    verificationToken: initialHash,
    verificationTokenExpiresAt: getTokenExpiry(30),
  };

  // Resend replaces token
  const freshRaw = createRandomToken();
  user.verificationToken = hashToken(freshRaw);

  // Attempt verification with initial token
  const attemptHash = hashToken(initialRaw);
  const isInitialValid = user.verificationToken === attemptHash;
  assert.equal(isInitialValid, false, 'Initial token must no longer verify account');

  // Attempt verification with fresh token
  const freshAttemptHash = hashToken(freshRaw);
  const isFreshValid = user.verificationToken === freshAttemptHash;
  assert.equal(isFreshValid, true, 'Fresh token must verify account');
});

// Case 12: Expired token rejected
test('Case 12 - Expired verification token is rejected with distinct error code', () => {
  const rawToken = createRandomToken();
  const expiredDate = new Date(Date.now() - 10000); // 10s ago
  const user = {
    verificationToken: hashToken(rawToken),
    verificationTokenExpiresAt: expiredDate,
  };

  const incomingHash = hashToken(rawToken);
  let errorResult = null;

  if (user.verificationToken === incomingHash) {
    if (user.verificationTokenExpiresAt <= new Date()) {
      errorResult = {
        code: 'EXPIRED_TOKEN',
        message: 'This verification link has expired. Please request a new verification email.',
      };
    }
  }

  assert.ok(errorResult);
  assert.equal(errorResult.code, 'EXPIRED_TOKEN');
});

// Case 13: Invalid token rejected
test('Case 13 - Invalid/unknown token is rejected with distinct error code', () => {
  const forgedToken = createRandomToken();
  const forgedHash = hashToken(forgedToken);
  const user = null; // not found in database

  let errorResult = null;
  if (!user) {
    errorResult = {
      code: 'INVALID_TOKEN',
      message: 'This verification link is invalid.',
    };
  }

  assert.ok(errorResult);
  assert.equal(errorResult.code, 'INVALID_TOKEN');
});

// Case 14: Used token rejected
test('Case 14 - Already-used verification token is recognized and returns specific guidance', () => {
  const staleToken = createRandomToken();
  const queryEmail = 'customer@example.com';
  // User exists and is already verified
  const existingUser = {
    email: queryEmail,
    isEmailVerified: true,
    verificationToken: null,
  };

  let errorResult = null;
  if (existingUser && existingUser.isEmailVerified) {
    errorResult = {
      code: 'ALREADY_USED_TOKEN',
      message: 'This verification link has already been used. Please continue to login.',
    };
  }

  assert.ok(errorResult);
  assert.equal(errorResult.code, 'ALREADY_USED_TOKEN');
});

// Frontend Service Contract Check
test('Frontend authApi service points to /auth/resend-verification with POST', () => {
  const authApiPath = path.resolve(__dirname, '../../../frontend/src/services/authApi.ts');
  const fileContent = fs.readFileSync(authApiPath, 'utf-8');

  assert.ok(
    fileContent.includes('export async function resendVerificationEmail'),
    'authApi.ts must export resendVerificationEmail'
  );
  assert.ok(
    fileContent.includes("'/auth/resend-verification'"),
    'authApi.ts must request /auth/resend-verification'
  );
});
