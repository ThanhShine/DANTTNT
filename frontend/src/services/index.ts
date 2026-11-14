import api from './api';
import {
  ApiResponse, User, PaginationMeta, DashboardData, RevenueReport, UserStats,
  LoginHistoryItem, UserActivityItem, CartHistoryItem, OrderStatusHistoryItem, Order
} from '../types';

// ── Auth
export const authService = {
  register: (data: { email: string; password: string; full_name: string; phone?: string }) =>
    api.post<ApiResponse<{ id: number; email: string }>>('/auth/register', data),

  login: (email: string, password: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>>('/auth/login', { email, password }),

  logout: () => api.post<ApiResponse>('/auth/logout'),

  getProfile: () => api.get<ApiResponse<User & { addresses: unknown[] }>>('/auth/profile'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<ApiResponse>('/auth/change-password', { currentPassword, newPassword }),

  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<null>>('/auth/forgot-password', { email }),

  resetPassword: (data: { email: string; otp: string; new_password: string }) =>
    api.post<ApiResponse<null>>('/auth/reset-password', data),
};

// ── Account
export const accountService = {
  getLoginHistory: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<LoginHistoryItem[]> & { meta?: PaginationMeta }>('/account/login-history', { params }),

  getActivity: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<UserActivityItem[]> & { meta?: PaginationMeta }>('/account/activity', { params }),

  getCartHistory: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<CartHistoryItem[]> & { meta?: PaginationMeta }>('/cart/history', { params }),
};

// ── Categories
export const categoryService = {
  getAll: (tree?: boolean) =>
    api.get<ApiResponse<unknown[]>>(`/categories${tree ? '?tree=1' : ''}`),

  getById: (id: number) =>
    api.get<ApiResponse<unknown>>(`/categories/${id}`),
};

// ── Products
export const productService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown[]> & { meta?: PaginationMeta }>('/products', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<unknown>>(`/products/${id}`),

  search: (q: string) =>
    api.get<ApiResponse<unknown[]>>(`/products/search`, { params: { q } }),
};

// ── Cart
export const cartService = {
  get: () => api.get<ApiResponse<unknown>>('/cart'),

  addItem: (product_id: number, quantity: number, variant_id?: number) =>
    api.post<ApiResponse>('/cart/items', { product_id, quantity, variant_id }),

  sync: (items: Array<{ product_id: number; variant_id?: number; quantity: number }>) =>
    api.post<ApiResponse<unknown>>('/cart/sync', { items }),


  updateItem: (itemId: number, quantity: number) =>
    api.put<ApiResponse>(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: number) =>
    api.delete<ApiResponse>(`/cart/items/${itemId}`),

  clear: () => api.delete<ApiResponse>('/cart'),

  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<CartHistoryItem[]> & { meta?: PaginationMeta }>('/cart/history', { params }),
};

// ── Orders
export const orderService = {
  create: (data: { address_id: number; payment_method: string; coupon_code?: string; customer_note?: string }) =>
    api.post<ApiResponse<Order>>('/orders', data),

  getMyOrders: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<Order[]>>('/orders', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Order>>(`/orders/${id}`),

  getOrderHistory: (id: number) =>
    api.get<ApiResponse<OrderStatusHistoryItem[]>>(`/orders/${id}/history`),

  cancel: (id: number, cancel_reason?: string) =>
    api.put<ApiResponse>(`/orders/${id}/cancel`, { cancel_reason }),
};

// ── Reviews
export const reviewService = {
  getByProduct: (productId: number, params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>(`/reviews/product/${productId}`, { params }),

  create: (data: { product_id: number; order_id?: number; rating: number; title?: string; comment?: string }) =>
    api.post<ApiResponse<unknown>>('/reviews', data),

  getMyReviews: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown[]>>('/reviews/my', { params }),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/reviews/${id}`),
};

// ── User
export const userService = {
  update: (id: number, data: { full_name: string; phone?: string; avatar_url?: string }) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),

  addAddress: (data: {
    recipient_name: string; recipient_phone: string;
    province: string; district: string; ward: string;
    address_detail: string; is_default?: boolean;
  }) => api.post<ApiResponse<unknown>>('/users/addresses', data),

  deleteAddress: (addressId: number) =>
    api.delete<ApiResponse>(`/users/addresses/${addressId}`),
};

// ── Behaviors
export const behaviorService = {
  log: (product_id: number, action_type: string, sessionId?: string, duration?: number) =>
    api.post<ApiResponse>('/behaviors', {
      product_id, action_type,
      session_id: sessionId || localStorage.getItem('sessionId'),
      duration,
    }).catch(() => {}), // bỏ qua lỗi — không block UI
};

// ── Admin
export const adminService = {
  getDashboard: () =>
    api.get<ApiResponse<DashboardData>>('/admin/dashboard'),

  getRevenueReport: (params: { period?: string; year?: number }) =>
    api.get<ApiResponse<RevenueReport>>('/admin/reports/revenue', { params }),

  getOrders: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown[]> & { meta?: PaginationMeta }>('/admin/orders', { params }),

  updateOrderStatus: (id: number, data: { status?: string; payment_status?: string; admin_note?: string }) =>
    api.put<ApiResponse<unknown>>(`/admin/orders/${id}/status`, data),

  getOrderDetail: (id: number) =>
    api.get<ApiResponse<unknown>>(`/orders/${id}`),

  getReviews: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown[]>>('/admin/reviews', { params }),

  toggleReviewVisibility: (id: number) =>
    api.put<ApiResponse<unknown>>(`/admin/reviews/${id}/visibility`),

  deleteReview: (id: number) =>
    api.delete<ApiResponse>(`/admin/reviews/${id}`),

  getTopProducts: (limit?: number) =>
    api.get<ApiResponse<unknown[]>>('/admin/stats/top-products', { params: { limit } }),

  getUserStats: () =>
    api.get<ApiResponse<UserStats>>('/admin/stats/users'),

  getInventory: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown[]>>('/admin/inventory', { params }),

  updateInventory: (id: number, stock_quantity: number) =>
    api.put<ApiResponse<unknown>>(`/admin/inventory/${id}`, { stock_quantity }),

  getUsers: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<User[]>>('/admin/users', { params }),

  toggleUserStatus: (id: number) =>
    api.put<ApiResponse<unknown>>(`/admin/users/${id}/status`),

  deleteUser: (id: number) =>
    api.delete<ApiResponse>(`/admin/users/${id}`),

  getUserActivity: (id: number, params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown[]>>(`/account/admin/users/${id}/activity`, { params }),

  getUserCartHistory: (id: number, params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown[]>>(`/account/admin/users/${id}/cart-history`, { params }),

  getUserLoginHistory: (id: number, params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown[]>>(`/account/admin/users/${id}/login-history`, { params }),

  getUserChatHistory: (id: number, params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown[]>>(`/account/admin/users/${id}/chat-history`, { params }),

  getCategories: () =>
    api.get<ApiResponse<unknown[]>>('/categories'),

  createCategory: (data: { name: string; description?: string; parent_id?: number | null; image_url?: string; sort_order?: number }) =>
    api.post<ApiResponse<unknown>>('/categories', data),

  updateCategory: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<unknown>>(`/categories/${id}`, data),

  deleteCategory: (id: number) =>
    api.delete<ApiResponse>(`/categories/${id}`),

  getProducts: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown[]>>('/products', { params }),

  createProduct: (data: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>('/products', data),

  updateProduct: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<unknown>>(`/products/${id}`, data),

  deleteProduct: (id: number) =>
    api.delete<ApiResponse>(`/products/${id}`),

  // Product Variants
  addVariant: (productId: number, data: { sku: string; variant_name: string; price?: number | null; stock_quantity?: number; attributes?: Record<string, string>; image_url?: string }) =>
    api.post<ApiResponse<any>>(`/products/${productId}/variants`, data),

  updateVariant: (productId: number, variantId: number, data: { sku?: string; variant_name?: string; price?: number | null; stock_quantity?: number; attributes?: Record<string, string>; image_url?: string; is_active?: boolean }) =>
    api.put<ApiResponse<any>>(`/products/${productId}/variants/${variantId}`, data),

  deleteVariant: (productId: number, variantId: number) =>
    api.delete<ApiResponse<any>>(`/products/${productId}/variants/${variantId}`),

  // Product Images
  addImage: (productId: number, data: { image_url: string; alt_text?: string; sort_order?: number; is_primary?: boolean }) =>
    api.post<ApiResponse<any>>(`/products/${productId}/images`, data),

  deleteImage: (productId: number, imageId: number) =>
    api.delete<ApiResponse<any>>(`/products/${productId}/images/${imageId}`),

  setPrimaryImage: (productId: number, imageId: number) =>
    api.patch<ApiResponse<any>>(`/products/${productId}/images/${imageId}/primary`),
};

// ── AI 
export const aiService = {
  chat: (message: string, session_id?: string, conversation_history?: any[]) =>
    api.post<ApiResponse<any>>('/ai/chat', { message, session_id, conversation_history }),
  
  getHistory: (sessionId: string, params?: Record<string, any>) =>
    api.get<ApiResponse<any>>(`/ai/chat/history/${sessionId}`, { params }),
  
  getSessions: (params?: Record<string, any>) =>
    api.get<ApiResponse<any>>('/ai/chat/sessions', { params }),
  
  closeSession: (sessionId: string) =>
    api.delete<ApiResponse<any>>(`/ai/chat/sessions/${sessionId}`),
};

// ── Chatbot History & Sessions (Giai đoạn Chatbot History)
export const chatService = {
  createSession: (title?: string) =>
    api.post<ApiResponse<any>>('/chat/sessions', { title }),

  getSessions: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<any>>('/chat/sessions', { params }),

  getSessionDetail: (sessionId: string | number) =>
    api.get<ApiResponse<any>>(`/chat/sessions/${sessionId}`),

  sendMessage: (sessionId: string | number, message: string) =>
    api.post<ApiResponse<any>>(`/chat/sessions/${sessionId}/messages`, { message }),

  postMessage: (data: { message: string; session_id?: string | number }) =>
    api.post<ApiResponse<any>>('/chat/message', data),

  deleteSession: (sessionId: string | number) =>
    api.delete<ApiResponse<any>>(`/chat/sessions/${sessionId}`),

  getAdminStats: () =>
    api.get<ApiResponse<any>>('/chat/admin/stats'),
};

// ── Personalized AI Memory Service ───────────────────────────
export interface UserMemory {
  id: number;
  user_id: number;
  memory_type: 'preference' | 'budget' | 'brand' | 'category' | 'feature' | 'dislike' | 'purchase' | 'behavior';
  memory_key: string;
  memory_value: string;
  confidence: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferenceSummary {
  user_id: number;
  preferred_categories?: string[];
  preferred_brands?: string[];
  price_min?: number;
  price_max?: number;
  preferred_features?: Record<string, string>;
  disliked_features?: string[];
  favorite_products?: any[];
  summary?: string;
  updated_at?: string;
}

export const userMemoryService = {
  getMemories: () =>
    api.get<ApiResponse<UserMemory[]>>('/user/memory'),

  getPreferences: () =>
    api.get<ApiResponse<UserPreferenceSummary>>('/user/preferences'),

  extractMemory: (message: string) =>
    api.post<ApiResponse<any>>('/user/memory/extract', { message }),

  updateMemory: (id: number, memory_value: string, confidence?: number) =>
    api.put<ApiResponse<any>>(`/user/memory/${id}`, { memory_value, confidence }),

  deleteMemory: (id: number) =>
    api.delete<ApiResponse<any>>(`/user/memory/${id}`),

  deleteAllMemories: () =>
    api.delete<ApiResponse<any>>('/user/memory'),
};

// ── Payment
export const paymentService = {

  createVNPayUrl: (order_id: number) =>
    api.post<ApiResponse<{ paymentUrl: string; orderCode: string }>>('/payment/vnpay/create-url', { order_id }),

  getVietQR: (orderId: number | string) =>
    api.get<ApiResponse<any>>(`/payment/vietqr/${orderId}`),

  verifyVNPayReturn: (params: Record<string, string>) =>
    api.get<ApiResponse<any>>('/payment/vnpay/return', { params }),

  confirmTransfer: (orderId: number | string) =>
    api.post<ApiResponse<any>>(`/payment/vietqr/confirm/${orderId}`),

  adminVerifyBank: (orderId: number | string, data?: { reference_code?: string; note?: string }) =>
    api.put<ApiResponse<any>>(`/payment/admin/verify/${orderId}`, data),
};

// ── Coupons
export const couponService = {
  validate: (code: string, subtotal: number) =>
    api.post<ApiResponse<any>>('/coupons/validate', { code, subtotal }),

  getAvailable: () =>
    api.get<ApiResponse<any[]>>('/coupons/available'),

  adminGetCoupons: (params?: Record<string, any>) =>
    api.get<ApiResponse<any[]>>('/coupons/admin', { params }),

  adminCreate: (data: any) =>
    api.post<ApiResponse<any>>('/coupons/admin', data),

  adminUpdate: (id: number | string, data: any) =>
    api.put<ApiResponse<any>>(`/coupons/admin/${id}`, data),

  adminToggle: (id: number | string) =>
    api.patch<ApiResponse<any>>(`/coupons/admin/${id}/toggle`),

  adminDelete: (id: number | string) =>
    api.delete<ApiResponse<any>>(`/coupons/admin/${id}`),
};

// ── Returns & Refunds (Đổi / Trả hàng)
export const returnService = {
  requestReturn: (orderId: number | string, data: {
    return_type: 'refund' | 'exchange';
    reason: string;
    description?: string;
    images?: string[];
    bank_info?: { bank_name: string; account_number: string; account_holder: string };
  }) => api.post<ApiResponse<any>>(`/returns/orders/${orderId}`, data),

  getReturnDetail: (orderId: number | string) =>
    api.get<ApiResponse<any>>(`/returns/orders/${orderId}`),

  adminGetReturns: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<any[]>>('/returns/admin', { params }),

  adminProcessReturn: (id: number | string, data: { status: 'approved' | 'rejected' | 'completed'; admin_note?: string }) =>
    api.put<ApiResponse<any>>(`/returns/admin/${id}`, data),
};




