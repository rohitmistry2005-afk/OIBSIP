import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    status: { type: String, enum: ['CREATED', 'SUCCESS', 'FAILED'], default: 'CREATED' },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
