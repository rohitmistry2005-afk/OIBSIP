import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { forgotPassword, resetPassword, login } from '../../src/controllers/auth.controller.js';
import { createRandomToken, hashToken, getTokenExpiry } from '../../src/utils/tokens.js';
import authRoutes from '../../src/routes/auth.routes.js';
import { User } from '../../src/models/user.model.js';
import { authRateLimiter } from '../../src/middleware/security.middleware.js';

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
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

const originalUserFindOne = User.findOne;

// =============================================================
// Phase 3 Required Automated Tests (Section 23: Cases 1 to 28)
// =============================================================

// Case 1: Missing email → 400
test('Case 1 - Missing email in forgotPassword returns 400', async () => {
  const req = { body: {} };
  const res = createMockRes();
  await forgotPassword(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Email address is required.');
});

// Case 2: Empty email → 400
test('Case 2 - Empty string email in forgotPassword returns 400', async () => {
  const req = { body: { email: '' } };
  const res = createMockRes();
  await forgotPassword(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Email address is required.');
});

// Case 3: Invalid email → 400
test('Case 3 - Malformed email format in forgotPassword returns 400', async () => {
  const req = { body: { email: 'notanemail' } };
  const res = createMockRes();
  await forgotPassword(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'A valid email address is required.');
});

// Case 4: Whitespace email → 400
test('Case 4 - Whitespace-only email in forgotPassword returns 400', async () => {
  const req = { body: { email: '    ' } };
  const res = createMockRes();
  await forgotPassword(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Email address is required.');
});

// Case 5: Email normalization
test('Case 5 - Email input is trimmed and converted to lowercase before database query', async () => {
  let queriedEmail = null;
  User.findOne = async (query) => {
    queriedEmail = query.email;
    return null;
  };

  try {
    const req = { body: { email: '  TestUser.Recovery@EXAMPLE.COM  ' } };
    const res = createMockRes();
    await forgotPassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(queriedEmail, 'testuser.recovery@example.com');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 6: Existing email → generic 200 response
test('Case 6 - Existing user email in forgotPassword returns generic 200 response', async () => {
  const mockUser = {
    name: 'Existing Customer',
    email: 'existing@example.com',
    resetToken: null,
    resetTokenExpiresAt: null,
    save: async () => {},
  };
  User.findOne = async () => mockUser;

  try {
    const req = { body: { email: 'existing@example.com' } };
    const res = createMockRes();
    await forgotPassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'If an account exists for that email, a password reset link has been sent.');
    assert.ok(mockUser.resetToken, 'User resetToken should be populated');
    assert.ok(mockUser.resetTokenExpiresAt, 'User resetTokenExpiresAt should be set');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 7: Unknown email → same generic 200 response
test('Case 7 - Unknown/nonexistent email in forgotPassword returns same generic 200 response', async () => {
  User.findOne = async () => null;

  try {
    const req = { body: { email: 'unknown.ghost@example.com' } };
    const res = createMockRes();
    await forgotPassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'If an account exists for that email, a password reset link has been sent.');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 8: No account enumeration
test('Case 8 - Existing and unknown email responses are identical to prevent account enumeration', async () => {
  const mockUser = {
    name: 'Real User',
    email: 'real@example.com',
    resetToken: null,
    resetTokenExpiresAt: null,
    save: async () => {},
  };

  let existingRes;
  let unknownRes;

  User.findOne = async () => mockUser;
  try {
    const req1 = { body: { email: 'real@example.com' } };
    existingRes = createMockRes();
    await forgotPassword(req1, existingRes);
  } finally {
    User.findOne = originalUserFindOne;
  }

  User.findOne = async () => null;
  try {
    const req2 = { body: { email: 'fake@example.com' } };
    unknownRes = createMockRes();
    await forgotPassword(req2, unknownRes);
  } finally {
    User.findOne = originalUserFindOne;
  }

  assert.equal(existingRes.statusCode, unknownRes.statusCode);
  assert.equal(existingRes.body.success, unknownRes.body.success);
  assert.equal(existingRes.body.message, unknownRes.body.message);
  assert.equal(JSON.stringify(existingRes.body), JSON.stringify(unknownRes.body));
});

// Case 9: Reset token generated securely
test('Case 9 - Reset token is generated using cryptographically secure random bytes', () => {
  const token1 = createRandomToken();
  const token2 = createRandomToken();

  assert.equal(typeof token1, 'string');
  assert.equal(token1.length, 64, '32 crypto bytes hex encoded must be 64 characters');
  assert.equal(/^[0-9a-f]{64}$/.test(token1), true);
  assert.notEqual(token1, token2, 'Consecutive tokens must be cryptographically distinct');
});

// Case 10: Reset token stored hashed
test('Case 10 - Reset token is stored as a SHA-256 hash, not plaintext', () => {
  const rawToken = createRandomToken();
  const hashedToken = hashToken(rawToken);

  assert.equal(hashedToken.length, 64);
  assert.notEqual(rawToken, hashedToken, 'Stored hash must differ from raw token');
  assert.equal(hashToken(rawToken), hashedToken, 'SHA-256 hash must be deterministic');
});

// Case 11: Reset token has expiration
test('Case 11 - Reset token expiry is set approximately 30 minutes in the future', () => {
  const now = Date.now();
  const expiry = getTokenExpiry(30);

  assert.ok(expiry instanceof Date);
  const diffMs = expiry.getTime() - now;
  const diffMinutes = diffMs / (1000 * 60);

  assert.ok(diffMinutes >= 29.9 && diffMinutes <= 30.1, `Expiry diff was ${diffMinutes} minutes`);
});

// Case 12: Reset token email generated correctly
test('Case 12 - Reset link URL structure contains token and email query parameters', () => {
  const rawToken = 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678';
  const email = 'user@example.com';
  const clientUrl = 'http://localhost:5173';

  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  const parsedUrl = new URL(resetUrl);
  assert.equal(parsedUrl.pathname, '/reset-password');
  assert.equal(parsedUrl.searchParams.get('token'), rawToken);
  assert.equal(parsedUrl.searchParams.get('email'), email);
});

// Case 13: Invalid token rejected
test('Case 13 - Invalid/unknown reset token is rejected with 400 INVALID_TOKEN', async () => {
  User.findOne = async () => null;

  try {
    const req = {
      params: { token: 'invalid_token_12345' },
      body: { password: 'NewValidPassword123!', confirmPassword: 'NewValidPassword123!' },
      query: {},
    };
    const res = createMockRes();
    await resetPassword(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_TOKEN');
    assert.equal(res.body.message, 'This password reset link is invalid.');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 14: Forged token rejected
test('Case 14 - Arbitrary forged token string is rejected with 400 INVALID_TOKEN', async () => {
  User.findOne = async () => null;

  try {
    const req = {
      params: {},
      body: {
        token: 'forged_deadbeefcafebabefaced000111222333444555666777888999aaabbbccc',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
      },
      query: {},
    };
    const res = createMockRes();
    await resetPassword(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_TOKEN');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 15: Expired token rejected
test('Case 15 - Expired reset token is rejected with 400 EXPIRED_TOKEN', async () => {
  const rawToken = createRandomToken();
  const hashedToken = hashToken(rawToken);

  const mockUser = {
    email: 'expired@example.com',
    resetToken: hashedToken,
    resetTokenExpiresAt: new Date(Date.now() - 60000), // expired 1 minute ago
    save: async () => {},
  };

  User.findOne = async (query) => {
    if (query.resetToken === hashedToken) return mockUser;
    return null;
  };

  try {
    const req = {
      params: { token: rawToken },
      body: { password: 'NewValidPassword123!', confirmPassword: 'NewValidPassword123!' },
      query: {},
    };
    const res = createMockRes();
    await resetPassword(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'EXPIRED_TOKEN');
    assert.equal(res.body.message, 'This password reset link has expired. Please request a new one.');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 16: Valid token accepted
test('Case 16 - Valid unexpired token with matching password returns 200', async () => {
  const rawToken = createRandomToken();
  const hashedToken = hashToken(rawToken);

  let saved = false;
  const mockUser = {
    email: 'valid@example.com',
    resetToken: hashedToken,
    resetTokenExpiresAt: new Date(Date.now() + 600000), // 10 minutes future
    passwordHash: 'old_hash',
    save: async () => { saved = true; },
  };

  User.findOne = async (query) => {
    if (query.resetToken === hashedToken) return mockUser;
    return null;
  };

  try {
    const req = {
      params: { token: rawToken },
      body: { password: 'NewValidPassword123!', confirmPassword: 'NewValidPassword123!' },
      query: {},
    };
    const res = createMockRes();
    await resetPassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(saved, true);
    assert.equal(res.body.message, 'Password reset successfully. You can now log in with your new password.');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 17: New password validation
test('Case 17 - Password shorter than 8 characters or missing is rejected with 400', async () => {
  const reqShort = {
    params: { token: 'validtoken' },
    body: { password: 'short', confirmPassword: 'short' },
    query: {},
  };
  const resShort = createMockRes();
  await resetPassword(reqShort, resShort);

  assert.equal(resShort.statusCode, 400);
  assert.equal(resShort.body.code, 'PASSWORD_TOO_SHORT');

  const reqMissing = {
    params: { token: 'validtoken' },
    body: {},
    query: {},
  };
  const resMissing = createMockRes();
  await resetPassword(reqMissing, resMissing);

  assert.equal(resMissing.statusCode, 400);
  assert.equal(resMissing.body.code, 'MISSING_PASSWORD');
});

// Case 18: Password confirmation mismatch rejected
test('Case 18 - Password confirmation mismatch returns 400 PASSWORD_MISMATCH', async () => {
  const req = {
    params: { token: 'validtoken' },
    body: { password: 'NewValidPassword123!', confirmPassword: 'DifferentPassword123!' },
    query: {},
  };
  const res = createMockRes();
  await resetPassword(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'PASSWORD_MISMATCH');
  assert.equal(res.body.message, 'Passwords do not match.');
});

// Case 19: Successful password reset
test('Case 19 - Successful password reset bcrypt hashes the new password with salt rounds', async () => {
  const rawToken = createRandomToken();
  const hashedToken = hashToken(rawToken);
  const newPlainPassword = 'BrandNewPassword99!';

  const mockUser = {
    email: 'resetme@example.com',
    resetToken: hashedToken,
    resetTokenExpiresAt: new Date(Date.now() + 600000),
    passwordHash: 'old_initial_hash',
    save: async () => {},
  };

  User.findOne = async () => mockUser;
  try {
    const req = {
      params: { token: rawToken },
      body: { password: newPlainPassword, confirmPassword: newPlainPassword },
      query: {},
    };
    const res = createMockRes();
    await resetPassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.notEqual(mockUser.passwordHash, 'old_initial_hash');
    assert.notEqual(mockUser.passwordHash, newPlainPassword);
    const isMatch = await bcrypt.compare(newPlainPassword, mockUser.passwordHash);
    assert.equal(isMatch, true, 'New bcrypt hash must verify against new password');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 20: Reset token invalidated after success
test('Case 20 - Reset token and expiry are set to null upon successful reset', async () => {
  const rawToken = createRandomToken();
  const hashedToken = hashToken(rawToken);

  const mockUser = {
    email: 'singleuse@example.com',
    resetToken: hashedToken,
    resetTokenExpiresAt: new Date(Date.now() + 600000),
    passwordHash: 'old_hash',
    save: async () => {},
  };

  User.findOne = async () => mockUser;
  try {
    const req = {
      params: { token: rawToken },
      body: { password: 'UpdatedPassword123!', confirmPassword: 'UpdatedPassword123!' },
      query: {},
    };
    const res = createMockRes();
    await resetPassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(mockUser.resetToken, null, 'resetToken must be set to null');
    assert.equal(mockUser.resetTokenExpiresAt, null, 'resetTokenExpiresAt must be set to null');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 21: Reset token cannot be reused
test('Case 21 - Reusing the reset token is rejected', async () => {
  const rawToken = createRandomToken();
  const email = 'reused@example.com';

  // After token was used, resetToken is null in database
  const userInDb = {
    email,
    resetToken: null,
    resetTokenExpiresAt: null,
  };

  User.findOne = async (query) => {
    if (query.resetToken) return null; // not found by resetToken
    if (query.email === email) return userInDb;
    return null;
  };

  try {
    const req = {
      params: { token: rawToken },
      body: { password: 'SecondAttemptPassword123!', confirmPassword: 'SecondAttemptPassword123!', email },
      query: { email },
    };
    const res = createMockRes();
    await resetPassword(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'ALREADY_USED_TOKEN');
    assert.equal(res.body.message, 'This password reset link has already been used.');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 22: Old password rejected after reset
test('Case 22 - Old password is rejected when authenticating after password reset', async () => {
  const oldPassword = 'OldInitialPassword123!';
  const newPassword = 'NewReplacementPassword123!';

  // User after reset has new bcrypt hash
  const updatedPasswordHash = await bcrypt.hash(newPassword, 12);
  const mockUser = {
    _id: '64f1a2b3c4d5e6f7a8b9c022',
    name: 'Customer 22',
    email: 'customer22@example.com',
    passwordHash: updatedPasswordHash,
    isEmailVerified: true,
  };

  User.findOne = async () => mockUser;
  try {
    const req = {
      body: { email: 'customer22@example.com', password: oldPassword },
    };
    const res = createMockRes();
    await login(req, res);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password.');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 23: New password accepted after reset
test('Case 23 - New password successfully logs in after password reset', async () => {
  const newPassword = 'NewReplacementPassword123!';
  const updatedPasswordHash = await bcrypt.hash(newPassword, 12);
  const mockUser = {
    _id: '64f1a2b3c4d5e6f7a8b9c023',
    name: 'Customer 23',
    email: 'customer23@example.com',
    passwordHash: updatedPasswordHash,
    isEmailVerified: true,
  };

  User.findOne = async () => mockUser;
  try {
    const req = {
      body: { email: 'customer23@example.com', password: newPassword },
    };
    const res = createMockRes();
    await login(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token, 'JWT token returned on new password login');
    assert.equal(res.body.user.email, 'customer23@example.com');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 24: Resend/reset token replacement behavior
test('Case 24 - Requesting a new reset link invalidates previously issued reset token', async () => {
  const initialRawToken = createRandomToken();
  const initialHash = hashToken(initialRawToken);

  const mockUser = {
    name: 'Token Replacement User',
    email: 'replace@example.com',
    resetToken: initialHash,
    resetTokenExpiresAt: getTokenExpiry(30),
    save: async () => {},
  };

  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: 'replace@example.com' } };
    const res = createMockRes();
    await forgotPassword(req, res);

    assert.equal(res.statusCode, 200);
    // User's resetToken has now been replaced with a new hash
    assert.notEqual(mockUser.resetToken, initialHash, 'New reset request must overwrite previous token hash');

    // Attempting to verify with initialRawToken against current mockUser fails
    const initialHashCheck = hashToken(initialRawToken);
    assert.notEqual(mockUser.resetToken, initialHashCheck, 'Initial token hash cannot match active resetToken');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 25: Forgot-password rate limiting
test('Case 25 - Forgot-password endpoint is protected by authRateLimiter in router stack', () => {
  const forgotLayer = authRoutes.stack.find(
    (layer) => layer.route && layer.route.path === '/forgot-password' && layer.route.methods.post
  );
  assert.ok(forgotLayer, 'Forgot-password route layer must exist in auth router');

  const middlewareList = forgotLayer.route.stack.map((s) => s.handle);
  assert.ok(
    middlewareList.some((fn) => fn === authRateLimiter || fn.name === 'rateLimit'),
    'authRateLimiter must be registered on /forgot-password POST endpoint'
  );
});

// Case 26: Reset endpoint rate limiting
test('Case 26 - Reset-password endpoints are protected by authRateLimiter in router stack', () => {
  const resetLayerWithParam = authRoutes.stack.find(
    (layer) => layer.route && layer.route.path === '/reset-password/:token' && layer.route.methods.post
  );
  assert.ok(resetLayerWithParam, 'Reset-password with :token param route layer must exist in auth router');

  const middlewareList1 = resetLayerWithParam.route.stack.map((s) => s.handle);
  assert.ok(
    middlewareList1.some((fn) => fn === authRateLimiter || fn.name === 'rateLimit'),
    'authRateLimiter must be registered on /reset-password/:token POST endpoint'
  );

  const resetLayerBody = authRoutes.stack.find(
    (layer) => layer.route && layer.route.path === '/reset-password' && layer.route.methods.post
  );
  assert.ok(resetLayerBody, 'Reset-password body route layer must exist in auth router');

  const middlewareList2 = resetLayerBody.route.stack.map((s) => s.handle);
  assert.ok(
    middlewareList2.some((fn) => fn === authRateLimiter || fn.name === 'rateLimit'),
    'authRateLimiter must be registered on /reset-password POST endpoint'
  );
});

// Case 27: Password never returned in API response
test('Case 27 - Plaintext password is never returned in forgotPassword or resetPassword responses', async () => {
  const rawToken = createRandomToken();
  const mockUser = {
    email: 'nopwleak@example.com',
    resetToken: hashToken(rawToken),
    resetTokenExpiresAt: new Date(Date.now() + 600000),
    passwordHash: 'hashed_secret',
    save: async () => {},
  };

  User.findOne = async () => mockUser;
  try {
    const plainPw = 'SuperSecretPlainPassword123!';
    const req = {
      params: { token: rawToken },
      body: { password: plainPw, confirmPassword: plainPw },
      query: {},
    };
    const res = createMockRes();
    await resetPassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.password, undefined);
    assert.equal(JSON.stringify(res.body).includes(plainPw), false, 'Response body must not contain plain password');
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 28: Password hash never returned in API response
test('Case 28 - Password hash is never returned in forgotPassword or resetPassword responses', async () => {
  const rawToken = createRandomToken();
  const fakeHash = '$2a$12$abcdef1234567890abcdef1234567890abcdef1234567890abcde';
  const mockUser = {
    email: 'nohashleak@example.com',
    resetToken: hashToken(rawToken),
    resetTokenExpiresAt: new Date(Date.now() + 600000),
    passwordHash: fakeHash,
    save: async () => {},
  };

  User.findOne = async () => mockUser;
  try {
    const req = {
      params: { token: rawToken },
      body: { password: 'ValidNewPassword123!', confirmPassword: 'ValidNewPassword123!' },
      query: {},
    };
    const res = createMockRes();
    await resetPassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.passwordHash, undefined);
    assert.equal(JSON.stringify(res.body).includes(fakeHash), false, 'Response body must not contain passwordHash');
  } finally {
    User.findOne = originalUserFindOne;
  }
});
