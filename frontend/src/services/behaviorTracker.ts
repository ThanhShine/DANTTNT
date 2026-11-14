/**
 * ============================================================
 * BehaviorTracker — Giai Đoạn 6
 * Thu thập hành vi người dùng để chuẩn bị cho Recommendation
 *
 * Tính năng:
 *  - Queue offline: gom các event, gửi batch sau
 *  - Debounce: tránh gửi VIEW liên tục
 *  - SessionId: tự sinh và persist qua localStorage
 *  - Fire-and-forget: không block UI nếu lỗi
 * ============================================================
 */

import api from './api';
import { ApiResponse } from '../types';

// ── Types ────────────────────────────────────────────────────
export type BehaviorActionType =
  | 'view'
  | 'click'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'purchase'
  | 'wishlist'
  | 'like'
  | 'review'
  | 'search';

export interface BehaviorPayload {
  action_type: BehaviorActionType;
  product_id?: number | null;
  search_keyword?: string;
  duration?: number;
  source?: string;
  session_id?: string;
  metadata?: Record<string, unknown>;
}

export interface BatchBehaviorPayload {
  session_id: string;
  behaviors: Omit<BehaviorPayload, 'session_id'>[];
}

// ── Constants ────────────────────────────────────────────────
const BEHAVIOR_QUEUE_KEY  = '__behavior_queue__';
const BATCH_INTERVAL_MS   = 5000;      // Gửi batch mỗi 5 giây
const MAX_QUEUE_SIZE      = 30;        // Tối đa 30 event trong queue
const VIEW_DEBOUNCE_MS    = 3000;      // Debounce 3 giây cho VIEW
const MIN_VIEW_DURATION_S = 2;         // Không ghi VIEW dưới 2 giây

// ── Session Manager ──────────────────────────────────────────
const getSessionId = (): string => {
  let sid = localStorage.getItem('sessionId');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('sessionId', sid);
  }
  return sid;
};

// ── View Duration Tracker ────────────────────────────────────
class ViewDurationTracker {
  private startTime: number | null = null;
  private productId: number | null = null;

  start(productId: number) {
    this.productId = productId;
    this.startTime = Date.now();
  }

  stop(): { productId: number; duration: number } | null {
    if (!this.startTime || !this.productId) return null;
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const result = { productId: this.productId, duration };
    this.startTime = null;
    this.productId = null;
    return result;
  }

  getDuration(): number {
    if (!this.startTime) return 0;
    return Math.round((Date.now() - this.startTime) / 1000);
  }
}

// ── Behavior Queue ───────────────────────────────────────────
class BehaviorQueue {
  private queue: BehaviorPayload[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushPromise: Promise<void> | null = null;

  constructor() {
    // Khôi phục queue từ localStorage khi page reload
    const saved = localStorage.getItem(BEHAVIOR_QUEUE_KEY);
    if (saved) {
      try {
        this.queue = JSON.parse(saved);
      } catch {
        this.queue = [];
      }
    }

    // Bắt đầu timer flush
    this.startTimer();

    // Flush khi user close tab
    window.addEventListener('beforeunload', () => this.flush());
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
  }

  push(payload: BehaviorPayload) {
    this.queue.push(payload);
    // Giới hạn queue size
    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue.shift(); // xóa event cũ nhất
    }
    this.saveToStorage();

    // Flush ngay nếu đây là event quan trọng
    const urgent = ['purchase', 'review'].includes(payload.action_type);
    if (urgent) this.flush();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(BEHAVIOR_QUEUE_KEY, JSON.stringify(this.queue));
    } catch {/* storage full — ignore */}
  }

  private startTimer() {
    this.timer = setInterval(() => this.flush(), BATCH_INTERVAL_MS);
  }

  async flush() {
    if (this.flushPromise) return; // Tránh flush đồng thời
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, 50); // Lấy tối đa 50
    this.saveToStorage();

    this.flushPromise = this._sendBatch(batch)
      .catch(() => {
        // Nếu gửi thất bại, đẩy lại vào đầu queue
        this.queue.unshift(...batch.slice(0, MAX_QUEUE_SIZE - this.queue.length));
        this.saveToStorage();
      })
      .finally(() => { this.flushPromise = null; });

    await this.flushPromise;
  }

  private async _sendBatch(behaviors: BehaviorPayload[]) {
    await api.post<ApiResponse>('/behaviors/batch', {
      session_id: getSessionId(),
      behaviors: behaviors.map(b => ({
        ...b,
        session_id: undefined, // không cần trong từng item
      })),
    });
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    window.removeEventListener('beforeunload', () => this.flush());
  }
}

// ── Main BehaviorTracker Singleton ───────────────────────────
class BehaviorTracker {
  private queue = new BehaviorQueue();
  private viewTracker = new ViewDurationTracker();
  private viewDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastViewProductId: number | null = null;

