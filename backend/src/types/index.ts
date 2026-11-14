// ============================================================
// TYPES & INTERFACES CHUNG
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export interface PaginationQuery {
  page?:  string;
  limit?: string;
}

// ── Users ────────────────────────────────────────────────────
export type UserRole = 'customer' | 'admin' | 'staff';

export interface User {
  id:             number;
  email:          string;
  password_hash:  string;
  full_name:      string;
  phone:          string | null;
  avatar_url:     string | null;
  role:           UserRole;
  is_active:      number;
  email_verified: number;
  refresh_token:  string | null;
  last_login_at:  Date | null;
  created_at:     Date;
  updated_at:     Date;
}

export interface UserPublic extends Omit<User, 'password_hash' | 'refresh_token'> {}

export interface JwtPayload {
  userId: number;
  email:  string;
  role:   UserRole;
  iat?:   number;
  exp?:   number;
}

// ── Categories ───────────────────────────────────────────────
export interface Category {
  id:          number;
  parent_id:   number | null;
  name:        string;
  slug:        string;
  description: string | null;
  image_url:   string | null;
  sort_order:  number;
  is_active:   number;
  created_at:  Date;
  updated_at:  Date;
}

// ── Products ─────────────────────────────────────────────────
export interface Product {
  id:                number;
  category_id:       number;
  name:              string;
  slug:              string;
  sku:               string;
  brand:             string | null;
  short_description: string | null;
  description:       string | null;
  specifications:    Record<string, unknown> | null;
  tags:              string[] | null;
  base_price:        number;
  sale_price:        number | null;
  stock_quantity:    number;
  thumbnail_url:     string | null;
  avg_rating:        number;
  total_reviews:     number;
  total_sold:        number;
  is_active:         number;
  is_featured:       number;
  created_at:        Date;
  updated_at:        Date;
}

// ── Cart ─────────────────────────────────────────────────────
export interface Cart {
  id:         number;
  user_id:    number;
  created_at: Date;
  updated_at: Date;
}

export interface CartItem {
  id:         number;
  cart_id:    number;
  product_id: number;
  variant_id: number | null;
  quantity:   number;
  added_at:   Date;
  updated_at: Date;
}

// ── Orders ───────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentMethod = 'COD' | 'VNPAY' | 'MOMO' | 'BANK_TRANSFER';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id:               number;
  order_code:       string;
  user_id:          number;
  status:           OrderStatus;
  subtotal:         number;
  discount_amount:  number;
  shipping_fee:     number;
  total_amount:     number;
  coupon_id:        number | null;
  payment_method:   PaymentMethod;
  payment_status:   PaymentStatus;
  shipping_address: Record<string, string>;
  customer_note:    string | null;
  admin_note:       string | null;
  created_at:       Date;
  updated_at:       Date;
}

// ── Reviews ──────────────────────────────────────────────────
export interface Review {
  id:            number;
  user_id:       number;
  product_id:    number;
  order_id:      number | null;
  rating:        number;
  title:         string | null;
  comment:       string | null;
  images:        string[] | null;
  is_verified:   number;
  helpful_count: number;
  is_visible:    number;
  created_at:    Date;
  updated_at:    Date;
}

// ── User Behaviors ───────────────────────────────────────────
export type BehaviorAction =
  | 'view' | 'click' | 'add_to_cart' | 'remove_from_cart'
  | 'purchase' | 'wishlist' | 'review' | 'search';

export interface UserBehavior {
  id:          number;
  user_id:     number | null;
  session_id:  string;
  product_id:  number;
  action_type: BehaviorAction;
  duration:    number | null;
  source:      string | null;
  metadata:    Record<string, unknown> | null;
  created_at:  Date;
}
