import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextOrderStatus } from '../../src/services/admin.service.js';
test('status transition contract',()=>{assert.equal(getNextOrderStatus('ORDER_RECEIVED'),'IN_KITCHEN');assert.equal(getNextOrderStatus('IN_KITCHEN'),'SENT_TO_DELIVERY');assert.equal(getNextOrderStatus('SENT_TO_DELIVERY'),null);});