  // Ghi hành vi — entry point chính
  private track(payload: BehaviorPayload) {
    const sid = getSessionId();
    this.queue.push({ ...payload, session_id: sid });
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * VIEW_PRODUCT — Ghi khi user mở trang sản phẩm
   * Dùng debounce để tránh spam khi route thay đổi nhanh
   * Tự động ghi duration khi user rời trang
   */
  trackView(productId: number, source?: string) {
    // Nếu đang xem sản phẩm khác → ghi duration của sản phẩm cũ trước
    if (this.lastViewProductId && this.lastViewProductId !== productId) {
      const prev = this.viewTracker.stop();
      if (prev && prev.duration >= MIN_VIEW_DURATION_S) {
        this.track({
          action_type: 'view',
          product_id: prev.productId,
          duration: prev.duration,
          source: 'navigation',
        });
      }
    }

    // Debounce: hủy timer cũ nếu có
    if (this.viewDebounceTimer) clearTimeout(this.viewDebounceTimer);

    this.lastViewProductId = productId;
    this.viewTracker.start(productId);

    this.viewDebounceTimer = setTimeout(() => {
      this.track({
        action_type: 'view',
        product_id: productId,
        source: source || 'product_page',
      });
    }, VIEW_DEBOUNCE_MS);
  }

  /**
   * Ghi VIEW kèm duration khi user rời trang sản phẩm
   * Gọi trong useEffect cleanup
   */
  stopView() {
    if (this.viewDebounceTimer) {
      clearTimeout(this.viewDebounceTimer);
      this.viewDebounceTimer = null;
    }
    const result = this.viewTracker.stop();
    if (result && result.duration >= MIN_VIEW_DURATION_S) {
      this.track({
        action_type: 'view',
        product_id: result.productId,
        duration: result.duration,
        source: 'product_page',
      });
    }
    this.lastViewProductId = null;
  }

  /** SEARCH — Ghi khi user tìm kiếm */
  trackSearch(keyword: string, resultCount?: number, source?: string) {
    if (!keyword.trim()) return;
    this.track({
      action_type: 'search',
      product_id: null,
      search_keyword: keyword.trim(),
      source: source || 'search_bar',
      metadata: resultCount !== undefined ? { result_count: resultCount } : undefined,
    });
  }

  /** ADD_TO_CART — Ghi khi user thêm sản phẩm vào giỏ */
  trackAddToCart(productId: number, quantity = 1, variantId?: number, source?: string) {
    this.track({
      action_type: 'add_to_cart',
      product_id: productId,
      source: source || 'product_page',
      metadata: { quantity, variant_id: variantId },
    });
  }

  /** REMOVE_FROM_CART — Ghi khi user xóa sản phẩm khỏi giỏ */
  trackRemoveFromCart(productId: number, source?: string) {
    this.track({
      action_type: 'remove_from_cart',
      product_id: productId,
      source: source || 'cart_page',
    });
  }

  /** PURCHASE — Ghi khi user đặt hàng thành công */
  trackPurchase(productIds: number[], orderId?: number, source?: string) {
    for (const productId of productIds) {
      this.track({
        action_type: 'purchase',
        product_id: productId,
        source: source || 'checkout',
        metadata: orderId ? { order_id: orderId } : undefined,
      });
    }
  }

  /** REVIEW — Ghi khi user gửi đánh giá */
  trackReview(productId: number, rating: number) {
    this.track({
      action_type: 'review',
      product_id: productId,
      metadata: { rating },
      source: 'review_form',
    });
  }

  /** LIKE / WISHLIST — Ghi khi user thích sản phẩm */
  trackLike(productId: number) {
    this.track({
      action_type: 'like',
      product_id: productId,
      source: 'product_page',
    });
  }

  /** CLICK — Ghi khi user click vào card sản phẩm (từ danh sách) */
  trackClick(productId: number, source?: string, position?: number) {
    this.track({
      action_type: 'click',
      product_id: productId,
      source: source || 'product_list',
      metadata: position !== undefined ? { position } : undefined,
    });
  }

  /** Flush queue ngay lập tức (dùng khi cần đảm bảo data được gửi) */
  flush() {
    return this.queue.flush();
  }
}

// ── Export Singleton ─────────────────────────────────────────
export const behaviorTracker = new BehaviorTracker();

// ── Legacy API (backward compatible) ────────────────────────
export const behaviorService = {
  /** @deprecated Dùng behaviorTracker thay thế */
  log: (
    product_id: number,
    action_type: BehaviorActionType,
    sessionId?: string,
    duration?: number
  ) => {
    const sid = sessionId || getSessionId();
    return api.post<ApiResponse>('/behaviors', {
      product_id,
      action_type,
      session_id: sid,
      duration,
    }).catch(() => {}); // bỏ qua lỗi
  },
};
