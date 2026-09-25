import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAndPriceCustomization, calculateOrderPricing } from '../../src/services/order.service.js';

test('valid customization pricing',()=>{ const r=validateAndPriceCustomization({base:'classic',sauce:'tomato',cheese:'mozzarella',vegetables:['onion','capsicum']}); assert.equal(r.unitPrice,150); });
test('invalid base rejected',()=>assert.throws(()=>validateAndPriceCustomization({base:'fake',sauce:'tomato',cheese:'mozzarella',vegetables:[]}),/valid base/));

test('Test A - Menu Pizza pricing: pizzaId present uses pizza.price only', () => {
  const result = calculateOrderPricing({
    pizza: { _id: '6aafb6a3739956d53e4d02e1', name: 'Garden Special', price: 359 },
    unitPrice: 150,
    quantity: 1,
  });
  assert.equal(result.finalUnitPrice, 359);
  assert.equal(result.subtotal, 359);
  assert.equal(result.tax, 18);
  assert.equal(result.totalAmount, 377);
});

test('Test B - Custom Pizza pricing: pizzaId absent uses customization unitPrice', () => {
  const result = calculateOrderPricing({
    pizza: null,
    unitPrice: 150,
    quantity: 1,
  });
  assert.equal(result.finalUnitPrice, 150);
  assert.equal(result.subtotal, 150);
  assert.equal(result.tax, 8);
  assert.equal(result.totalAmount, 158);
});

