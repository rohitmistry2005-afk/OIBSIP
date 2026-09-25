import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { register } from '../../src/controllers/auth.controller.js';
import { User } from '../../src/models/user.model.js';
import authRoutes from '../../src/routes/auth.routes.js';
import { authRateLimiter } from '../../src/middleware/security.middleware.js';

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

const originalFindOne = User.findOne;
const originalCreate = User.create;

// =============================================================
// Section 1: Registration Validation Tests
// =============================================================

test('register: missing or empty name returns HTTP 400', async () => {
  const req = { body: { name: '   ', email: 'test@example.com', password: 'Password123!' } };
  const res = createMockRes();
  await register(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Name, valid email and password/);
});

test('register: missing email returns HTTP 400', async () => {
  const req = { body: { name: 'Test User', email: '', password: 'Password123!' } };
  const res = createMockRes();
  await register(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('register: malformed email returns HTTP 400', async () => {
  const req = { body: { name: 'Test User', email: 'not-an-email', password: 'Password123!' } };
  const res = createMockRes();
  await register(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('register: missing or short password (< 8 chars) returns HTTP 400', async () => {
  const req = { body: { name: 'Test User', email: 'user@example.com', password: 'short' } };
  const res = createMockRes();
  await register(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

// =============================================================
// Section 2: Duplicate Email Protection
// =============================================================

test('register: duplicate email returns HTTP 409 conflict', async () => {
  User.findOne = async () => ({ email: 'existing@example.com' });
  try {
    const req = { body: { name: 'New User', email: 'Existing@Example.COM', password: 'Password123!' } };
    const res = createMockRes();
    await register(req, res);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/);
  } finally {
    User.findOne = originalFindOne;
  }
});

// =============================================================
// Section 3: Successful Registration with OTP Integration
// =============================================================

test('register: successfully creates user with OTP fields, hashes password, and returns 201 without JWT', async () => {
  let createdRecord = null;
  User.findOne = async () => null; // no duplicate
  User.create = async (doc) => {
    createdRecord = {
      _id: '64f1a2b3c4d5e6f7a8b9c0d1',
      ...doc,
    };
    return createdRecord;
  };

  try {
    const req = {
      body: {
        name: '  Rohit Mistry  ',
        email: '  Rohit.Mistry@Example.COM  ',
        password: 'SecurePassword123!',
      },
    };
    const res = createMockRes();
    await register(req, res);

    // HTTP 201 Created
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.requiresVerification, true);
    assert.equal(res.body.verificationMethod, 'otp');
    assert.equal(res.body.email, 'rohit.mistry@example.com');
    assert.match(res.body.message, /6-digit verification code/);

    // Database record validation
    assert.ok(createdRecord, 'User.create must be called');
    assert.equal(createdRecord.name, 'Rohit Mistry', 'Name must be trimmed');
    assert.equal(createdRecord.email, 'rohit.mistry@example.com', 'Email must be normalized to lowercase');
    assert.equal(createdRecord.isEmailVerified, false, 'isEmailVerified must be false');
    assert.equal(createdRecord.emailVerificationMethod, 'otp', 'emailVerificationMethod must be otp');

    // Password must be hashed with bcrypt
    assert.ok(createdRecord.passwordHash);
    assert.notEqual(createdRecord.passwordHash, 'SecurePassword123!');
    const isPasswordValid = await bcrypt.compare('SecurePassword123!', createdRecord.passwordHash);
    assert.equal(isPasswordValid, true, 'Stored passwordHash must match submitted password via bcrypt');

    // OTP security properties
    assert.ok(createdRecord.emailOtpHash, 'emailOtpHash must be populated');
    assert.equal(createdRecord.emailOtpHash.length, 64, 'emailOtpHash must be a 64-character SHA-256 hex digest');
    assert.ok(createdRecord.emailOtpExpiresAt > new Date(), 'emailOtpExpiresAt must be in the future (~10m)');
    assert.equal(createdRecord.emailOtpAttempts, 0, 'emailOtpAttempts must initialize to 0');
    assert.ok(createdRecord.emailOtpLastSentAt instanceof Date, 'emailOtpLastSentAt must be a Date');

    // Legacy verification tokens must be null for new OTP registrations
    assert.equal(createdRecord.verificationToken, null);
    assert.equal(createdRecord.verificationTokenExpiresAt, null);

    // Critical confidentiality assertions:
    assert.equal(res.body.token, undefined, 'Must NOT return JWT auth token on registration');
    assert.equal(res.body.jwt, undefined, 'Must NOT return JWT in response');
    assert.equal(res.body.user.password, undefined, 'Must NOT expose plaintext password');
    assert.equal(res.body.user.passwordHash, undefined, 'Must NOT expose passwordHash in safeUser');
    assert.equal(res.body.user.emailOtpHash, undefined, 'Must NOT expose emailOtpHash in safeUser');
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  }
});

// =============================================================
// Section 4: Route Rate Limiter Protection
// =============================================================

test('register route is protected by authRateLimiter', () => {
  const registerRoute = authRoutes.stack.find(
    (layer) => layer.route && layer.route.path === '/register' && layer.route.methods.post
  );
  assert.ok(registerRoute, 'POST /register route must be registered');
  const hasLimiter = registerRoute.route.stack.some((handler) => handler.handle === authRateLimiter);
  assert.ok(hasLimiter, 'POST /register must use authRateLimiter');
});
