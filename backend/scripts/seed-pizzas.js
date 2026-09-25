import 'dotenv/config';
import mongoose from 'mongoose';
import { Pizza } from '../src/models/pizza.model.js';
import { env } from '../src/config/env.js';

const pizzas = [
  { name: 'Margherita', description: 'Classic tomato, mozzarella and basil.', price: 249 },
  { name: 'Farmhouse', description: 'Capsicum, onion, mushroom and sweet corn.', price: 329 },
  { name: 'Spicy Veggie', description: 'Jalapeño, capsicum, onion and spicy sauce.', price: 349 },
  { name: 'Cheese Burst', description: 'Extra cheesy comfort with a rich cheese finish.', price: 379 },
  { name: 'Garden Special', description: 'A colorful mix of fresh vegetables and olives.', price: 359 },
];

await mongoose.connect(env.mongoUri);
await Pizza.deleteMany({});
await Pizza.insertMany(pizzas);
console.log(`Seeded ${pizzas.length} pizzas.`);
await mongoose.disconnect();
