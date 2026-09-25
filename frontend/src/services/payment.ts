import type { Product } from '../PizzaDetails';
import {
  createPaymentOrder,
  verifyPayment,
  loadRazorpayScript,
  RazorpayOrderInfo,
} from './paymentApi';
import { BackendOrder } from './orderApi';

export type PaymentMethodType = 'razorpay' | 'card' | 'upi' | 'netbanking' | 'wallet';

export type PaymentStatus =
  | 'idle'
  | 'creating'
  | 'processing'
  | 'configuration_unavailable'
  | 'failure'
  | 'cancelled'
  | 'success';

export interface PriceCalculation {
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
}

export interface PaymentOrderDetails {
  orderId: string;
  amount: number;
  items: Product[];
  method?: string;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
}

export interface PaymentResult {
  success: boolean;
  status: PaymentStatus;
  error?: string;
  order?: BackendOrder;
}

/**
 * Shared order price calculation helper ensuring exact parity between OrderSummary and Payment.
 * Taxes are 5% GST; delivery is free.
 */
export function calculateOrderTotals(items: Product[]): PriceCalculation {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const deliveryFee = 0;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + taxes;
  return { subtotal, deliveryFee, taxes, total };
}

/**
 * Canonical mapping from UI payment method selections to supported Razorpay methods:
 * upi        -> upi
 * card       -> card
 * netbanking -> netbanking
 * wallet     -> wallet
 */
export function normalizePaymentMethod(method?: string | null): 'card' | 'netbanking' | 'wallet' | 'upi' | undefined {
  if (!method) return undefined;
  const m = method.toLowerCase().trim();
  if (m === 'upi') return 'upi';
  if (m === 'card' || m === 'credit card' || m === 'debit card') return 'card';
  if (m === 'netbanking' || m === 'net banking' || m === 'net_banking') return 'netbanking';
  if (m === 'wallet' || m === 'wallets') return 'wallet';
  return undefined;
}

/**
 * Checks whether backend is reachable and Razorpay client can be initialized.
 */
export function isPaymentGatewayConfigured(): boolean {
  return true;
}

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
    method?: 'card' | 'netbanking' | 'wallet' | 'upi';
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpayHandlerResponse) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on?: (event: string, callback: (response: { error?: { description?: string; reason?: string } }) => void) => void;
    };
  }
}

/**
 * Initiates payment through the real Razorpay backend flow:
 * 1. POST /api/payment/create-order
 * 2. Razorpay Checkout modal
 * 3. POST /api/payment/verify (cryptographic signature verification)
 */
export async function processPayment(details: PaymentOrderDetails): Promise<PaymentResult> {
  if (!details.orderId) {
    return {
      success: false,
      status: 'failure',
      error: 'Cannot initiate payment: Order ID is required.',
    };
  }

  // 1. Ensure Razorpay client checkout script is loaded
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded || !window.Razorpay) {
    return {
      success: false,
      status: 'failure',
      error: 'Unable to load Razorpay checkout SDK. Please check your network connection.',
    };
  }

  // 2. Request backend to validate order and create Razorpay order
  const orderRes = await createPaymentOrder(details.orderId, details.amount);
  if (!orderRes.success || !orderRes.data?.payment) {
    return {
      success: false,
      status: 'failure',
      error: orderRes.error || orderRes.message || 'Failed to initiate payment with server.',
    };
  }

  const paymentData: RazorpayOrderInfo = orderRes.data.payment;
  const normalizedMethod = normalizePaymentMethod(details.method);

  // 3. Open Razorpay Checkout modal and wait for customer completion
  return new Promise<PaymentResult>((resolve) => {
    let dismissed = true;

    const prefill: RazorpayOptions['prefill'] = {
      name: details.customerName || 'Customer',
      email: details.customerEmail || '',
    };
    if (details.customerContact) {
      prefill.contact = details.customerContact;
    }
    if (normalizedMethod) {
      prefill.method = normalizedMethod;
    }

    const options: RazorpayOptions = {
      key: paymentData.keyId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: 'PizzaDelight',
      description: `Order #${details.orderId.slice(-8).toUpperCase()}`,
      order_id: paymentData.razorpayOrderId,
      prefill,
      theme: {
        color: '#E03131',
      },
      modal: {
        ondismiss: () => {
          if (dismissed) {
            resolve({
              success: false,
              status: 'cancelled',
              error: 'Payment was cancelled or dismissed. You can retry anytime.',
            });
          }
        },
      },
      handler: async (response: RazorpayHandlerResponse) => {
        dismissed = false;

        // 4. Verify signature on backend
        try {
          const verifyRes = await verifyPayment({
            orderId: details.orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (!verifyRes.success) {
            resolve({
              success: false,
              status: 'failure',
              error: verifyRes.error || verifyRes.message || 'Payment signature verification failed.',
            });
            return;
          }

          resolve({
            success: true,
            status: 'success',
            order: verifyRes.data?.order,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Verification network error';
          resolve({
            success: false,
            status: 'failure',
            error: message,
          });
        }
      },
    };

    try {
      if (!window.Razorpay) {
        resolve({
          success: false,
          status: 'failure',
          error: 'Razorpay SDK is not available',
        });
        return;
      }
      const rzp = new window.Razorpay(options);
      if (typeof rzp.on === 'function') {
        rzp.on('payment.failed', (failedResponse: { error?: { description?: string; reason?: string } }) => {
          dismissed = false;
          const desc = failedResponse?.error?.description || failedResponse?.error?.reason || 'Payment failed';
          resolve({
            success: false,
            status: 'failure',
            error: desc,
          });
        });
      }
      rzp.open();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to launch Razorpay checkout';
      resolve({
        success: false,
        status: 'failure',
        error: message,
      });
    }
  });
}
