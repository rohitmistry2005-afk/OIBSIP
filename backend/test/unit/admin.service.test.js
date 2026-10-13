import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { getNextOrderStatus, updateInventoryItem } from '../../src/services/admin.service.js';
import { Inventory } from '../../src/models/inventory.model.js';

test('status transition contract', () => {
  assert.equal(getNextOrderStatus('ORDER_RECEIVED'), 'IN_KITCHEN');
  assert.equal(getNextOrderStatus('IN_KITCHEN'), 'SENT_TO_DELIVERY');
  assert.equal(getNextOrderStatus('SENT_TO_DELIVERY'), null);
});

test('updateInventoryItem rejects invalid ObjectId with 400', async () => {
  await assert.rejects(
    async () => updateInventoryItem('invalid-mongo-id', { quantity: 10 }),
    (err) => err.statusCode === 400 && err.message.includes('Invalid inventory item id')
  );
});

test('updateInventoryItem rejects negative or non-integer quantity with 400', async () => {
  const validId = new mongoose.Types.ObjectId().toString();
  const origFindById = Inventory.findById;
  Inventory.findById = async () => ({
    _id: validId,
    quantity: 50,
    threshold: 20,
    save: async () => {},
  });

  try {
    await assert.rejects(
      async () => updateInventoryItem(validId, { quantity: -5 }),
      (err) => err.statusCode === 400 && err.message.includes('Quantity must be a non-negative integer')
    );
    await assert.rejects(
      async () => updateInventoryItem(validId, { quantity: 12.5 }),
      (err) => err.statusCode === 400 && err.message.includes('Quantity must be a non-negative integer')
    );
  } finally {
    Inventory.findById = origFindById;
  }
});

test('updateInventoryItem rejects negative or non-integer threshold with 400', async () => {
  const validId = new mongoose.Types.ObjectId().toString();
  const origFindById = Inventory.findById;
  Inventory.findById = async () => ({
    _id: validId,
    quantity: 50,
    threshold: 20,
    save: async () => {},
  });

  try {
    await assert.rejects(
      async () => updateInventoryItem(validId, { threshold: -1 }),
      (err) => err.statusCode === 400 && err.message.includes('Threshold must be a non-negative integer')
    );
    await assert.rejects(
      async () => updateInventoryItem(validId, { threshold: 'invalid' }),
      (err) => err.statusCode === 400 && err.message.includes('Threshold must be a non-negative integer')
    );
    await assert.rejects(
      async () => updateInventoryItem(validId, { threshold: 15.7 }),
      (err) => err.statusCode === 400 && err.message.includes('Threshold must be a non-negative integer')
    );
  } finally {
    Inventory.findById = origFindById;
  }
});

test('updateInventoryItem updates threshold and quantity successfully', async () => {
  const validId = new mongoose.Types.ObjectId().toString();
  const origFindById = Inventory.findById;
  const mockDoc = {
    _id: validId,
    name: 'Classic Crust',
    quantity: 50,
    threshold: 20,
    lowStockAlertSentAt: null,
    save: async () => mockDoc,
  };
  Inventory.findById = async () => mockDoc;

  try {
    const updated = await updateInventoryItem(validId, { quantity: 25, threshold: 15 });
    assert.equal(updated.quantity, 25);
    assert.equal(updated.threshold, 15);
  } finally {
    Inventory.findById = origFindById;
  }
});

test('updateInventoryItem resets lowStockAlertSentAt when stock is replenished above or equal to threshold (recovery behavior)', async () => {
  const validId = new mongoose.Types.ObjectId().toString();
  const origFindById = Inventory.findById;
  const mockDoc = {
    _id: validId,
    name: 'Tomato Sauce',
    quantity: 5,
    threshold: 20,
    lowStockAlertSentAt: new Date(Date.now() - 3600000), // Previous alert timestamp
    save: async () => mockDoc,
  };
  Inventory.findById = async () => mockDoc;

  try {
    // 1. Updating quantity to equal threshold (20) resets lowStockAlertSentAt to null
    const restoredAtThreshold = await updateInventoryItem(validId, { quantity: 20 });
    assert.equal(restoredAtThreshold.quantity, 20);
    assert.equal(restoredAtThreshold.lowStockAlertSentAt, null);

    // 2. Setting mockDoc back to alerted state
    mockDoc.lowStockAlertSentAt = new Date();
    const restoredAboveThreshold = await updateInventoryItem(validId, { quantity: 45 });
    assert.equal(restoredAboveThreshold.quantity, 45);
    assert.equal(restoredAboveThreshold.lowStockAlertSentAt, null);
  } finally {
    Inventory.findById = origFindById;
  }
});

test('updateInventoryItem preserves lowStockAlertSentAt if updated stock remains below threshold', async () => {
  const validId = new mongoose.Types.ObjectId().toString();
  const origFindById = Inventory.findById;
  const priorTimestamp = new Date(Date.now() - 1800000);
  const mockDoc = {
    _id: validId,
    name: 'Tomato Sauce',
    quantity: 5,
    threshold: 20,
    lowStockAlertSentAt: priorTimestamp,
    save: async () => mockDoc,
  };
  Inventory.findById = async () => mockDoc;

  try {
    // Quantity changed from 5 to 10, but still below threshold (20)
    const updatedStillLow = await updateInventoryItem(validId, { quantity: 10 });
    assert.equal(updatedStillLow.quantity, 10);
    assert.equal(updatedStillLow.lowStockAlertSentAt, priorTimestamp);
  } finally {
    Inventory.findById = origFindById;
  }
});
