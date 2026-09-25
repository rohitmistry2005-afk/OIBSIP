import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { Pizza } from '../models/pizza.model.js';
import { BUILDER_OPTIONS, findOption } from '../config/product-options.js';

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getBuilderOptions() {
  return BUILDER_OPTIONS;
}

export function validateAndPriceCustomization(selection) {
  const { base, sauce, cheese, vegetables = [] } = selection ?? {};
  const baseOption = findOption('bases', base);
  const sauceOption = findOption('sauces', sauce);
  const cheeseOption = findOption('cheeses', cheese);

  if (!baseOption || !sauceOption || !cheeseOption) {
    const error = new Error('A valid base, sauce, and cheese selection is required');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(vegetables) || vegetables.length > 6) {
    const error = new Error('Vegetables must be an array with at most 6 selections');
    error.statusCode = 400;
    throw error;
  }

  const uniqueVegetables = [...new Set(vegetables)];
  const vegetableOptions = uniqueVegetables.map((id) => findOption('vegetables', id));
  if (vegetableOptions.some((option) => !option)) {
    const error = new Error('One or more vegetable selections are invalid');
    error.statusCode = 400;
    throw error;
  }

  const customization = {
    base: baseOption,
    sauce: sauceOption,
    cheese: cheeseOption,
    vegetables: vegetableOptions,
  };

  const unitPrice = roundMoney(
    baseOption.price +
      sauceOption.price +
      cheeseOption.price +
      vegetableOptions.reduce((sum, option) => sum + option.price, 0)
  );

  return { customization, unitPrice };
}

export function calculateOrderPricing({ pizza, unitPrice, quantity = 1 }) {
  const parsedQuantity = Number(quantity);
  const pizzaPrice = pizza?.price ?? 0;
  const finalUnitPrice = pizza ? pizzaPrice : unitPrice;
  const subtotal = roundMoney(finalUnitPrice * parsedQuantity);
  const tax = Math.round(subtotal * 0.05);
  const totalAmount = roundMoney(subtotal + tax);
  return { finalUnitPrice, subtotal, tax, totalAmount };
}

export async function createOrderForUser({ userId, pizzaId, customizationSelection, quantity }) {
  const parsedQuantity = Number(quantity);
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 20) {
    const error = new Error('Quantity must be an integer between 1 and 20');
    error.statusCode = 400;
    throw error;
  }

  let pizza = null;
  if (pizzaId) {
    if (!mongoose.isValidObjectId(pizzaId)) {
      const error = new Error('Invalid pizza id');
      error.statusCode = 400;
      throw error;
    }
    pizza = await Pizza.findOne({ _id: pizzaId, available: true });
    if (!pizza) {
      const error = new Error('Selected pizza is not available');
      error.statusCode = 400;
      throw error;
    }
  }

  const { customization, unitPrice } = validateAndPriceCustomization(customizationSelection);
  const { totalAmount } = calculateOrderPricing({ pizza, unitPrice, quantity: parsedQuantity });

  return Order.create({
    user: userId,
    pizza: pizza?._id ?? null,
    customization,
    quantity: parsedQuantity,
    totalAmount,
    paymentStatus: 'PENDING',
    orderStatus: 'ORDER_RECEIVED',
  });
}
