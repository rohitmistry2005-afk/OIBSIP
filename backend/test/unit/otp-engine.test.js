import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOtp,
  hashOtp,
  getOtpExpiry,
  isOtpExpired,
  canResendOtp,
  verifyOtpHash,
  invalidateOtp,
  MAX_OTP_ATTEMPTS,
} from '../../src/services/otp.service.js';
import { User } from '../../src/models/user.model.js';
import { verifyOtp, resendOtp } from '../../src/controllers/auth.controller.js';
import authRoutes from '../../src/routes/auth.routes.js';
import { authRateLimiter } from '../../src/middleware/security.middleware.js';

// Helper to mock Express response object
function createMockRes() {
  return {
    statusCode: 200,
    body: null,
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

// Preserve original User Mongoose methods
const originalFindOne = User.findOne;

// =============================================================
// Section 1: OTP Generation Engine Tests
// =============================================================

test('OTP Generator produces exactly 6 numeric digits', () => {
  for (let i = 0; i < 50; i++) {
    const otp = generateOtp();
    assert.equal(typeof otp, 'string', 'OTP must be a string');
    assert.equal(otp.length, 6, 'OTP must have length 6');
    assert.match(otp, /^\d{6}$/, 'OTP must consist strictly of digits 0-9');
  }
});

test('OTP Generator produces high entropy without trivial repetitions', () => {
  const samples = new Set();
  for (let i = 0; i < 200; i++) {
    samples.add(generateOtp());
  }
  // Across 200 samples of 1,000,000 possibilities, collision rate should be extremely low
  assert.ok(samples.size > 190, 'CSPRNG must produce diverse OTP values');
});

// =============================================================
// Section 2: OTP Hashing & Confidentiality Tests
// =============================================================

test('OTP is hashed using SHA-256 producing 64-char hex digest', () => {
  const otp = '482910';
  const hash = hashOtp(otp);
  assert.equal(typeof hash, 'string');
  assert.equal(hash.length, 64, 'SHA-256 hex digest must be 64 characters');
  assert.notEqual(otp, hash, 'Hash must not equal plaintext OTP');
  assert.equal(hashOtp(otp), hash, 'Hash function must be deterministic');
});

test('Different OTPs generate distinct hashes', () => {
  const hash1 = hashOtp('111111');
  const hash2 = hashOtp('111112');
  assert.notEqual(hash1, hash2);
});

// =============================================================
// Section 3: OTP Expiration Arithmetic Tests
// =============================================================

test('getOtpExpiry defaults to 10 minutes in the future', () => {
  const before = Date.now();
  const expiry = getOtpExpiry(10);
  const after = Date.now();

  const minExpected = before + 10 * 60 * 1000;
  const maxExpected = after + 10 * 60 * 1000 + 100;

  assert.ok(expiry.getTime() >= minExpected, 'Expiry must be at least 10 minutes in future');
  assert.ok(expiry.getTime() <= maxExpected, 'Expiry must not exceed 10 minutes in future');
});

test('isOtpExpired correctly detects expired and valid timestamps', () => {
  const pastDate = new Date(Date.now() - 5000);
  const futureDate = new Date(Date.now() + 60000);

  assert.equal(isOtpExpired(pastDate), true, 'Past date should be expired');
  assert.equal(isOtpExpired(null), true, 'Null date should be expired');
  assert.equal(isOtpExpired(undefined), true, 'Undefined date should be expired');
  assert.equal(isOtpExpired(futureDate), false, 'Future date should be active');
});

// =============================================================
// Section 4: Resend Cooldown Arithmetic Tests
// =============================================================

test('canResendOtp allows sending when no prior OTP was sent', () => {
  const check = canResendOtp(null);
  assert.equal(check.allowed, true);
  assert.equal(check.retryAfter, 0);
});

test('canResendOtp blocks sending when within 60-second cooldown', () => {
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
  const check = canResendOtp(thirtySecondsAgo, 60);
  assert.equal(check.allowed, false);
  assert.ok(check.retryAfter >= 29 && check.retryAfter <= 31, `retryAfter should be ~30s, got ${check.retryAfter}`);
});

test('canResendOtp allows sending once 60-second cooldown has elapsed', () => {
  const sixtyOneSecondsAgo = new Date(Date.now() - 61 * 1000);
  const check = canResendOtp(sixtyOneSecondsAgo, 60);
  assert.equal(check.allowed, true);
  assert.equal(check.retryAfter, 0);
});

// =============================================================
// Section 5: Hash Verification & Timing-Safe Comparison Tests
// =============================================================

test('verifyOtpHash returns true for matching OTP and false for mismatch', () => {
  const otp = '938104';
  const hash = hashOtp(otp);

  assert.equal(verifyOtpHash(otp, hash), true, 'Valid OTP must match stored hash');
  assert.equal(verifyOtpHash('938105', hash), false, 'Incorrect OTP must fail');
  assert.equal(verifyOtpHash('000000', hash), false, 'Incorrect OTP must fail');
  assert.equal(verifyOtpHash('12345', hash), false, 'Invalid length OTP must fail');
  assert.equal(verifyOtpHash('1234567', hash), false, 'Invalid length OTP must fail');
  assert.equal(verifyOtpHash('abcdef', hash), false, 'Non-numeric OTP must fail');
  assert.equal(verifyOtpHash('', hash), false, 'Empty OTP must fail');
});

test('invalidateOtp resets hash, expiry and attempts', () => {
  const mockUser = {
    emailOtpHash: 'some_hash',
    emailOtpExpiresAt: new Date(),
    emailOtpAttempts: 3,
  };
  invalidateOtp(mockUser);
  assert.equal(mockUser.emailOtpHash, null);
  assert.equal(mockUser.emailOtpExpiresAt, null);
  assert.equal(mockUser.emailOtpAttempts, 0);
});

// =============================================================
// Section 6: User Model Schema Backward Compatibility Tests
// =============================================================

test('User schema defines OTP fields with default values', () => {
  const paths = User.schema.paths;
  assert.ok(paths.emailOtpHash, 'emailOtpHash field must exist in schema');
  assert.ok(paths.emailOtpExpiresAt, 'emailOtpExpiresAt field must exist in schema');
  assert.ok(paths.emailOtpAttempts, 'emailOtpAttempts field must exist in schema');
  assert.ok(paths.emailOtpLastSentAt, 'emailOtpLastSentAt field must exist in schema');
  assert.ok(paths.emailVerificationMethod, 'emailVerificationMethod field must exist in schema');

  // Verify legacy verification fields are preserved
  assert.ok(paths.verificationToken, 'verificationToken must be preserved');
  assert.ok(paths.verificationTokenExpiresAt, 'verificationTokenExpiresAt must be preserved');
  assert.ok(paths.isEmailVerified, 'isEmailVerified must be preserved');
});

// =============================================================
// Section 7: POST /api/auth/verify-otp Controller Tests
// =============================================================

test('verifyOtp: rejects missing email with HTTP 400', async () => {
  const req = { body: { otp: '123456' } };
  const res = createMockRes();
  await verifyOtp(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'MISSING_EMAIL');
});

test('verifyOtp: rejects invalid email with HTTP 400', async () => {
  const req = { body: { email: 'not-an-email', otp: '123456' } };
  const res = createMockRes();
  await verifyOtp(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'INVALID_EMAIL');
});

test('verifyOtp: rejects missing OTP with HTTP 400', async () => {
  const req = { body: { email: 'user@example.com' } };
  const res = createMockRes();
  await verifyOtp(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'MISSING_OTP');
});

test('verifyOtp: rejects malformed OTP (non-6 digits) with HTTP 400', async () => {
  const req = { body: { email: 'user@example.com', otp: '1234' } };
  const res = createMockRes();
  await verifyOtp(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'INVALID_OTP_FORMAT');
});

test('verifyOtp: returns safe 400 when user is not found', async () => {
  User.findOne = async () => null;
  try {
    const req = { body: { email: 'nonexistent@example.com', otp: '123456' } };
    const res = createMockRes();
    await verifyOtp(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_OTP');
  } finally {
    User.findOne = originalFindOne;
  }
});

test('verifyOtp: returns safe 200 if account is already verified', async () => {
  const mockUser = {
    email: 'alreadyverified@example.com',
    isEmailVerified: true,
  };
  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: 'alreadyverified@example.com', otp: '123456' } };
    const res = createMockRes();
    await verifyOtp(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.code, 'ALREADY_VERIFIED');
  } finally {
    User.findOne = originalFindOne;
  }
});

