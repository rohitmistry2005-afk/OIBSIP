import { signAuthToken } from '../src/utils/jwt.js';

const BASE_URL = 'http://localhost:5000';

async function runSecurityAudit() {
  console.log('====================================================');
  console.log(' PIZZADELIGHT MASTER SECURITY & AUTHORIZATION AUDIT');
  console.log('====================================================');
  let passedCount = 0;
  let totalTests = 0;

  function assert(name, condition, details) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${name}: ${details}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${name}: ${details}`);
    }
  }

  // TEST 1: No token to protected admin route -> 401
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders`);
    assert('TEST 1: No JWT -> GET /api/admin/orders', res.status === 401, `Status: ${res.status}`);
  } catch (err) {
    assert('TEST 1: No JWT -> GET /api/admin/orders', false, err.message);
  }

  // TEST 2: Invalid/garbage token -> 401
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: 'Bearer this-is-an-invalid-garbage-token' },
    });
    assert('TEST 2: Invalid JWT -> GET /api/admin/orders', res.status === 401, `Status: ${res.status}`);
  } catch (err) {
    assert('TEST 2: Invalid JWT -> GET /api/admin/orders', false, err.message);
  }

  // TEST 3: Customer JWT -> GET /api/admin/orders -> 403
  const customerToken = signAuthToken({ id: '65f000000000000000000001', role: 'user', type: 'user' });
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const body = await res.json();
    assert(
      'TEST 3: Customer JWT -> GET /api/admin/orders',
      res.status === 403,
      `Status: ${res.status}, Error: "${body.error}"`
    );
  } catch (err) {
    assert('TEST 3: Customer JWT -> GET /api/admin/orders', false, err.message);
  }

  // TEST 4: Customer JWT -> GET /api/admin/inventory -> 403
  try {
    const res = await fetch(`${BASE_URL}/api/admin/inventory`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const body = await res.json();
    assert(
      'TEST 4: Customer JWT -> GET /api/admin/inventory',
      res.status === 403,
      `Status: ${res.status}, Error: "${body.error}"`
    );
  } catch (err) {
    assert('TEST 4: Customer JWT -> GET /api/admin/inventory', false, err.message);
  }

  // TEST 5: Customer JWT -> PATCH /api/admin/orders/:id/status -> 403
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders/65f000000000000000000002/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ status: 'IN_KITCHEN' }),
    });
    assert(
      'TEST 5: Customer JWT -> PATCH /api/admin/orders/:id/status',
      res.status === 403,
      `Status: ${res.status}`
    );
  } catch (err) {
    assert('TEST 5: Customer JWT -> PATCH /api/admin/orders/:id/status', false, err.message);
  }

  // TEST 6: Customer JWT -> PATCH /api/admin/inventory/:id -> 403
  try {
    const res = await fetch(`${BASE_URL}/api/admin/inventory/65f000000000000000000003`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ quantity: 999 }),
    });
    assert(
      'TEST 6: Customer JWT -> PATCH /api/admin/inventory/:id',
      res.status === 403,
      `Status: ${res.status}`
    );
  } catch (err) {
    assert('TEST 6: Customer JWT -> PATCH /api/admin/inventory/:id', false, err.message);
  }

  // TEST 7: Admin Login via API -> 200 + Admin JWT
  let adminToken = null;
  try {
    const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@pizzadelight.com',
        password: 'AdminPassword123!',
      }),
    });
    const loginData = await loginRes.json();
    adminToken = loginData.token;
    assert(
      'TEST 7: Admin Login -> POST /api/admin/auth/login',
      loginRes.status === 200 && !!adminToken,
      `Status: ${loginRes.status}, Admin Name: "${loginData.admin?.name}"`
    );
  } catch (err) {
    assert('TEST 7: Admin Login -> POST /api/admin/auth/login', false, err.message);
  }

  // TEST 8: Valid Admin JWT -> GET /api/admin/orders -> 200
  let sampleOrderId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const orders = data.orders || data.data?.orders;
    if (orders?.length > 0) {
      sampleOrderId = orders[0]._id;
    }
    assert(
      'TEST 8: Valid Admin JWT -> GET /api/admin/orders',
      res.status === 200 && Array.isArray(orders),
      `Status: ${res.status}, Orders count: ${orders?.length}`
    );
  } catch (err) {
    assert('TEST 8: Valid Admin JWT -> GET /api/admin/orders', false, err.message);
  }

  // TEST 9: Valid Admin JWT -> GET /api/admin/inventory -> 200
  let sampleInventoryId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/admin/inventory`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const inventory = data.inventory || data.data?.inventory;
    if (inventory?.length > 0) {
      sampleInventoryId = inventory[0]._id;
    }
    assert(
      'TEST 9: Valid Admin JWT -> GET /api/admin/inventory',
      res.status === 200 && Array.isArray(inventory),
      `Status: ${res.status}, Inventory count: ${inventory?.length}`
    );
  } catch (err) {
    assert('TEST 9: Valid Admin JWT -> GET /api/admin/inventory', false, err.message);
  }

  // TEST 10: Valid Admin JWT -> GET /api/admin/orders/:id -> 200
  if (sampleOrderId) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/orders/${sampleOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const order = data.order || data.data?.order;
      assert(
        'TEST 10: Valid Admin JWT -> GET /api/admin/orders/:id',
        res.status === 200 && (order?._id === sampleOrderId || order?.id === sampleOrderId),
        `Status: ${res.status}, Retrieved order: ${order?._id || order?.id}`
      );
    } catch (err) {
      assert('TEST 10: Valid Admin JWT -> GET /api/admin/orders/:id', false, err.message);
    }
  }

  // TEST 11: Attempt customer registration with role=admin
  try {
    const attackerEmail = `attacker_${Date.now()}@pizzadelight.test`;
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Attempt',
        email: attackerEmail,
        password: 'Password123!',
        role: 'admin',
        isAdmin: true,
      }),
    });

    const adminLoginAttempt = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: attackerEmail,
        password: 'Password123!',
      }),
    });

    assert(
      'TEST 11: Customer registration cannot escalate to Admin',
      adminLoginAttempt.status === 401,
      `Admin login attempt status: ${adminLoginAttempt.status} (401 Unauthorized expected)`
    );
  } catch (err) {
    assert('TEST 11: Customer registration cannot escalate to Admin', false, err.message);
  }

  // TEST 12: Manual Inventory Stock update via Admin API
  if (sampleInventoryId) {
    try {
      const updateRes = await fetch(`${BASE_URL}/api/admin/inventory/${sampleInventoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ quantity: 45, threshold: 15 }),
      });
      const updateData = await updateRes.json();
      const updatedInv = updateData.inventory || updateData.data?.inventory;
      assert(
        'TEST 12: Admin updates inventory stock and threshold',
        updateRes.status === 200 && updatedInv?.quantity === 45,
        `Status: ${updateRes.status}, New Quantity: ${updatedInv?.quantity}, Threshold: ${updatedInv?.threshold}`
      );
    } catch (err) {
      assert('TEST 12: Admin updates inventory stock and threshold', false, err.message);
    }
  }

  console.log('====================================================');
  console.log(`TOTAL SECURITY AUDIT RESULTS: ${passedCount}/${totalTests} PASSED`);
  console.log('====================================================');

  process.exit(passedCount === totalTests ? 0 : 1);
}

runSecurityAudit();
