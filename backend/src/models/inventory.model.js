import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['base', 'sauce', 'cheese', 'vegetable'],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    threshold: { type: Number, required: true, min: 0, default: 20 },
    unit: { type: String, default: 'units' },
    lowStockAlertSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Inventory = mongoose.model('Inventory', inventorySchema);
