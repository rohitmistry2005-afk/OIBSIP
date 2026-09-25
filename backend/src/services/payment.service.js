import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { Order } from '../models/order.model.js';
import { Payment } from '../models/payment.model.js';
import { Inventory } from '../models/inventory.model.js';

let cachedClient = null;
let cachedKeyId = null;
let cachedKeySecret = null;

const INGREDIENTS = (order) => [
  { category: 'base', itemId: order.customization.base.id, name: order.customization.base.name },
  { category: 'sauce', itemId: order.customization.sauce.id, name: order.customization.sauce.name },
  { category: 'cheese', itemId: order.customization.cheese.id, name: order.customization.cheese.name },
  ...order.customization.vegetables.map((item) => ({ category: 'vegetable', itemId: item.id, name: item.name })),
];

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function extractRazorpayError(err) {
  const rzpObj = err?.error || err?.response?.data?.error || {};
  return {
    code: rzpObj.code || err?.code || 'PAYMENT_GATEWAY_ERROR',
    description: rzpObj.description || err?.message || 'Payment service error',
    statusCode: Number(err?.statusCode || err?.status || err?.response?.status || 502),
    source: rzpObj.source || 'payment_gateway',
    step: rzpObj.step || 'order_creation',
    reason: rzpObj.reason || rzpObj.code || err?.code || 'gateway_failure',
  };
}

export function getRazorpayClient() {
  const keyId = env.razorpayKeyId;
  const keySecret = env.razorpayKeySecret;
  if (!keyId || !keySecret) {
    throw fail('Razorpay is not configured. Add test-mode keys to server/.env.', 503);
  }
  if (cachedClient && cachedKeyId === keyId && cachedKeySecret === keySecret) {
    return cachedClient;
  }
  const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  // Attach axios response interceptor so upstream network errors have an error.response,
  // preventing normalizeError from throwing TypeError: Cannot read properties of undefined (reading 'status')
  if (client.api && client.api.rq && client.api.rq.interceptors) {
    client.api.rq.interceptors.response.use(
      (response) => response,
      (error) => {
        if (!error.response) {
          error.response = {
            status: error.status || 502,
            data: {
              error: {
                code: error.code || 'GATEWAY_NETWORK_ERROR',
                description: error.message || 'Unable to connect to payment gateway',
                source: 'network',
                step: 'upstream_connection',
                reason: error.code || 'network_error',
              },
            },
          };
        }
        return Promise.reject(error);
      }
    );
  }
  cachedClient = client;
  cachedKeyId = keyId;
  cachedKeySecret = keySecret;
  return client;
}

export function amountToPaise(amount) {
  return Math.round(Number(amount) * 100);
}

export function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const generated = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  const expected = Buffer.from(generated, 'utf8');
  const provided = Buffer.from(String(razorpaySignature || ''), 'utf8');
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
}

async function getOrderForUser(orderId, userId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw fail('Order not found', 404);
  return order;
}

