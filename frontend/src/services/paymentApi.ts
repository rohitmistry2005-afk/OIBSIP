/**
 * Payment API Service
 * Coordinates server-side Razorpay order generation and cryptographic payment verification.
 * Connects to /api/payment
 */

import { request, ApiResponse } from './api';
import { BackendOrder } from './orderApi';

export interface RazorpayOrderInfo {
  keyId: string;
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

export interface CreatePaymentOrderResponseData {
  payment: RazorpayOrderInfo;
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponseData {
  alreadyFinalized?: boolean;
  order: BackendOrder;
}

/**
 * Request server to generate a real Razorpay test order
 * POST /api/payment/create-order
 */
export async function createPaymentOrder(orderId: string, amount?: number): Promise<ApiResponse<CreatePaymentOrderResponseData>> {
  return request<CreatePaymentOrderResponseData>('/payment/create-order', {
    method: 'POST',
    body: { orderId, amount },
  });
}

/**
 * Verify Razorpay payment signature on backend and confirm order
 * POST /api/payment/verify
 */
export async function verifyPayment(payload: VerifyPaymentPayload): Promise<ApiResponse<VerifyPaymentResponseData>> {
  return request<VerifyPaymentResponseData>('/payment/verify', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Dynamically loads the Razorpay checkout script if not already present on window
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
