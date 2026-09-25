/**
 * Admin API Service
 * Handles admin authentication, operational order management, and inventory control.
 * Connects to /api/admin
 */

import { request, setAdminToken, removeAdminToken, getAdminToken, ApiResponse } from './api';
import { BackendOrder } from './orderApi';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginResponseData {
  token: string;
  admin: AdminUser;
}

export interface BackendInventoryItem {
  _id: string;
  itemId: string;
  name: string;
  category: 'base' | 'sauce' | 'cheese' | 'vegetable';
  quantity: number;
  threshold: number;
  unit: string;
  lowStockAlertSentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminOrdersResponseData {
  orders: BackendOrder[];
}

export interface AdminOrderDetailResponseData {
  order: BackendOrder;
  nextStatus: string | null;
}

export interface UpdateStatusResponseData {
  order: BackendOrder;
  nextStatus: string | null;
  message: string;
}

export interface AdminInventoryResponseData {
  inventory: BackendInventoryItem[];
}

export interface UpdateInventoryResponseData {
  inventory: BackendInventoryItem;
  message: string;
}

const ADMIN_DATA_KEY = 'pizzadelight_admin_data';

export function getStoredAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAdmin(admin: AdminUser): void {
  try {
    localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(admin));
  } catch {
    // ignore
  }
}

export function removeStoredAdmin(): void {
  try {
    localStorage.removeItem(ADMIN_DATA_KEY);
  } catch {
    // ignore
  }
}

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminToken());
}

/**
 * Log in to administrator portal
 * POST /api/admin/auth/login
 */
export async function loginAdmin(payload: AdminLoginPayload): Promise<ApiResponse<AdminLoginResponseData>> {
  const res = await request<AdminLoginResponseData>('/admin/auth/login', {
    method: 'POST',
    body: payload,
  });

  if (res.success && res.data?.token) {
    setAdminToken(res.data.token);
    if (res.data.admin) {
      setStoredAdmin(res.data.admin);
    }
  }

  return res;
}

/**
 * Fetch all incoming customer orders for admin overview
 * GET /api/admin/orders
 */
export async function getAdminOrders(): Promise<ApiResponse<AdminOrdersResponseData>> {
  return request<AdminOrdersResponseData>('/admin/orders', {
    method: 'GET',
    useAdminAuth: true,
  });
}

/**
 * Fetch single order detail with next valid status transition
 * GET /api/admin/orders/:id
 */
export async function getAdminOrder(id: string): Promise<ApiResponse<AdminOrderDetailResponseData>> {
  return request<AdminOrderDetailResponseData>(`/admin/orders/${encodeURIComponent(id)}`, {
    method: 'GET',
    useAdminAuth: true,
  });
}

/**
 * Update order status along valid state progression
 * (ORDER_RECEIVED -> IN_KITCHEN -> SENT_TO_DELIVERY)
 * PATCH /api/admin/orders/:id/status
 */
export async function updateOrderStatus(
  id: string,
  status: string
): Promise<ApiResponse<UpdateStatusResponseData>> {
  return request<UpdateStatusResponseData>(`/admin/orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
    useAdminAuth: true,
  });
}

/**
 * Fetch all tracked inventory items with current stocks and threshold alerts
 * GET /api/admin/inventory
 */
export async function getAdminInventory(): Promise<ApiResponse<AdminInventoryResponseData>> {
  return request<AdminInventoryResponseData>('/admin/inventory', {
    method: 'GET',
    useAdminAuth: true,
  });
}

/**
 * Update inventory quantity or alert threshold
 * PATCH /api/admin/inventory/:id
 */
export async function updateInventoryItem(
  id: string,
  update: { quantity?: number; threshold?: number }
): Promise<ApiResponse<UpdateInventoryResponseData>> {
  return request<UpdateInventoryResponseData>(`/admin/inventory/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: update,
    useAdminAuth: true,
  });
}

/**
 * Log out admin session
 */
export function logoutAdmin(): void {
  removeAdminToken();
  removeStoredAdmin();
}
