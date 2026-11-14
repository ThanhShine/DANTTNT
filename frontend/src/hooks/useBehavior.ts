/**
 * useBehavior — React hook để track hành vi người dùng
 *
 * Sử dụng:
 *   const { trackView, trackSearch, trackAddToCart } = useBehavior();
 */

import { useCallback } from 'react';
import { behaviorTracker } from '../services/behaviorTracker';

export const useBehavior = () => {
  const trackView = useCallback((productId: number, source?: string) => {
    behaviorTracker.trackView(productId, source);
    // Trả về cleanup function cho useEffect
    return () => behaviorTracker.stopView();
  }, []);

  const trackSearch = useCallback((keyword: string, resultCount?: number, source?: string) => {
    behaviorTracker.trackSearch(keyword, resultCount, source);
  }, []);

  const trackAddToCart = useCallback((
    productId: number,
    quantity?: number,
    variantId?: number,
    source?: string
  ) => {
    behaviorTracker.trackAddToCart(productId, quantity, variantId, source);
  }, []);

  const trackRemoveFromCart = useCallback((productId: number, source?: string) => {
    behaviorTracker.trackRemoveFromCart(productId, source);
  }, []);

  const trackPurchase = useCallback((productIds: number[], orderId?: number) => {
    behaviorTracker.trackPurchase(productIds, orderId);
  }, []);

  const trackReview = useCallback((productId: number, rating: number) => {
    behaviorTracker.trackReview(productId, rating);
  }, []);

  const trackLike = useCallback((productId: number) => {
    behaviorTracker.trackLike(productId);
  }, []);

  const trackClick = useCallback((productId: number, source?: string, position?: number) => {
    behaviorTracker.trackClick(productId, source, position);
  }, []);

  return {
    trackView,
    trackSearch,
    trackAddToCart,
    trackRemoveFromCart,
    trackPurchase,
    trackReview,
    trackLike,
    trackClick,
  };
};
