import { Order } from '../models/order.model.js';
import { createOrderForUser } from '../services/order.service.js';

function serializeOrder(order) {
  const plain = order.toObject ? order.toObject() : order;
  return {
    ...plain,
    id: plain._id,
  };
}

export async function createOrder(req, res) {
  const { pizzaId = null, customization, quantity = 1 } = req.body;
  const order = await createOrderForUser({
    userId: req.user._id,
    pizzaId,
    customizationSelection: customization,
    quantity,
  });

  res.status(201).json({ success: true, order: serializeOrder(order) });
}

export async function listMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id })
    .populate('pizza', 'name image price')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    orders: orders.map((order) => ({ ...order, id: order._id })),
  });
}

export async function getMyOrder(req, res) {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    .populate('pizza', 'name image price')
    .lean();

  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order: { ...order, id: order._id } });
}
