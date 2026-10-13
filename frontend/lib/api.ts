import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Types ─────────────────────────────────────
export type Unit = 'ml' | 'gr' | 'count';

export interface Ingredient {
  id: number;
  name: string;
  unit: Unit;
  initial_stock: string;
  current_stock: string;
  min_stock: string;
}

export interface RecipeItem {
  id: number;
  ingredient: number;
  ingredient_name: string;
  unit: Unit;
  amount: string;
}

export interface Product {
  id: number;
  name: string;
  price: string;
  is_active: boolean;
  recipe_items: RecipeItem[];
}

export interface StockEntry {
  id: number;
  ingredient: number;
  ingredient_name: string;
  amount: string;
  date: string;
  note: string;
  created_at: string;
}

export interface Sale {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: number;
  date: string;
  created_at: string;
}

export interface ReportItem {
  ingredient_id: number;
  name: string;
  unit: Unit;
  opening: number;
  entered: number;
  used: number;
  remaining: number;
  below_min: boolean;
}

export interface DailyReport {
  date: string;
  items: ReportItem[];
}

// ─── API functions ─────────────────────────────
export const getIngredients = () =>
  api.get<Ingredient[]>('/ingredients/').then(r => r.data);

export const getProducts = () =>
  api.get<Product[]>('/products/').then(r => r.data);

export const getSales = () =>
  api.get<Sale[]>('/sales/').then(r => r.data);

export const getStockEntries = () =>
  api.get<StockEntry[]>('/stock-entries/').then(r => r.data);

export const getDailyReport = (date?: string) =>
  api
    .get<DailyReport>(`/reports/daily/${date ? `?date=${date}` : ''}`)
    .then(r => r.data);

export const createSale = (data: {
  product_id: number;
  quantity: number;
  date?: string;
}) => api.post<Sale>('/sales/', data).then(r => r.data);

export const createStockEntry = (data: {
  ingredient_id: number;
  amount: number;
  date?: string;
  note?: string;
}) => api.post<StockEntry>('/stock-entries/', data).then(r => r.data);