test('verifyOtp: returns 400 NO_OTP_PENDING if user has no pending OTP', async () => {
  const mockUser = {
    email: 'user@example.com',
    isEmailVerified: false,
    emailOtpHash: null,
  };
  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: 'user@example.com', otp: '123456' } };
    const res = createMockRes();
    await verifyOtp(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'NO_OTP_PENDING');
  } finally {
    User.findOne = originalFindOne;
  }
});

test('verifyOtp: returns 400 EXPIRED_OTP if OTP expiry date is in past', async () => {
  const mockUser = {
    email: 'user@example.com',
    isEmailVerified: false,
    emailOtpHash: hashOtp('123456'),
    emailOtpExpiresAt: new Date(Date.now() - 1000), // expired
    emailOtpAttempts: 0,
    save: async () => {},
  };
  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: 'user@example.com', otp: '123456' } };
    const res = createMockRes();
    await verifyOtp(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'EXPIRED_OTP');
  } finally {
    User.findOne = originalFindOne;
  }
});

test('verifyOtp: wrong OTP increments attempt counter and returns remaining attempts', async () => {
  let saved = false;
  const mockUser = {
    email: 'user@example.com',
    isEmailVerified: false,
    emailOtpHash: hashOtp('654321'),
    emailOtpExpiresAt: getOtpExpiry(10),
    emailOtpAttempts: 0,
    save: async () => {
      saved = true;
    },
  };
  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: 'user@example.com', otp: '111111' } };
    const res = createMockRes();
    await verifyOtp(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_OTP');
    assert.equal(res.body.attemptsRemaining, 4);
    assert.equal(mockUser.emailOtpAttempts, 1);
    assert.equal(saved, true);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('verifyOtp: 5th failed attempt invalidates the OTP', async () => {
  const mockUser = {
    email: 'user@example.com',
    isEmailVerified: false,
    emailOtpHash: hashOtp('654321'),
    emailOtpExpiresAt: getOtpExpiry(10),
    emailOtpAttempts: 4,
    save: async () => {},
  };
  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: 'user@example.com', otp: '000000' } };
    const res = createMockRes();
    await verifyOtp(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(mockUser.emailOtpAttempts, 5);
    assert.equal(mockUser.emailOtpHash, null, 'Hash must be cleared after 5 failed attempts');
    assert.equal(mockUser.emailOtpExpiresAt, null, 'Expiry must be cleared after 5 failed attempts');
  } finally {
    User.findOne = originalFindOne;
  }
});

