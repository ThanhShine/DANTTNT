import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { authService, orderService, userService, couponService } from '../services';
import { useBehavior } from '../hooks/useBehavior';
import { User, UserAddress } from '../types';
import { formatCurrency } from '../utils/format';
import { calculateShippingFee } from '../utils/vietnamAddressData';
import VietnamAddressSelector from '../components/VietnamAddressSelector';
import {
  MapPin, Plus, Banknote, QrCode, CreditCard, ShieldCheck,
  Loader2, Ticket, CheckCircle2, X, Tag, Truck
} from 'lucide-react';
import toast from 'react-hot-toast';

type PaymentMethodType = 'COD' | 'BANK_TRANSFER' | 'VNPAY';

interface AppliedCoupon {
  code: string;
  discount_amount: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  description: string;
}

const Checkout: React.FC = () => {
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  const { trackPurchase } = useBehavior();

  const [profile, setProfile] = useState<(User & { addresses: UserAddress[] }) | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('BANK_TRANSFER');
  const [customerNote, setCustomerNote] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // New Address Form State
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');
  const [newProvince, setNewProvince] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newWard, setNewWard] = useState('');
  const [newAddressDetail, setNewAddressDetail] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        const profileData = res.data.data as User & { addresses: UserAddress[] };
        setProfile(profileData);
        const defaultAddr = profileData.addresses?.find((a: UserAddress) => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (profileData.addresses && profileData.addresses.length > 0) {
          setSelectedAddressId(profileData.addresses[0].id);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, [cart, navigate]);

  // Load available coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      setLoadingCoupons(true);
      try {
        const res = await couponService.getAvailable();
        setAvailableCoupons(res.data.data || []);
      } catch {
        // Silent fail
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchCoupons();
  }, []);

  const selectedAddress = profile?.addresses?.find(a => a.id === selectedAddressId);
  const isFreeShipCoupon = appliedCoupon?.code?.toUpperCase() === 'FREESHIP';
  const shippingCalculation = calculateShippingFee(cart?.total || 0, selectedAddress?.province, isFreeShipCoupon);
  const shippingFee = shippingCalculation.shippingFee;
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const finalTotal = Math.max(0, (cart?.total || 0) - discountAmount + shippingFee);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!targetCode) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    if (!cart?.total) return;

    setIsValidatingCoupon(true);
    try {
      const res = await couponService.validate(targetCode, cart.total);
      const data = res.data.data;
      const discount = data.discountAmount ?? data.discount_amount ?? 0;
      setAppliedCoupon({
        code: data.code,
        discount_amount: discount,
        discount_type: data.type ?? data.discount_type,
        discount_value: data.value ?? data.discount_value,
        description: data.description,
      });
      setCouponCodeInput(data.code);
      setShowCouponModal(false);
      toast.success(`Đã áp dụng mã "${data.code}"! Tiết kiệm ${formatCurrency(discount)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    toast('Đã hủy áp dụng mã giảm giá', { icon: 'ℹ️' });
  };

  const onAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientName.trim() || !newRecipientPhone.trim()) {
      toast.error('Vui lòng nhập tên và số điện thoại người nhận');
      return;
    }
    if (!newProvince || !newDistrict || !newWard) {
      toast.error('Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã');
      return;
    }
    if (!newAddressDetail.trim()) {
      toast.error('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường)');
      return;
    }

    setIsSavingAddress(true);
    try {
      await userService.addAddress({
        recipient_name: newRecipientName.trim(),
        recipient_phone: newRecipientPhone.trim(),
        province: newProvince,
        district: newDistrict,
        ward: newWard,
        address_detail: newAddressDetail.trim(),
        is_default: true,
      });

      const res = await authService.getProfile();
      const updatedProfile = res.data.data as User & { addresses: UserAddress[] };
      setProfile(updatedProfile);
      setShowNewAddress(false);

      const latestAddr = updatedProfile.addresses?.[updatedProfile.addresses.length - 1];
      if (latestAddr) {
        setSelectedAddressId(latestAddr.id);
      }

      // Reset form
      setNewRecipientName('');
      setNewRecipientPhone('');
      setNewProvince('');
      setNewDistrict('');
      setNewWard('');
      setNewAddressDetail('');
      toast.success('Đã lưu địa chỉ giao hàng mới!');
    } catch {
      toast.error('Có lỗi xảy ra khi lưu địa chỉ');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error('Vui lòng chọn hoặc thêm địa chỉ giao hàng');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await orderService.create({
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
        customer_note: customerNote.trim() || undefined,
      });

      const orderData = res.data.data as any;
      const orderId = orderData?.id;

      if (cart?.items) {
        const productIds = cart.items.map(item => item.product_id);
        trackPurchase(productIds, orderId);
      }

      await fetchCart();

      if (paymentMethod === 'VNPAY' && orderData?.payment_url) {
        toast.loading('Đang chuyển hướng sang cổng thanh toán VNPay...');
        window.location.href = orderData.payment_url;
        return;
      }

      if (paymentMethod === 'BANK_TRANSFER') {
        toast.success('Đặt hàng thành công! Vui lòng quét mã VietQR để thanh toán');
        navigate(`/orders/${orderId}`);
        return;
      }

      toast.success('Đặt hàng thành công!');
      navigate(`/orders/${orderId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đặt hàng thất bại');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!cart) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8">Thanh Toán Đơn Hàng</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* 1. Address Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="text-primary-600 mr-2" /> 1. Địa chỉ nhận hàng
            </h2>

            {profile?.addresses && profile.addresses.length > 0 && !showNewAddress ? (
              <div className="space-y-3">
                {profile.addresses.map(addr => (
                  <label
                    key={addr.id}
                    className={`flex items-start p-4 border rounded-xl cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-bold text-gray-900">
                        {addr.recipient_name} <span className="font-normal text-gray-500">| {addr.recipient_phone}</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{addr.address_detail}</p>
                      <p className="text-sm text-gray-600 font-medium text-primary-700">
                        {addr.ward}, {addr.district}, {addr.province}
                      </p>
                      {addr.is_default === 1 && (
                        <span className="inline-block mt-2 text-xs text-red-500 border border-red-300 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                          Mặc định
                        </span>
                      )}
                    </div>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setShowNewAddress(true)}
                  className="flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm mt-3"
                >
                  <Plus size={16} className="mr-1" /> Thêm địa chỉ mới
                </button>
              </div>
            ) : (
              <form onSubmit={onAddAddressSubmit} className="space-y-4 border rounded-xl p-5 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Thêm địa chỉ giao hàng chuẩn 3 cấp</h3>
                  {profile?.addresses?.length ? (
                    <button
                      type="button"
                      onClick={() => setShowNewAddress(false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Quay lại danh sách
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Họ và tên người nhận *</label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={newRecipientName}
                      onChange={(e) => setNewRecipientName(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      placeholder="0912345678"
                      value={newRecipientPhone}
                      onChange={(e) => setNewRecipientPhone(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
                      required
                    />
                  </div>
                </div>

                {/* 3-tier Vietnamese Address Selector */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <VietnamAddressSelector
                    province={newProvince}
                    district={newDistrict}
                    ward={newWard}
                    onChange={({ province, district, ward }) => {
                      setNewProvince(province);
                      setNewDistrict(district);
                      setNewWard(ward);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Địa chỉ chi tiết (Số nhà, tên đường, ngõ...) *</label>
                  <input
                    type="text"
                    placeholder="Số 123 đường Lê Lợi, ngách 45..."
                    value={newAddressDetail}
                    onChange={(e) => setNewAddressDetail(e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  {profile?.addresses?.length ? (
                    <button
                      type="button"
                      onClick={() => setShowNewAddress(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition"
                    >
                      Hủy
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isSavingAddress}
                    className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 flex items-center"
                  >
                    {isSavingAddress ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" /> Đang lưu...
                      </>
                    ) : (
                      'Lưu địa chỉ'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 2. Payment Method */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <ShieldCheck className="text-primary-600 mr-2" /> 2. Chọn phương thức thanh toán
            </h2>

            <div className="space-y-3">
              {/* Option 1: VietQR */}
              <label
                className={`flex items-start p-4 border rounded-xl cursor-pointer transition ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <QrCode size={18} className="text-emerald-600" />
                    <span className="font-bold text-gray-900">Chuyển khoản Ngân hàng (Mã VietQR 24/7)</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                      Khuyên dùng • Nhanh & Miễn phí
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Hệ thống tự sinh mã QR chuẩn NAPAS 24/7 với số tiền và nội dung chính xác. Bạn chỉ cần mở ứng dụng ngân hàng bất kỳ để quét mã.
                  </p>
                </div>
              </label>

              {/* Option 2: VNPay */}
              <label
                className={`flex items-start p-4 border rounded-xl cursor-pointer transition ${
                  paymentMethod === 'VNPAY'
                    ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="VNPAY"
                  checked={paymentMethod === 'VNPAY'}
                  onChange={() => setPaymentMethod('VNPAY')}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <CreditCard size={18} className="text-blue-600" />
                    <span className="font-bold text-gray-900">Cổng thanh toán VNPay</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                      Thẻ ATM / Visa / VNPAY-QR
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Thanh toán an toàn bảo mật qua cổng VNPay với thẻ ATM nội địa tất cả các ngân hàng, thẻ quốc tế Visa/MasterCard hoặc ví điện tử.
                  </p>
                </div>
              </label>

              {/* Option 3: COD */}
              <label
                className={`flex items-start p-4 border rounded-xl cursor-pointer transition ${
                  paymentMethod === 'COD'
                    ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote size={18} className="text-amber-600" />
                    <span className="font-bold text-gray-900">Thanh toán khi nhận hàng (COD)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Nhận hàng tại nhà, kiểm tra gói hàng sau đó mới thanh toán tiền mặt cho shipper.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Customer Note */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Ghi chú đơn hàng (Tùy chọn)</h2>
            <textarea
              rows={2}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Ví dụ: Giao hàng giờ hành chính, gọi trước khi giao 15 phút..."
              className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Order Summary & Coupon */}
        <div className="w-full lg:w-96 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-4">Đơn hàng của bạn</h2>
            
            {/* Cart item list preview */}
            <div className="max-h-56 overflow-y-auto mb-4 divide-y pr-1">
              {cart.items.map(item => (
                <div key={item.id} className="py-2.5 flex justify-between gap-3">
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-gray-900 line-clamp-2">{item.name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-primary-600 mt-0.5">Phân loại: {item.variant_name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">SL: {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Voucher Section */}
            <div className="border-t pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 flex items-center">
                  <Ticket size={14} className="mr-1 text-primary-600" /> Mã giảm giá / Voucher
                </span>
                {availableCoupons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center"
                  >
                    <Tag size={12} className="mr-0.5" /> Chọn mã ({availableCoupons.length})
                  </button>
                )}
              </div>

              {appliedCoupon ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-800 text-sm tracking-wide font-mono">
                        {appliedCoupon.code}
                      </span>
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    </div>
                    <p className="text-xs text-emerald-700 mt-0.5 line-clamp-1">
                      {appliedCoupon.description} (-{formatCurrency(appliedCoupon.discount_amount)})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-gray-400 hover:text-red-500 p-1 transition"
                    title="Hủy áp dụng mã"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="Nhập mã (VD: WELCOME10)"
                    className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-xs uppercase font-mono tracking-wider focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={isValidatingCoupon || !couponCodeInput.trim()}
                    className="px-3.5 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition flex items-center"
                  >
                    {isValidatingCoupon ? <Loader2 size={13} className="animate-spin" /> : 'Áp dụng'}
                  </button>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t pt-4 space-y-2.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Tổng tiền hàng ({cart.itemCount} sp)</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Giảm giá voucher</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <Truck size={14} className="mr-1 text-gray-400" /> Phí vận chuyển
                </span>
                {shippingFee === 0 ? (
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-xs">
                    Miễn phí
                  </span>
                ) : (
                  <span className="font-semibold text-gray-900">{formatCurrency(shippingFee)}</span>
                )}
              </div>

              {selectedAddress?.province && (
                <p className="text-[11px] text-gray-400 text-right">
                  Giao tới: {selectedAddress.province}
                </p>
              )}
            </div>

            <div className="border-t pt-4 mt-4 flex justify-between items-center mb-6">
              <div>
                <span className="block font-bold text-gray-900">Tổng thanh toán</span>
                <span className="text-[11px] text-gray-400">Đã bao gồm VAT & Phí ship</span>
              </div>
              <span className="text-2xl font-black text-red-600">{formatCurrency(finalTotal)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isPlacingOrder}
              className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center shadow-lg shadow-primary-600/20"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" /> Đang xử lý...
                </>
              ) : paymentMethod === 'VNPAY' ? (
                'Thanh Toán Qua VNPay'
              ) : paymentMethod === 'BANK_TRANSFER' ? (
                'Tiếp Tục Quét Mã VietQR'
              ) : (
                'Đặt Hàng COD'
              )}
            </button>

            <p className="text-xs text-center text-gray-400 mt-3">
              Nhấn Đặt hàng đồng nghĩa với việc bạn đồng ý với Điều khoản mua sắm của SalesAI.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Chọn Mã Giảm Giá Có Sẵn */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <Ticket className="text-primary-600" size={22} />
                <h3 className="font-bold text-gray-900 text-lg">Mã giảm giá dành cho bạn</h3>
              </div>
              <button
                onClick={() => setShowCouponModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {loadingCoupons ? (
                <div className="text-center py-8 text-gray-400">Đang tải mã giảm giá...</div>
              ) : availableCoupons.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Hiện không có mã giảm giá nào khả dụng.</div>
              ) : (
                availableCoupons.map((coupon) => {
                  const isEligible = (cart?.total || 0) >= Number(coupon.min_order_amount || 0);
                  const isApplied = appliedCoupon?.code === coupon.code;

                  return (
                    <div
                      key={coupon.id}
                      className={`border rounded-xl p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isApplied
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : isEligible
                          ? 'border-gray-200 hover:border-primary-400 bg-white'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm bg-primary-50 text-primary-700 px-2 py-0.5 rounded border border-primary-200">
                            {coupon.code}
                          </span>
                          <span className="text-xs font-semibold text-red-600">
                            {coupon.type === 'percentage'
                              ? `Giảm ${coupon.value}%${coupon.max_discount_amount ? ` (tối đa ${formatCurrency(coupon.max_discount_amount)})` : ''}`
                              : `Giảm ${formatCurrency(coupon.value)}`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">{coupon.description}</p>
                        <p className="text-[11px] text-gray-400">
                          Đơn tối thiểu: {formatCurrency(coupon.min_order_amount || 0)}
                          {coupon.end_date && ` • HSD: ${new Date(coupon.end_date).toLocaleDateString('vi-VN')}`}
                        </p>
                        {!isEligible && (
                          <p className="text-[11px] text-amber-600">
                            Mua thêm {formatCurrency(Number(coupon.min_order_amount) - (cart?.total || 0))} để sử dụng
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!isEligible || isValidatingCoupon}
                        onClick={() => handleApplyCoupon(coupon.code)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                          isApplied
                            ? 'bg-emerald-600 text-white cursor-default'
                            : isEligible
                            ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isApplied ? 'Đang dùng' : 'Áp dụng'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t text-right">
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
