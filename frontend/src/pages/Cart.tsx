import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { couponService } from '../services';
import { formatCurrency } from '../utils/format';
import {
  Trash2, Minus, Plus, ShoppingBag, Truck, Ticket, ArrowRight, Sparkles, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

const CartPage: React.FC = () => {
  const { cart, loading, updateItem, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await couponService.getAvailable();
        setAvailableCoupons(res.data.data || []);
      } catch {
        // Silent
      }
    };
    fetchCoupons();
  }, []);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast('Vui lòng đăng nhập để tiến hành đặt hàng', { icon: '🔐' });
      navigate('/login?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium text-sm">Đang tải giỏ hàng...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center max-w-lg mx-auto">
          <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6 text-primary-500">
            <ShoppingBag size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng của bạn đang trống</h2>
          <p className="text-gray-500 mb-8 text-sm">
            Khám phá hàng ngàn sản phẩm công nghệ và phụ kiện đỉnh cao với giá ưu đãi ngay hôm nay!
          </p>
          <Link
            to="/products"
            className="px-8 py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  // Free shipping progress calculation
  const freeShipThreshold = 500000;
  const currentTotal = cart.total;
  const isFreeShipEligible = currentTotal >= freeShipThreshold;
  const freeShipProgress = Math.min(100, Math.round((currentTotal / freeShipThreshold) * 100));
  const amountNeeded = Math.max(0, freeShipThreshold - currentTotal);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Giỏ hàng của bạn <span className="text-primary-600 text-xl font-bold">({cart.itemCount} sản phẩm)</span>
        </h1>
        <Link to="/products" className="text-sm font-semibold text-primary-600 hover:text-primary-700 hidden sm:inline-flex items-center gap-1">
          Tiếp tục mua hàng <ArrowRight size={14} />
        </Link>
      </div>

      {/* Free Shipping Progress Notification */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 mb-8 shadow-xs">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Truck size={20} />
          </div>
          <div className="flex-1">
            {isFreeShipEligible ? (
              <p className="text-emerald-900 font-bold text-sm sm:text-base flex items-center gap-1.5">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                Chúc mừng! Đơn hàng của bạn đã đủ điều kiện nhận <span className="text-emerald-700 underline underline-offset-2">Miễn Phí Vận Chuyển toàn quốc</span>.
              </p>
            ) : (
              <p className="text-gray-800 font-medium text-sm sm:text-base">
                Mua thêm <span className="font-extrabold text-red-600">{formatCurrency(amountNeeded)}</span> để được{' '}
                <span className="font-bold text-emerald-700">MIỄN PHÍ VẬN CHUYỂN</span> toàn quốc!
              </p>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200/80 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFreeShipEligible ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary-500 to-emerald-500'
            }`}
            style={{ width: `${freeShipProgress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items List */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-gray-500">
              <div className="col-span-6">Sản phẩm</div>
              <div className="col-span-2 text-center">Đơn giá</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right">Thành tiền</div>
            </div>

            <div className="divide-y divide-gray-100">
              {cart.items.map(item => (
                <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center hover:bg-gray-50/40 transition">
                  <div className="col-span-6 flex items-center mb-4 sm:mb-0">
                    <img
                      src={item.thumbnail_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                      alt={item.name}
                      className="w-20 h-20 sm:w-22 sm:h-22 object-cover rounded-xl border border-gray-100 shrink-0 shadow-xs"
                    />
                    <div className="ml-4 flex-1">
                      <Link
                        to={`/product/${item.product_id}`}
                        className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-2 text-sm leading-snug"
                      >
                        {item.name}
                      </Link>
                      {item.variant_name && (
                        <span className="inline-block bg-primary-50 text-primary-700 text-xs px-2.5 py-0.5 rounded-full font-medium mt-1">
                          {item.variant_name}
                        </span>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center font-medium"
                        >
                          <Trash2 size={13} className="mr-1" /> Xoá khỏi giỏ
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 text-center hidden sm:block font-medium text-gray-700 text-sm">
                    {formatCurrency(item.unit_price)}
                  </div>

                  <div className="col-span-2 flex items-center justify-between sm:justify-center">
                    <span className="sm:hidden text-gray-500 text-xs">Số lượng:</span>
                    <div className="flex items-center border border-gray-200 rounded-lg bg-white shadow-xs overflow-hidden">
                      <button
                        onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className="p-2 hover:bg-gray-100 text-gray-600 transition disabled:opacity-30"
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0) updateItem(item.id, val);
                        }}
                        className="w-11 text-center py-1 font-semibold text-sm focus:outline-none"
                      />
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 text-gray-600 transition"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-between sm:justify-end mt-3 sm:mt-0">
                    <span className="sm:hidden text-gray-500 text-xs">Thành tiền:</span>
                    <span className="font-extrabold text-red-600 text-base">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Coupons Banner */}
          {availableCoupons.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <h3 className="font-bold text-gray-900 text-sm">Mã ưu đãi đang có hiệu lực</h3>
                </div>
                <span className="text-xs text-gray-400">Có thể áp dụng tại bước thanh toán</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableCoupons.slice(0, 4).map(c => (
                  <div key={c.id} className="border border-dashed border-primary-300 bg-primary-50/40 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                      <Ticket size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-primary-800 bg-white px-1.5 py-0.5 rounded border border-primary-200">
                          {c.code}
                        </span>
                        <span className="text-xs font-bold text-red-600">
                          {c.type === 'percentage' ? `-${c.value}%` : `-${formatCurrency(c.value)}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{c.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Summary Card */}
        <div className="w-full lg:w-96">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Tổng tiền hàng</span>
                <span className="font-semibold text-gray-900">{formatCurrency(cart.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Truck size={14} className="text-gray-400" /> Phí giao hàng
                </span>
                {isFreeShipEligible ? (
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-xs">
                    Miễn phí
                  </span>
                ) : (
                  <span className="text-gray-500 text-xs">Tính khi thanh toán</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Ticket size={14} className="text-gray-400" /> Voucher giảm giá
                </span>
                <span className="text-gray-500 text-xs">Áp dụng ở bước tiếp theo</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-gray-900">Tạm tính</span>
                <span className="text-2xl font-black text-red-600">{formatCurrency(cart.total)}</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Chưa bao gồm giảm giá voucher và phí vận chuyển theo địa chỉ.
              </p>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 text-base"
            >
              Tiến Hành Đặt Hàng <ArrowRight size={18} />
            </button>

            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-gray-500 text-center">
              <div className="bg-gray-50 p-2 rounded-lg">🛡️ Thanh toán bảo mật</div>
              <div className="bg-gray-50 p-2 rounded-lg">⚡ Giao hàng nhanh 2-3 ngày</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
