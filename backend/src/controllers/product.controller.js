import { Pizza } from '../models/pizza.model.js';
import { getBuilderOptions } from '../services/order.service.js';

export async function listPizzas(req, res) {
  const pizzas = await Pizza.find({ available: true }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, pizzas });
}

export async function getPizza(req, res) {
  const pizza = await Pizza.findOne({ _id: req.params.id, available: true }).lean();
  if (!pizza) return res.status(404).json({ success: false, message: 'Pizza not found' });
  res.json({ success: true, pizza });
}

export function getBuilderOptionsController(req, res) {
  res.json({ success: true, options: getBuilderOptions() });
}
