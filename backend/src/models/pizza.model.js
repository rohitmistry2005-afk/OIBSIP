import mongoose from 'mongoose';

const pizzaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

pizzaSchema.index({ available: 1, createdAt: -1 });

export const Pizza = mongoose.model('Pizza', pizzaSchema);
