/**
 * Order API Service
 * Handles order creation, customer order history, and order tracking polling.
 * Connects to /api/orders
 */

import { request, ApiResponse } from './api';
import { BuilderOption } from './productApi';

export interface CustomizationSelection {
  base: string;
  sauce: string;
  cheese: string;
  vegetables: string[];
}

export interface CustomizationDetails {
  base: BuilderOption;
  sauce: BuilderOption;
  cheese: BuilderOption;
  vegetables: BuilderOption[];
}

export interface CreateOrderPayload {
  pizzaId?: string | null;
  customization: CustomizationSelection;
  quantity?: number;
}

export interface BackendOrder {
  _id: string;
  id: string;
  user: string | { _id: string; name: string; email: string };
  pizza?: { _id: string; name: string; image?: string; price: number } | null;
  customization: CustomizationDetails;
  quantity: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  orderStatus: 'ORDER_RECEIVED' | 'IN_KITCHEN' | 'SENT_TO_DELIVERY';
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  inventoryDeducted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderResponseData {
  order: BackendOrder;
}

export interface OrdersListResponseData {
  orders: BackendOrder[];
}

export interface OrderDetailResponseData {
  order: BackendOrder;
}

/**
 * Create a new order validated by backend pricing and availability
 * POST /api/orders
 */
export async function createOrder(payload: CreateOrderPayload): Promise<ApiResponse<CreateOrderResponseData>> {
  return request<CreateOrderResponseData>('/orders', {
    method: 'POST',
    body: {
      pizzaId: payload.pizzaId || null,
      customization: payload.customization,
      quantity: payload.quantity ?? 1,
    },
  });
}

/**
 * Get authenticated user's order history
 * GET /api/orders/my-orders
 */
export async function listMyOrders(): Promise<ApiResponse<OrdersListResponseData>> {
  return request<OrdersListResponseData>('/orders/my-orders', {
    method: 'GET',
  });
}

/**
 * Get specific order details by ID (used for order tracking and polling)
 * GET /api/orders/:id
 */
export async function getMyOrder(id: string): Promise<ApiResponse<OrderDetailResponseData>> {
  return request<OrderDetailResponseData>(`/orders/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}
