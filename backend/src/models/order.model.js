import mongoose from 'mongoose';

const customizationSchema = new mongoose.Schema(
  {
    base: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
    },
    sauce: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
    },
    cheese: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
    },
    vegetables: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pizza: { type: mongoose.Schema.Types.ObjectId, ref: 'Pizza', default: null },
    customization: { type: customizationSchema, required: true },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    orderStatus: {
      type: String,
      enum: ['ORDER_RECEIVED', 'IN_KITCHEN', 'SENT_TO_DELIVERY'],
      default: 'ORDER_RECEIVED',
    },
    razorpayOrderId: { type: String, default: null, index: true },
    razorpayPaymentId: { type: String, default: null },
    inventoryDeducted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