test('verifyOtp: valid OTP verifies email, clears OTP fields, and does NOT issue a JWT', async () => {
  let saved = false;
  const rawOtp = '827419';
  const mockUser = {
    email: 'user@example.com',
    isEmailVerified: false,
    emailOtpHash: hashOtp(rawOtp),
    emailOtpExpiresAt: getOtpExpiry(10),
    emailOtpAttempts: 1,
    verificationToken: 'legacy_hash',
    verificationTokenExpiresAt: new Date(),
    save: async () => {
      saved = true;
    },
  };
  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: '  User@Example.COM  ', otp: rawOtp } };
    const res = createMockRes();
    await verifyOtp(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(mockUser.isEmailVerified, true, 'isEmailVerified must be set to true');
    assert.equal(mockUser.emailOtpHash, null, 'emailOtpHash must be cleared');
    assert.equal(mockUser.emailOtpExpiresAt, null, 'emailOtpExpiresAt must be cleared');
    assert.equal(mockUser.emailOtpAttempts, 0, 'emailOtpAttempts must be reset to 0');
    assert.equal(mockUser.emailVerificationMethod, 'otp');
    assert.equal(mockUser.verificationToken, null, 'legacy token must be cleared');
    assert.equal(saved, true);

    // CRITICAL SECURITY ASSERTION: No JWT issued on verification
    assert.equal(res.body.token, undefined, 'Must NOT return auth token in response');
    assert.equal(res.body.jwt, undefined, 'Must NOT return JWT in response');
  } finally {
    User.findOne = originalFindOne;
  }
});

