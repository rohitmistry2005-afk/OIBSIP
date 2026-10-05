import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { authenticateCronSecret } from '../../src/middleware/cron-auth.middleware.js';
import { triggerLowStockCheck } from '../../src/controllers/internal.controller.js';
import { Inventory } from '../../src/models/inventory.model.js';
import { checkLowStockAndNotify } from '../../src/services/notification.service.js';

// Helper to create a mock response object
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

test('authenticateCronSecret rejects when CRON_SECRET is empty/not configured on server', () => {
  const origSecret = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;

  const req = { headers: { 'x-cron-secret': 'some-secret' } };
  const res = createMockRes();
  let nextCalled = false;

  authenticateCronSecret(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Unauthorized');

  if (origSecret !== undefined) process.env.CRON_SECRET = origSecret;
});

test('authenticateCronSecret rejects request without X-Cron-Secret header with 401', () => {
  const origSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'test-secret-12345';

  const req = { headers: {} };
  const res = createMockRes();
  let nextCalled = false;

  authenticateCronSecret(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Unauthorized');

  if (origSecret !== undefined) process.env.CRON_SECRET = origSecret;
});

test('authenticateCronSecret rejects request with incorrect X-Cron-Secret header with 401', () => {
  const origSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'test-secret-12345';

  const req = { headers: { 'x-cron-secret': 'wrong-secret' } };
  const res = createMockRes();
  let nextCalled = false;

  authenticateCronSecret(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Unauthorized');

  if (origSecret !== undefined) process.env.CRON_SECRET = origSecret;
});

test('authenticateCronSecret approves request with matching X-Cron-Secret header', () => {
  const origSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'test-secret-12345';

  const req = { headers: { 'x-cron-secret': 'test-secret-12345' } };
  const res = createMockRes();
  let nextCalled = false;

  authenticateCronSecret(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);

  if (origSecret !== undefined) process.env.CRON_SECRET = origSecret;
});

test('triggerLowStockCheck calls runLowStockCheckNow and returns safe 200 JSON', async () => {
  const origFind = Inventory.find;
  Inventory.find = async () => [
    { itemId: 'base-1', name: 'Classic Crust', category: 'base', quantity: 50, threshold: 20, lowStockAlertSentAt: null },
    { itemId: 'cheese-1', name: 'Mozzarella', category: 'cheese', quantity: 30, threshold: 20, lowStockAlertSentAt: null },
  ];

  try {
    const res = createMockRes();
    await triggerLowStockCheck({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.result !== undefined);
    assert.equal(res.body.result.checked, 2);
    assert.equal(res.body.result.notified, 0);
    assert.equal(res.body.secret, undefined);
  } finally {
    Inventory.find = origFind;
  }
});

test('triggerLowStockCheck returns 500 with safe generic error when check throws', async () => {
  const origFind = Inventory.find;
  Inventory.find = async () => {
    throw new Error('Database connection failed catastrophically');
  };

  try {
    const res = createMockRes();
    await triggerLowStockCheck({}, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Internal server error');
    assert.equal(res.body.stack, undefined);
    assert.equal(res.body.error, undefined);
  } finally {
    Inventory.find = origFind;
  }
});

test('checkLowStockAndNotify preserves alert-deduplication behavior', async () => {
  const origFind = Inventory.find;
  // Item has low stock but lowStockAlertSentAt is already set
  Inventory.find = async () => [
    {
      itemId: 'base-low',
      name: 'Thin Crust',
      category: 'base',
      quantity: 5,
      threshold: 20,
      lowStockAlertSentAt: new Date(Date.now() - 3600000), // already alerted 1 hr ago
    },
  ];

  try {
    const result = await checkLowStockAndNotify();
    assert.equal(result.checked, 1);
    assert.equal(result.notified, 0); // Must NOT notify again due to deduplication
  } finally {
    Inventory.find = origFind;
  }
});

test('HTTP endpoint integration via live local server: POST /api/internal/low-stock', async () => {
  const origSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'test-e2e-cron-secret-999';

  const origFind = Inventory.find;
  Inventory.find = async () => [
    { itemId: 'base-1', name: 'Classic Crust', category: 'base', quantity: 50, threshold: 20, lowStockAlertSentAt: null },
  ];

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Check 1: Missing X-Cron-Secret header -> 401
    const resNoHeader = await fetch(`${baseUrl}/api/internal/low-stock`, {
      method: 'POST',
    });
    assert.equal(resNoHeader.status, 401);
    const bodyNoHeader = await resNoHeader.json();
    assert.equal(bodyNoHeader.success, false);
    assert.equal(bodyNoHeader.message, 'Unauthorized');

    // Check 2: Incorrect X-Cron-Secret header -> 401
    const resBadHeader = await fetch(`${baseUrl}/api/internal/low-stock`, {
      method: 'POST',
      headers: { 'X-Cron-Secret': 'completely-wrong-secret' },
    });
    assert.equal(resBadHeader.status, 401);
    const bodyBadHeader = await resBadHeader.json();
    assert.equal(bodyBadHeader.success, false);
    assert.equal(bodyBadHeader.message, 'Unauthorized');

    // Check 3: Valid X-Cron-Secret header -> 200
    const resValid = await fetch(`${baseUrl}/api/internal/low-stock`, {
      method: 'POST',
      headers: { 'X-Cron-Secret': 'test-e2e-cron-secret-999' },
    });
    assert.equal(resValid.status, 200);
    const bodyValid = await resValid.json();
    assert.equal(bodyValid.success, true);
    assert.ok(bodyValid.result !== undefined);
    assert.equal(typeof bodyValid.result.checked, 'number');
    assert.equal(typeof bodyValid.result.notified, 'number');
    assert.equal(bodyValid.secret, undefined);
  } finally {
    server.close();
    Inventory.find = origFind;
    if (origSecret !== undefined) process.env.CRON_SECRET = origSecret;
  }
});
