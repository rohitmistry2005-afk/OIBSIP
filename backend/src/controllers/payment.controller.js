import { createRazorpayOrderForUser, verifyPaymentAndFinalize } from '../services/payment.service.js';

export async function createPaymentOrder(req, res) {
  try {
    const { orderId, amount } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }
    const paymentOrder = await createRazorpayOrderForUser({
      orderId,
      userId: req.user._id,
      clientAmount: amount,
    });
    res.status(201).json({ success: true, payment: paymentOrder });
  } catch (error) {
    const status = error.statusCode || 500;
    const responsePayload = {
      success: false,
      message: error.message || 'Failed to create payment order',
    };
    if (error.details) {
      responsePayload.error = {
        code: error.details.code,
        description: error.details.description,
        statusCode: error.details.statusCode,
        source: error.details.source,
        step: error.details.step,
        reason: error.details.reason,
      };
    }
    res.status(status).json(responsePayload);
  }
}

export async function verifyPayment(req, res) {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification fields are required' });
    }
    const result = await verifyPaymentAndFinalize({
      orderId,
      userId: req.user._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });
    res.json({
      success: true,
      alreadyFinalized: result.alreadyFinalized,
      order: { ...result.order.toObject(), id: result.order._id },
    });
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ success: false, message: error.message || 'Payment verification failed' });
  }
}
