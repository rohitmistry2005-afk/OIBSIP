import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { BUILDER_OPTIONS } from '../src/config/product-options.js';
import { Inventory } from '../src/models/inventory.model.js';

const groups = [
  ['base', 'bases'],
  ['sauce', 'sauces'],
  ['cheese', 'cheeses'],
  ['vegetable', 'vegetables'],
];

async function seed() {
  if (!env.mongoUri) throw new Error('MONGO_URI is required');
  await mongoose.connect(env.mongoUri);
  for (const [category, key] of groups) {
    for (const option of BUILDER_OPTIONS[key]) {
      await Inventory.findOneAndUpdate(
        { itemId: option.id },
        {
          $set: { name: option.name, category },
          $setOnInsert: { quantity: 100, threshold: 20, unit: 'units', lowStockAlertSentAt: null },
        },
        { upsert: true, new: true }
      );
    }
  }
  console.log('Inventory seed complete.');
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
