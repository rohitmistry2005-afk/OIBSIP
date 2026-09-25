/**
 * Product & Builder API Service
 * Connects to /api/pizzas and /api/builder/options
 */

import { request, ApiResponse } from './api';

export interface BackendPizza {
  _id: string;
  id?: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BuilderOption {
  id: string;
  name: string;
  price: number;
}

export interface BuilderOptionsData {
  bases: BuilderOption[];
  sauces: BuilderOption[];
  cheeses: BuilderOption[];
  vegetables: BuilderOption[];
}

export interface PizzasResponseData {
  pizzas: BackendPizza[];
}

export interface PizzaResponseData {
  pizza: BackendPizza;
}

export interface BuilderOptionsResponseData {
  options: BuilderOptionsData;
}

/**
 * Fetch all available pizzas from backend catalogue
 * GET /api/pizzas
 */
export async function listPizzas(): Promise<ApiResponse<PizzasResponseData>> {
  return request<PizzasResponseData>('/pizzas', {
    method: 'GET',
  });
}

/**
 * Fetch single pizza details by ID
 * GET /api/pizzas/:id
 */
export async function getPizza(id: string): Promise<ApiResponse<PizzaResponseData>> {
  return request<PizzaResponseData>(`/pizzas/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}

/**
 * Fetch pizza builder options (bases, sauces, cheeses, vegetables)
 * GET /api/builder/options
 */
export async function getBuilderOptions(): Promise<ApiResponse<BuilderOptionsResponseData>> {
  return request<BuilderOptionsResponseData>('/builder/options', {
    method: 'GET',
  });
}
