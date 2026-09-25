import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { Inventory } from '../models/inventory.model.js';

const STATUS_TRANSITIONS = {
  ORDER_RECEIVED: 'IN_KITCHEN',
  IN_KITCHEN: 'SENT_TO_DELIVERY',
  SENT_TO_DELIVERY: null,
};

export function getNextOrderStatus(status) {
  return STATUS_TRANSITIONS[status] ?? null;
}

export async function listAdminOrders() {
  return Order.find()
    .populate('user', 'name email')
    .populate('pizza', 'name price')
    .sort({ createdAt: -1 });
}

export async function getAdminOrderById(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid order id');
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(id)
    .populate('user', 'name email')
    .populate('pizza', 'name price');

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }
  return order;
}

export async function updateOrderStatus(id, requestedStatus) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid order id');
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(id);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const nextStatus = getNextOrderStatus(order.orderStatus);
  if (!nextStatus || requestedStatus !== nextStatus) {
    const error = new Error(`Invalid status transition from ${order.orderStatus} to ${requestedStatus}`);
    error.statusCode = 400;
    throw error;
  }

  order.orderStatus = requestedStatus;
  await order.save();

  return getAdminOrderById(order._id.toString());
}

export async function listInventory() {
  return Inventory.find().sort({ category: 1, name: 1 });
}

export async function updateInventoryItem(id, { quantity, threshold }) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid inventory item id');
    error.statusCode = 400;
    throw error;
  }

  const inventory = await Inventory.findById(id);
  if (!inventory) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }

  if (quantity !== undefined) {
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      const error = new Error('Quantity must be a non-negative integer');
      error.statusCode = 400;
      throw error;
    }
    inventory.quantity = parsedQuantity;
  }

  if (threshold !== undefined) {
    const parsedThreshold = Number(threshold);
    if (!Number.isInteger(parsedThreshold) || parsedThreshold < 0) {
      const error = new Error('Threshold must be a non-negative integer');
      error.statusCode = 400;
      throw error;
    }
    inventory.threshold = parsedThreshold;
  }

  // Restoring stock above the threshold clears the Phase 6 notification state.
  if (inventory.quantity >= inventory.threshold) {
    inventory.lowStockAlertSentAt = null;
  }

  await inventory.save();
  return inventory;
}
