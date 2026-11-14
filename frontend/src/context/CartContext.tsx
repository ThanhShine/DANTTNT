import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Cart, CartItem } from '../types';
import { cartService, productService } from '../services';
import { useAuth } from './AuthContext';
import { behaviorTracker } from '../services/behaviorTracker';
import toast from 'react-hot-toast';

const GUEST_CART_KEY = '__sales_ai_guest_cart__';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (product_id: number, quantity?: number, variant_id?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

function loadGuestCart(): Cart | null {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) return parsed;
  } catch (err) {
    console.error('Lỗi khi đọc guest cart từ localStorage:', err);
  }
  return null;
}

function saveGuestCart(cart: Cart | null): void {
  try {
    if (!cart || cart.items.length === 0) {
      localStorage.removeItem(GUEST_CART_KEY);
    } else {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    }
  } catch (err) {
    console.error('Lỗi khi lưu guest cart vào localStorage:', err);
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(() => {
    // Nếu chưa đăng nhập, khởi tạo ngay từ guest cart
    return loadGuestCart();
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      const guest = loadGuestCart();
      setCart(guest);
      return;
    }

    try {
      setLoading(true);

      // Kiểm tra xem có giỏ hàng khách vãng lai cần đồng bộ vào tài khoản không
      const guest = loadGuestCart();
      if (guest && guest.items && guest.items.length > 0) {
        try {
          const syncItems = guest.items.map(i => ({
            product_id: i.product_id,
            variant_id: i.variant_id ? i.variant_id : undefined,
            quantity: i.quantity,
          }));

          await cartService.sync(syncItems);
          localStorage.removeItem(GUEST_CART_KEY);
          toast.success('Đã tự động đồng bộ giỏ hàng của bạn!');
        } catch (syncErr) {
          console.warn('Lỗi đồng bộ giỏ hàng khách vãng lai:', syncErr);
        }
      }

      const res = await cartService.get();
      setCart(res.data.data as Cart);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product_id: number, quantity = 1, variant_id?: number) => {
    // ── NẾU ĐÃ ĐĂNG NHẬP: LƯU VÀO DATABASE BACKEND ─────────────
    if (isAuthenticated) {
      try {
        await cartService.addItem(product_id, quantity, variant_id);
        toast.success('Đã thêm vào giỏ hàng!');
        behaviorTracker.trackAddToCart(product_id, quantity, variant_id, 'cart_context');
        await fetchCart();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Không thể thêm sản phẩm');
      }
      return;
    }

    // ── NẾU CHƯA ĐĂNG NHẬP: LƯU VÀO GUEST CART (LOCALSTORAGE) ──
    try {
      const currentCart = loadGuestCart() || {
        cartId: 0,
        items: [],
        total: 0,
        itemCount: 0,
      };

      const existingIndex = currentCart.items.findIndex(
        it => it.product_id === product_id && (it.variant_id === variant_id || (!it.variant_id && !variant_id))
      );

      if (existingIndex > -1) {
        const item = currentCart.items[existingIndex];
        const newQty = item.quantity + quantity;
        item.quantity = newQty;
        item.subtotal = newQty * item.unit_price;
      } else {
        // Fetch thông tin sản phẩm để lưu snapshot
        const prodRes = await productService.getById(product_id);
        const p: any = prodRes.data.data;
        if (!p) {
          toast.error('Sản phẩm không tồn tại');
          return;
        }

        let variantName: string | undefined = undefined;
        let unitPrice = p.sale_price || p.base_price;
        let stock = p.stock_quantity;

        if (variant_id && p.variants && p.variants.length > 0) {
          const v = p.variants.find((vr: any) => vr.id === variant_id);
          if (v) {
            variantName = v.variant_name;
            unitPrice = v.price || unitPrice;
            stock = v.stock_quantity ?? stock;
          }
        }

        const newItem: CartItem = {
          id: -1 * Date.now(), // ID âm định danh khách vãng lai
          cart_id: 0,
          product_id,
          variant_id: variant_id ?? null,
          name: p.name,
          thumbnail_url: p.thumbnail_url || null,
          base_price: p.base_price,
          sale_price: p.sale_price ?? null,
          stock_quantity: stock,
          variant_name: variantName ?? null,
          unit_price: unitPrice,
          quantity,
          subtotal: unitPrice * quantity,
        };


        currentCart.items.push(newItem);
      }

      currentCart.total = currentCart.items.reduce((s, it) => s + it.subtotal, 0);
      currentCart.itemCount = currentCart.items.reduce((s, it) => s + it.quantity, 0);

      saveGuestCart(currentCart);
      setCart({ ...currentCart });
      toast.success('Đã thêm vào giỏ hàng!');
      behaviorTracker.trackAddToCart(product_id, quantity, variant_id, 'guest_cart');
    } catch (guestErr) {
      console.error('Lỗi thêm giỏ hàng khách:', guestErr);
      toast.error('Có lỗi xảy ra khi thêm vào giỏ');
    }
  };

  const updateItem = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;

    if (isAuthenticated && itemId > 0) {
      try {
        await cartService.updateItem(itemId, quantity);
        await fetchCart();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Có lỗi khi cập nhật số lượng');
      }
      return;
    }

    // Guest cart update
    const currentCart = loadGuestCart();
    if (!currentCart) return;

    const targetItem = currentCart.items.find(it => it.id === itemId);
    if (targetItem) {
      targetItem.quantity = quantity;
      targetItem.subtotal = quantity * targetItem.unit_price;
      currentCart.total = currentCart.items.reduce((s, it) => s + it.subtotal, 0);
      currentCart.itemCount = currentCart.items.reduce((s, it) => s + it.quantity, 0);

      saveGuestCart(currentCart);
      setCart({ ...currentCart });
    }
  };

  const removeItem = async (itemId: number) => {
    if (isAuthenticated && itemId > 0) {
      const item = cart?.items.find(i => i.id === itemId);
      try {
        await cartService.removeItem(itemId);
        toast.success('Đã xoá sản phẩm');
        if (item) behaviorTracker.trackRemoveFromCart(item.product_id, 'cart_page');
        await fetchCart();
      } catch {
        /* handled */
      }
      return;
    }

    // Guest cart remove
    const currentCart = loadGuestCart();
    if (!currentCart) return;

    currentCart.items = currentCart.items.filter(it => it.id !== itemId);
    currentCart.total = currentCart.items.reduce((s, it) => s + it.subtotal, 0);
    currentCart.itemCount = currentCart.items.reduce((s, it) => s + it.quantity, 0);

    saveGuestCart(currentCart);
    setCart(currentCart.items.length > 0 ? { ...currentCart } : null);
    toast.success('Đã xoá sản phẩm khỏi giỏ hàng');
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await cartService.clear();
        setCart(null);
      } catch {
        /* handled */
      }
      return;
    }

    // Guest cart clear
    saveGuestCart(null);
    setCart(null);
  };

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateItem,
        removeItem,
        clearCart,
        fetchCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
