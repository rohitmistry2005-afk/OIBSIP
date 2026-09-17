import type { Product } from '../PizzaDetails';

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
  customerName?: string;
  customerEmail?: string;
}

export interface PaymentResult {
  success: boolean;
  status: PaymentStatus;
  error?: string;
}

/**
 * Shared order price calculation helper ensuring exact parity between OrderSummary and Payment.
 * Taxes are 5% GST; delivery is consistent with OrderSummary.
 */
export function calculateOrderTotals(items: Product[]): PriceCalculation {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const deliveryFee = 0; // Matches OrderSummary's FREE delivery
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + taxes;
  return { subtotal, deliveryFee, taxes, total };
}

/**
 * Checks whether a genuine backend payment service and client Razorpay SDK are available.
 * Does not treat VITE_RAZORPAY_KEY_ID alone as proof of a working integration.
 */
export function isPaymentGatewayConfigured(): boolean {
  const hasKey = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
  const hasBackend = Boolean(import.meta.env.VITE_PAYMENT_API_URL);
  const hasSdk = typeof window !== 'undefined' && 'Razorpay' in window;
  return hasKey && hasBackend && hasSdk;
}

/**
 * Initiates payment through the configured payment gateway.
 * If backend payment-order creation or Razorpay integration is missing,
 * returns configuration_unavailable without faking or simulating payment success.
 */
export async function processPayment(details: PaymentOrderDetails): Promise<PaymentResult> {
  if (!isPaymentGatewayConfigured()) {
    // Artificial brief delay so loading indicator communicates interaction
    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      success: false,
      status: 'configuration_unavailable',
      error:
        'Razorpay payment gateway is not configured. Live checkout requires backend order generation and verified gateway credentials.',
    };
  }

  try {
    // Future integration boundary:
    // 1. Call backend to create Razorpay order
    // 2. Open Razorpay checkout with response order_id
    // 3. Verify signature on backend
    return {
      success: false,
      status: 'configuration_unavailable',
      error: `Payment initialization for order ${details.orderId} requires backend integration.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during payment processing.';
    return {
      success: false,
      status: 'failure',
      error: message,
    };
  }
}