export async function createRazorpayOrderForUser({ orderId, userId, clientAmount }) {
  const order = await getOrderForUser(orderId, userId);
  if (order.paymentStatus === 'SUCCESS') throw fail('This order has already been paid');
  if (!order.totalAmount || order.totalAmount <= 0) throw fail('Invalid order amount');
  if (clientAmount !== undefined && clientAmount !== null) {
    const parsedAmount = Number(clientAmount);
    if (isNaN(parsedAmount) || Math.abs(parsedAmount - order.totalAmount) > 0.01) {
      throw fail('Order amount mismatch: client amount does not match authoritative order total', 400);
    }
  }

  const ingredients = INGREDIENTS(order);
  const uniqueKeys = new Set(ingredients.map((item) => `${item.category}:${item.itemId}`));
  const inventory = await Inventory.find({
    $or: [...uniqueKeys].map((key) => {
      const [category, itemId] = key.split(':');
      return { category, itemId };
    }),
  }).lean();
  const byKey = new Map(inventory.map((item) => [`${item.category}:${item.itemId}`, item]));
  for (const ingredient of ingredients) {
    const item = byKey.get(`${ingredient.category}:${ingredient.itemId}`);
    if (!item) throw fail(`Inventory item not configured: ${ingredient.name}`, 409);
    if (item.quantity < order.quantity) {
      throw fail(`Insufficient stock for ${ingredient.name}. Available: ${item.quantity}`, 409);
    }
  }

  const client = getRazorpayClient();
  const receipt = `pizza_${String(order._id).slice(-12)}_${Date.now()}`;
  let razorpayOrder;
  try {
    razorpayOrder = await client.orders.create({
      amount: amountToPaise(order.totalAmount),
      currency: env.razorpayCurrency || 'INR',
      receipt,
      notes: { orderId: String(order._id), userId: String(userId) },
    });
  } catch (rzpErr) {
    const errorDetails = extractRazorpayError(rzpErr);
    console.error('[payment:createOrder] Razorpay order creation failed:', {
      code: errorDetails.code,
      statusCode: errorDetails.statusCode,
      source: errorDetails.source,
      step: errorDetails.step,
      reason: errorDetails.reason,
    });
    const err = new Error(errorDetails.description || 'Payment gateway order creation failed');
    err.statusCode = errorDetails.statusCode || 502;
    err.details = errorDetails;
    throw err;
  }

  order.razorpayOrderId = razorpayOrder.id;
  order.paymentStatus = 'PENDING';
  await order.save();

  await Payment.findOneAndUpdate(
    { order: order._id },
    {
      order: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      currency: env.razorpayCurrency,
      status: 'CREATED',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    keyId: env.razorpayKeyId,
    orderId: order._id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  };
}

async function deductInventory(order) {
  const ingredients = INGREDIENTS(order);
  const unique = new Map();
  for (const ingredient of ingredients) unique.set(`${ingredient.category}:${ingredient.itemId}`, ingredient);
  const quantity = order.quantity;
  const updated = [];

  for (const ingredient of unique.values()) {
    const result = await Inventory.findOneAndUpdate(
      { category: ingredient.category, itemId: ingredient.itemId, quantity: { $gte: quantity } },
      { $inc: { quantity: -quantity }, $set: { lowStockAlertSentAt: null } },
      { new: true }
    );
    if (!result) {
      for (const prior of updated) {
        await Inventory.updateOne({ _id: prior._id }, { $inc: { quantity: quantity } });
      }
      throw fail(`Insufficient stock for ${ingredient.name}. Please retry.`, 409);
    }
    updated.push(result);
  }
  return updated;
}

export async function verifyPaymentAndFinalize({
  orderId, userId, razorpayOrderId, razorpayPaymentId, razorpaySignature,
}) {
  const order = await getOrderForUser(orderId, userId);
  if (order.paymentStatus === 'SUCCESS' && order.inventoryDeducted) {
    return { order, alreadyFinalized: true };
  }
  if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
    throw fail('Razorpay order ID does not match this order', 400);
  }
  if (!verifyRazorpaySignature({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
    await Payment.findOneAndUpdate({ order: order._id }, { status: 'FAILED', razorpayPaymentId, razorpaySignature });
    order.paymentStatus = 'FAILED';
    await order.save();
    throw fail('Invalid Razorpay payment signature', 400);
  }

  const lock = await Order.findOneAndUpdate(
    { _id: order._id, user: userId, paymentStatus: { $in: ['PENDING', 'FAILED'] }, inventoryDeducted: false },
    { $set: { paymentStatus: 'PROCESSING', razorpayPaymentId } },
    { new: true }
  );
  if (!lock) {
    const current = await Order.findById(order._id);
    if (current?.paymentStatus === 'SUCCESS' && current.inventoryDeducted) return { order: current, alreadyFinalized: true };
    throw fail('Payment finalization is already being processed. Refresh the order shortly.', 409);
  }

  try {
    await deductInventory(lock);
    lock.paymentStatus = 'SUCCESS';
    lock.inventoryDeducted = true;
    lock.orderStatus = 'ORDER_RECEIVED';
    await lock.save();

    await Payment.findOneAndUpdate(
      { order: lock._id },
      {
        order: lock._id,
        razorpayOrderId: lock.razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        amount: lock.totalAmount,
        currency: env.razorpayCurrency,
        status: 'SUCCESS',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { order: lock, alreadyFinalized: false };
  } catch (error) {
    await Order.updateOne({ _id: lock._id }, { $set: { paymentStatus: 'PENDING' } });
    await Payment.findOneAndUpdate({ order: lock._id }, { status: 'FAILED' });
    throw error;
  }
}
