// ============================================================
// TYPES & INTERFACES FRONTEND
// ============================================================

export type UserRole = 'customer' | 'admin' | 'staff';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: number;
  email_verified: number;
  last_login_at: string | null;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: number;
  children?: Category[];
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  variant_name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  image_url?: string | null;
  attributes?: Record<string, any>;
  is_active: number;
}

export interface Product {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  slug: string;
  sku: string;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  base_price: number;
  sale_price: number | null;
  stock_quantity: number;
  thumbnail_url: string | null;
  avg_rating: number;
  total_reviews: number;
  total_sold: number;
  is_featured: number;
  discount_percent: number;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: Review[];
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  name: string;
  thumbnail_url: string | null;
  base_price: number;
  sale_price: number | null;
  unit_price: number;
  subtotal: number;
  variant_name: string | null;
  stock_quantity: number;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  total: number;
  itemCount: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentMethod = 'COD' | 'VNPAY' | 'MOMO' | 'BANK_TRANSFER';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  name?: string;
  product_image: string | null;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_code: string;
  user_id: number;
  customer_name?: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  shipping_address: ShippingAddress;
  customer_note: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface ShippingAddress {
  recipient_name: string;
  recipient_phone: string;
  province: string;
  district: string;
  ward: string;
  address_detail: string;
}

export interface UserAddress {
  id: number;
  user_id: number;
  recipient_name: string;
  recipient_phone: string;
  province: string;
  district: string;
  ward: string;
  address_detail: string;
  is_default: number;
}

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  order_id: number | null;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified: number;
  helpful_count: number;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string | null;
  product_name?: string;
  product_image?: string | null;
}

export interface ReviewStats {
  total: number;
  avg_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Admin Types ──────────────────────────────────────────────

export interface DashboardOverview {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  newUsersThisWeek: number;
  todayOrders: number;
}

export interface RevenueDay {
  date: string;
  orders: number;
  revenue: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
}

export interface DashboardData {
  overview: DashboardOverview;
  ordersByStatus: OrdersByStatus[];
  revenueByDay: RevenueDay[];
  topProducts: TopProduct[];
  lowStock: InventoryItem[];
  recentOrders: AdminOrder[];
}

export interface AdminOrder {
  id: number;
  order_code: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  items?: OrderItem[];
  shipping_address?: ShippingAddress;
  customer_note?: string | null;
  admin_note?: string | null;
}

export interface AdminReview {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  is_visible: number;
  is_verified: number;
  helpful_count: number;
  created_at: string;
  reviewer_name: string;
  reviewer_email: string;
  product_name: string;
  product_image: string | null;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  thumbnail_url: string | null;
  base_price: number;
  total_sold: number;
  category_name: string;
}

export interface TopProduct {
  id: number;
  name: string;
  thumbnail_url: string | null;
  total_sold: number;
  avg_rating: number;
  base_price: number;
  sale_price: number | null;
  stock_quantity: number;
  category_name: string;
}

export interface RevenueReportPeriod {
  period: string | number;
  orders: number;
  revenue: number;
  avg_order_value?: number;
}

export interface RevenueReport {
  period: string;
  year: string | number;
  data: RevenueReportPeriod[];
  summary: {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
  };
}

export interface UserStats {
  total: number;
  byRole: { role: string; count: number }[];
  byStatus: { is_active: number; count: number }[];
  newByMonth: { month: number; year: number; count: number }[];
}

export interface ProductFilters {
  category_id?: number;
  brand?: string;
  min_price?: number;
  max_price?: number;
  is_featured?: number;
  search?: string;
  sort_by?: 'base_price' | 'avg_rating' | 'total_sold' | 'created_at';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ── Account & History Types ──────────────────────────────────
export interface OrderStatusHistoryItem {
  id: number;
  order_id: number;
  status: OrderStatus;
  note: string | null;
  changed_by: number | null;
  changed_by_name?: string | null;
  created_at: string;
}

export interface LoginHistoryItem {
  id: number;
  user_id: number | null;
  email: string | null;
  login_at: string;
  logout_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  login_status: 'SUCCESS' | 'FAILED';
  fail_reason: string | null;
}

export interface UserActivityItem {
  id: number;
  user_id: number;
  action_type: string;
  description: string;
  entity_type: string | null;
  entity_id: number | null;
  created_at: string;
}

export interface CartHistoryItem {
  id: number;
  user_id: number;
  cart_id: number | null;
  product_id: number | null;
  product_name: string | null;
  action_type: 'ADD_TO_CART' | 'UPDATE_QUANTITY' | 'REMOVE_FROM_CART' | 'CLEAR_CART';
  quantity: number;
  old_quantity: number;
  thumbnail_url?: string | null;
  created_at: string;
}