// =============================================================
// Section 8: POST /api/auth/resend-otp Controller Tests
// =============================================================

test('resendOtp: rejects missing email with HTTP 400', async () => {
  const req = { body: {} };
  const res = createMockRes();
  await resendOtp(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.code, 'MISSING_EMAIL');
});

test('resendOtp: rejects invalid email format with HTTP 400', async () => {
  const req = { body: { email: 'bad-email' } };
  const res = createMockRes();
  await resendOtp(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.code, 'INVALID_EMAIL');
});

test('resendOtp: returns generic 200 for unknown email (anti-enumeration)', async () => {
  User.findOne = async () => null;
  try {
    const req = { body: { email: 'ghost@example.com' } };
    const res = createMockRes();
    await resendOtp(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /If an unverified account exists/);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('resendOtp: returns generic 200 for already-verified email (anti-enumeration)', async () => {
  const mockUser = { email: 'verified@example.com', isEmailVerified: true };
  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: 'verified@example.com' } };
    const res = createMockRes();
    await resendOtp(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /If an unverified account exists/);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('resendOtp: enforces 60-second cooldown with HTTP 429 RESEND_COOLDOWN', async () => {
  const mockUser = {
    email: 'unverified@example.com',
    isEmailVerified: false,
    emailOtpLastSentAt: new Date(Date.now() - 20 * 1000), // sent 20s ago
  };
  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: 'unverified@example.com' } };
    const res = createMockRes();
    await resendOtp(req, res);

    assert.equal(res.statusCode, 429);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'RESEND_COOLDOWN');
    assert.ok(res.body.retryAfter >= 39 && res.body.retryAfter <= 41);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('resendOtp: generates new OTP and invalidates previous OTP', async () => {
  const oldHash = hashOtp('111111');
  let saved = false;
  const mockUser = {
    email: 'unverified@example.com',
    name: 'Customer',
    isEmailVerified: false,
    emailOtpHash: oldHash,
    emailOtpAttempts: 3,
    emailOtpLastSentAt: new Date(Date.now() - 65 * 1000), // 65s ago (cooldown satisfied)
    save: async () => {
      saved = true;
    },
  };
  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: 'unverified@example.com' } };
    const res = createMockRes();
    await resendOtp(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(saved, true);
    assert.notEqual(mockUser.emailOtpHash, oldHash, 'New OTP hash must replace old hash');
    assert.equal(mockUser.emailOtpAttempts, 0, 'Attempts must be reset to 0');
    assert.ok(mockUser.emailOtpExpiresAt > new Date(), 'New expiry must be in future');
    assert.ok(mockUser.emailOtpLastSentAt > new Date(Date.now() - 15000), 'Last sent must be updated');
  } finally {
    User.findOne = originalFindOne;
  }
});

// =============================================================
// Section 9: Security & Route Stack Protection Tests
// =============================================================

test('authRateLimiter is attached to /verify-otp and /resend-otp routes', () => {
  const verifyOtpRoute = authRoutes.stack.find(
    (layer) => layer.route && layer.route.path === '/verify-otp' && layer.route.methods.post
  );
  assert.ok(verifyOtpRoute, 'POST /verify-otp route must be registered');
  const verifyHasLimiter = verifyOtpRoute.route.stack.some((handler) => handler.handle === authRateLimiter);
  assert.ok(verifyHasLimiter, 'POST /verify-otp must use authRateLimiter');

  const resendOtpRoute = authRoutes.stack.find(
    (layer) => layer.route && layer.route.path === '/resend-otp' && layer.route.methods.post
  );
  assert.ok(resendOtpRoute, 'POST /resend-otp route must be registered');
  const resendHasLimiter = resendOtpRoute.route.stack.some((handler) => handler.handle === authRateLimiter);
  assert.ok(resendHasLimiter, 'POST /resend-otp must use authRateLimiter');
});
