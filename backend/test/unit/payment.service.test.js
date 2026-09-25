import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { amountToPaise, verifyRazorpaySignature } from '../../src/services/payment.service.js';
import { env } from '../../src/config/env.js';
test('amount conversion',()=>assert.equal(amountToPaise(499.99),49999));
test('signature verification',()=>{const o='order_test',p='pay_test';const sig=crypto.createHmac('sha256',env.razorpayKeySecret).update(`${o}|${p}`).digest('hex');assert.equal(verifyRazorpaySignature({razorpayOrderId:o,razorpayPaymentId:p,razorpaySignature:sig}),true);assert.equal(verifyRazorpaySignature({razorpayOrderId:o,razorpayPaymentId:p,razorpaySignature:'bad'}),false);});
