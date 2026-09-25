import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { login, logout } from '../../src/controllers/auth.controller.js';
import { authenticateUser, authenticateAdmin } from '../../src/middleware/auth.middleware.js';
import authRoutes from '../../src/routes/auth.routes.js';
import { User } from '../../src/models/user.model.js';
import { Admin } from '../../src/models/admin.model.js';
import { env } from '../../src/config/env.js';
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
const originalUserFindById = User.findById;
const originalAdminFindById = Admin.findById;

// =============================================================
// Phase 2 Required Automated Tests (Section 17: Cases 1 to 17)
// =============================================================

// Case 1: Successful verified-user login
test('Case 1 - Successful verified-user login returns 200, JWT token, and safe user profile', async () => {
  const password = 'SecretPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);
  const mockUser = {
    _id: '64f1a2b3c4d5e6f7a8b9c0d1',
    name: 'Verified Customer',
    email: 'verified@example.com',
    passwordHash,
    isEmailVerified: true,
  };

  User.findOne = async () => mockUser;
  try {
    const req = {
      body: {
        email: 'verified@example.com',
        password,
      },
    };
    const res = createMockRes();
    await login(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Login successful.');
    assert.ok(res.body.token, 'Token must be present in response');
    assert.equal(res.body.user.email, 'verified@example.com');
    assert.equal(res.body.user.isEmailVerified, true);
    assert.equal(res.body.user.password, undefined);
    assert.equal(res.body.user.passwordHash, undefined);
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 2: Invalid password rejected
test('Case 2 - Invalid password returns HTTP 401 with generic error message', async () => {
  const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
  const mockUser = {
    _id: '64f1a2b3c4d5e6f7a8b9c0d2',
    name: 'Customer',
    email: 'customer@example.com',
    passwordHash,
    isEmailVerified: true,
  };

  User.findOne = async () => mockUser;
  try {
    const req = {
      body: {
        email: 'customer@example.com',
        password: 'WrongPassword999!',
      },
    };
    const res = createMockRes();
    await login(req, res);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password.');
    assert.equal(res.body.token, undefined);
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 3: Unknown email rejected generically
test('Case 3 - Unknown email returns HTTP 401 with generic error message (anti-enumeration)', async () => {
  User.findOne = async () => null;
  try {
    const req = {
      body: {
        email: 'unknown-account@example.com',
        password: 'AnyPassword123!',
      },
    };
    const res = createMockRes();
    await login(req, res);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password.');
    assert.equal(res.body.token, undefined);
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 4: Unverified user rejected
test('Case 4 - Unverified user login returns HTTP 403 with requiresVerification and clear message', async () => {
  const password = 'ValidPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);
  const mockUser = {
    _id: '64f1a2b3c4d5e6f7a8b9c0d4',
    name: 'Unverified Customer',
    email: 'unverified@example.com',
    passwordHash,
    isEmailVerified: false,
  };

  User.findOne = async () => mockUser;
  try {
    const req = {
      body: {
        email: 'unverified@example.com',
        password,
      },
    };
    const res = createMockRes();
    await login(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Please verify your email address before logging in.');
    assert.equal(res.body.requiresVerification, true);
    assert.equal(res.body.email, 'unverified@example.com');
    assert.equal(res.body.token, undefined);
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 5: Missing email rejected
test('Case 5 - Missing email in login body returns HTTP 400', async () => {
  const req = {
    body: {
      password: 'SomePassword123!',
    },
  };
  const res = createMockRes();
  await login(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Email address is required.');
});

// Case 6: Invalid email rejected
test('Case 6 - Invalid email format in login body returns HTTP 400', async () => {
  const req = {
    body: {
      email: 'not-an-email',
      password: 'SomePassword123!',
    },
  };
  const res = createMockRes();
  await login(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'A valid email address is required.');
});

// Case 7: Missing password rejected
test('Case 7 - Missing password in login body returns HTTP 400', async () => {
  const req = {
    body: {
      email: 'customer@example.com',
    },
  };
  const res = createMockRes();
  await login(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Password is required.');
});

// Case 8: JWT/session generated after successful login
test('Case 8 - JWT token issued on login contains correct claims (sub, role, type, exp)', async () => {
  const password = 'MyPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = '64f1a2b3c4d5e6f7a8b9c0d8';
  const mockUser = {
    _id: userId,
    name: 'Token User',
    email: 'tokenuser@example.com',
    passwordHash,
    isEmailVerified: true,
  };

  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: 'tokenuser@example.com', password } };
    const res = createMockRes();
    await login(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.token);

    const decoded = jwt.verify(res.body.token, env.jwtSecret);
    assert.equal(decoded.sub, userId);
    assert.equal(decoded.role, 'user');
    assert.equal(decoded.type, 'user');
    assert.ok(decoded.exp > Math.floor(Date.now() / 1000));
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 9: Expired token rejected
test('Case 9 - Expired JWT token is rejected by authenticateUser middleware with HTTP 401', async () => {
  const expiredToken = jwt.sign(
    { sub: '64f1a2b3c4d5e6f7a8b9c0d9', role: 'user', type: 'user' },
    env.jwtSecret,
    { expiresIn: '-10s' }
  );

  const req = {
    headers: { authorization: `Bearer ${expiredToken}` },
  };
  const res = createMockRes();
  let nextCalled = false;
  await authenticateUser(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Invalid or expired authentication token');
});

// Case 10: Invalid token rejected (wrong secret / tampered signature)
test('Case 10 - JWT with invalid signature is rejected with HTTP 401', async () => {
  const tamperedToken = jwt.sign(
    { sub: '64f1a2b3c4d5e6f7a8b9c010', role: 'user', type: 'user' },
    'wrong-secret-key-12345678901234567890'
  );

  const req = {
    headers: { authorization: `Bearer ${tamperedToken}` },
  };
  const res = createMockRes();
  let nextCalled = false;
  await authenticateUser(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Invalid or expired authentication token');
});

// Case 11: Malformed token rejected
test('Case 11 - Malformed token string is rejected with HTTP 401', async () => {
  const req = {
    headers: { authorization: 'Bearer this.is.not.a.valid.jwt' },
  };
  const res = createMockRes();
  let nextCalled = false;
  await authenticateUser(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Invalid or expired authentication token');
});

// Case 12: Missing token rejected from protected endpoint
test('Case 12 - Missing token returns HTTP 401 Authentication required', async () => {
  const req = {
    headers: {},
  };
  const res = createMockRes();
  let nextCalled = false;
  await authenticateUser(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Authentication required');
});

// Case 13: Valid token accepted by protected endpoint
test('Case 13 - Valid token is accepted by protected endpoint, attaching user to req', async () => {
  const userId = '64f1a2b3c4d5e6f7a8b9c013';
  const validToken = jwt.sign(
    { sub: userId, role: 'user', type: 'user' },
    env.jwtSecret,
    { expiresIn: '1h' }
  );

  const mockUserRecord = {
    _id: userId,
    name: 'Protected User',
    email: 'protected@example.com',
    isEmailVerified: true,
  };

  User.findById = () => ({
    select: async () => mockUserRecord,
  });

  try {
    const req = {
      headers: { authorization: `Bearer ${validToken}` },
    };
    const res = createMockRes();
    let nextCalled = false;
    await authenticateUser(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.ok(req.user);
    assert.equal(req.user._id, userId);
    assert.equal(req.user.email, 'protected@example.com');
  } finally {
    User.findById = originalUserFindById;
  }
});

// Case 14: Logout/session invalidation behavior
test('Case 14 - POST /auth/logout returns HTTP 200 with success status', async () => {
  const req = {};
  const res = createMockRes();
  await logout(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.message, 'Logged out successfully.');
});

// Case 15: Rate limiting on login
test('Case 15 - Login endpoint is protected by authRateLimiter in router stack', () => {
  const loginLayer = authRoutes.stack.find(
    (layer) => layer.route && layer.route.path === '/login' && layer.route.methods.post
  );
  assert.ok(loginLayer, 'Login route layer must exist in auth router');

  const middlewareList = loginLayer.route.stack.map((s) => s.handle);
  assert.ok(
    middlewareList.some((fn) => fn === authRateLimiter || fn.name === 'rateLimit'),
    'authRateLimiter must be registered on /login POST endpoint'
  );
});

// Case 16: Password never returned in login response
test('Case 16 - Passwords and passwordHash are strictly excluded from login response', async () => {
  const password = 'StrictPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);
  const mockUser = {
    _id: '64f1a2b3c4d5e6f7a8b9c016',
    name: 'Security Test',
    email: 'security@example.com',
    passwordHash,
    isEmailVerified: true,
  };

  User.findOne = async () => mockUser;
  try {
    const req = { body: { email: 'security@example.com', password } };
    const res = createMockRes();
    await login(req, res);

    assert.equal(res.statusCode, 200);
    const userPayload = res.body.user;
    assert.ok(userPayload);
    assert.equal(userPayload.password, undefined);
    assert.equal(userPayload.passwordHash, undefined);
    assert.equal(JSON.stringify(res.body).includes(passwordHash), false);
  } finally {
    User.findOne = originalUserFindOne;
  }
});

// Case 17: Customer/admin role separation remains intact
test('Case 17 - Customer token cannot access admin endpoint and admin token cannot access customer endpoint', async () => {
  const userToken = jwt.sign(
    { sub: '64f1a2b3c4d5e6f7a8b9c017', role: 'user', type: 'user' },
    env.jwtSecret,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { sub: '64f1a2b3c4d5e6f7a8b9c999', role: 'admin', type: 'admin' },
    env.jwtSecret,
    { expiresIn: '1h' }
  );

  // 17A: Customer token hitting admin middleware
  const adminReq = { headers: { authorization: `Bearer ${userToken}` } };
  const adminRes = createMockRes();
  let adminNextCalled = false;
  await authenticateAdmin(adminReq, adminRes, () => { adminNextCalled = true; });

  assert.equal(adminNextCalled, false);
  assert.equal(adminRes.statusCode, 403);
  assert.equal(adminRes.body.success, false);
  assert.equal(adminRes.body.message, 'Admin authentication required');

  // 17B: Admin token hitting user middleware
  const userReq = { headers: { authorization: `Bearer ${adminToken}` } };
  const userRes = createMockRes();
  let userNextCalled = false;
  await authenticateUser(userReq, userRes, () => { userNextCalled = true; });

  assert.equal(userNextCalled, false);
  assert.equal(userRes.statusCode, 403);
  assert.equal(userRes.body.success, false);
  assert.equal(userRes.body.message, 'User authentication required');
});
