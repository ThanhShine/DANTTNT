import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService, paymentService, returnService } from '../services';
import { Order, OrderStatusHistoryItem, ShippingAddress } from '../types';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '../utils/format';
import {
  Package, ArrowLeft, Clock, CheckCircle2, Truck, XCircle,
  MapPin, CreditCard, ShoppingBag, AlertCircle, User as UserIcon,
  ShoppingCart, Activity, ChevronRight, QrCode, Copy, Check, Loader2, ExternalLink, Printer, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceModal, { InvoiceData } from '../components/InvoiceModal';
import ReturnRequestModal from '../components/ReturnRequestModal';


// ── Sidebar Menu ─────────────────────────────────────────────
const SidebarMenu = ({ active }: { active: string }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-b">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
          <Package size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary-900">Đơn mua</p>
          <p className="text-xs text-primary-600">Lịch sử đặt hàng</p>
        </div>
      </div>
    </div>
    <nav className="p-2">
      {[
        { to: '/account', label: 'Thông tin tài khoản', icon: UserIcon, key: 'account' },
        { to: '/orders', label: 'Đơn mua', icon: Package, key: 'orders' },
        { to: '/cart', label: 'Giỏ hàng', icon: ShoppingCart, key: 'cart' },
        { to: '/account/activity', label: 'Lịch sử hoạt động', icon: Activity, key: 'activity' },
      ].map(({ to, label, icon: Icon, key }) => (
        <Link
          key={key}
          to={to}
          className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors mb-1 ${
            active === key
              ? 'bg-primary-50 text-primary-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <span className="flex items-center">
            <Icon size={16} className="mr-3" />
            {label}
          </span>
          <ChevronRight size={14} className="text-gray-400" />
        </Link>
      ))}
    </nav>
  </div>
);

// ── Order Timeline Stepper ───────────────────────────────────
const STATUS_STEPS = [
  { key: 'pending', label: 'Đặt hàng', desc: 'Đơn hàng đã được tạo' },
  { key: 'processing', label: 'Xác nhận', desc: 'Đang chuẩn bị hàng' },
  { key: 'shipped', label: 'Vận chuyển', desc: 'Đang giao đến bạn' },
  { key: 'delivered', label: 'Hoàn thành', desc: 'Giao hàng thành công' },
];

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<OrderStatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [isPayingVNPay, setIsPayingVNPay] = useState(false);
  const [isConfirmingTransfer, setIsConfirmingTransfer] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnDetail, setReturnDetail] = useState<any>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePayVNPay = async () => {
    if (!order) return;
    setIsPayingVNPay(true);
    try {
      const res = await paymentService.createVNPayUrl(order.id);
      if (res.data.data?.paymentUrl) {
        toast.loading('Đang chuyển hướng sang cổng VNPay...');
        window.location.href = res.data.data.paymentUrl;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tạo link thanh toán VNPay');
      setIsPayingVNPay(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!order) return;
    setIsConfirmingTransfer(true);
    try {
      await paymentService.confirmTransfer(order.id);
      toast.success('Đã gửi thông báo chuyển khoản! Shop sẽ xác nhận sớm nhất.');
      // Refresh history
      const historyRes = await orderService.getOrderHistory(order.id).catch(() => null);
      if (historyRes?.data?.data) setTimeline(historyRes.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsConfirmingTransfer(false);
    }
  };

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [orderRes, historyRes, returnRes] = await Promise.all([
          orderService.getById(Number(id)),
          orderService.getOrderHistory(Number(id)).catch(() => null),
          returnService.getReturnDetail(Number(id)).catch(() => null),
        ]);

        if (orderRes?.data?.success && orderRes.data.data) {
          setOrder(orderRes.data.data);
        }
        if (historyRes?.data?.success && historyRes.data.data) {
          setTimeline(historyRes.data.data);
        }
        if (returnRes?.data?.success && returnRes.data.data) {
          setReturnDetail(returnRes.data.data);
        } else {
          setReturnDetail(null);
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết đơn hàng:', err);
        toast.error('Không tìm thấy thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  const handleCancel = async () => {
    if (!order) return;
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    setCancelling(true);
    try {
      await orderService.cancel(order.id, 'Người mua yêu cầu hủy');
      toast.success('Hủy đơn hàng thành công');
      // Tải lại chi tiết
      const [orderRes, historyRes] = await Promise.all([
        orderService.getById(order.id),
        orderService.getOrderHistory(order.id).catch(() => null),
      ]);
      if (orderRes.data.success && orderRes.data.data) {
        setOrder(orderRes.data.data);
      }
      if (historyRes?.data?.success && historyRes.data.data) {
        setTimeline(historyRes.data.data);
      }
    } catch {
      toast.error('Không thể hủy đơn hàng vào lúc này');
    } finally {
      setCancelling(false);
    }
  };

  // Helper parse address
  const getAddress = (): ShippingAddress | null => {
    if (!order?.shipping_address) return null;
    if (typeof order.shipping_address === 'string') {
      try {
        return JSON.parse(order.shipping_address);
      } catch {
        return null;
      }
    }
    return order.shipping_address;
  };

  const parsedAddress = getAddress();

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    if (currentStatus === 'cancelled') {
      return stepKey === 'pending' ? 'completed' : 'cancelled';
    }
    const orderLevels: Record<string, number> = {
      pending: 1,
      processing: 2,
      shipped: 3,
      delivered: 4,
    };
    const currentLevel = orderLevels[currentStatus] || 1;
    const targetLevel = orderLevels[stepKey] || 1;

    if (currentLevel > targetLevel) return 'completed';
    if (currentLevel === targetLevel) return 'current';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl h-48 animate-pulse" />
          </div>
          <div className="flex-1 bg-white rounded-xl h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-gray-500 mb-6">Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.</p>
        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Quay lại danh sách đơn
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <SidebarMenu active="orders" />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <Link
                to="/orders"
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600"
              >
                <ArrowLeft size={16} className="mr-1.5" /> Quay lại danh sách đơn
              </Link>
              <div className="flex items-center gap-2">
                {order.status === 'delivered' && (!returnDetail || returnDetail.status === 'rejected') && (
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-full border border-amber-300 transition cursor-pointer"
                    title="Gửi yêu cầu đổi hoặc trả hàng hoàn tiền"
                  >
                    <RotateCcw size={13} /> Đổi / Trả Hàng
                  </button>
                )}
                <button
                  onClick={() => setShowInvoice(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full border border-gray-200 transition cursor-pointer"
                  title="In hóa đơn & phiếu giao hàng"
                >
                  <Printer size={13} className="text-gray-600" /> In Hóa Đơn
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
                {['pending', 'processing'].includes(order.status) && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-full hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
                  </button>
                )}
              </div>
            </div>

            {/* Return Request Status Banner */}
            {returnDetail && (
              <div className={`p-4 rounded-xl border mb-4 text-xs ${
                returnDetail.status === 'completed'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : returnDetail.status === 'approved'
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : returnDetail.status === 'rejected'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="flex items-center gap-1.5 text-sm">
                    <RotateCcw size={15} />
                    Yêu cầu {returnDetail.return_type === 'exchange' ? 'Đổi hàng mới' : 'Trả hàng & Hoàn tiền'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded font-bold uppercase text-[11px] bg-white/90 shadow-2xs">
                    {returnDetail.status === 'pending' ? '⏳ Đang chờ duyệt' :
                     returnDetail.status === 'approved' ? '✅ Đã chấp thuận' :
                     returnDetail.status === 'rejected' ? '❌ Bị từ chối' : '🎉 Đã hoàn tất'}
                  </span>
                </div>
                <p><strong>Lý do:</strong> {returnDetail.reason}</p>
                {returnDetail.description && <p className="text-gray-600 mt-0.5"><strong>Chi tiết:</strong> {returnDetail.description}</p>}
                {returnDetail.admin_note && (
                  <p className="mt-1.5 font-medium border-t border-black/10 pt-1.5">
                    💬 <strong>Phản hồi từ CSKH:</strong> {returnDetail.admin_note}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Đơn hàng #{order.order_code || order.id}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Ngày đặt: {formatDate(order.created_at)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Tổng thanh toán</span>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(order.total_amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Stepper Flow */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6 flex items-center">
              <Truck size={18} className="mr-2 text-primary-600" />
              Tiến trình đơn hàng
            </h2>

            {order.status === 'cancelled' ? (
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center text-red-700">
                <XCircle size={24} className="mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Đơn hàng đã bị hủy</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Đơn hàng này đã kết thúc. Nếu bạn cần hỗ trợ, vui lòng liên hệ bộ phận CSKH.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {STATUS_STEPS.map((step, idx) => {
                  const state = getStepStatus(step.key, order.status);
                  return (
                    <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${
                          state === 'completed'
                            ? 'bg-green-600 text-white'
                            : state === 'current'
                            ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {state === 'completed' ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <p className={`text-sm font-semibold ${state === 'upcoming' ? 'text-gray-400' : 'text-gray-900'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detailed Timeline Events */}
            {timeline.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Clock size={16} className="mr-2 text-gray-400" />
                  Nhật ký cập nhật trạng thái
                </h3>
                <div className="space-y-3">
                  {timeline.map((event) => (
                    <div key={event.id} className="flex items-start text-xs space-x-3">
                      <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {getStatusText(event.status)}
                        </span>
                        {event.note && (
                          <span className="text-gray-600 ml-2">— {event.note}</span>
                        )}
                      </div>
                      <span className="text-gray-400 font-mono">
                        {formatDate(event.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Products List Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center">
                <ShoppingBag size={18} className="mr-2 text-primary-600" />
                Sản phẩm đã mua ({order.items?.length || 0})
              </h2>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <div key={item.id} className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product_id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-primary-600 truncate block"
                    >
                      {item.product_name}
                    </Link>
                    {item.variant_name && (
                      <p className="text-xs text-gray-500 mt-0.5">Phân loại: {item.variant_name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      Đơn giá: {formatCurrency(item.unit_price)} × {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(item.subtotal || item.unit_price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="bg-gray-50 p-6 border-t border-gray-100 space-y-2.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tạm tính:</span>
                <span>{formatCurrency(order.subtotal || 0)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá voucher:</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Phí vận chuyển:</span>
                <span>{order.shipping_fee > 0 ? formatCurrency(order.shipping_fee) : 'Miễn phí'}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Tổng tiền:</span>
                <span className="text-red-600">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Địa chỉ giao hàng */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin size={18} className="mr-2 text-primary-600" />
                Địa chỉ nhận hàng
              </h3>
              {parsedAddress ? (
                <div className="text-sm space-y-1.5 text-gray-600">
                  <p className="font-semibold text-gray-900">{parsedAddress.recipient_name}</p>
                  <p className="text-gray-700">Điện thoại: {parsedAddress.recipient_phone}</p>
                  <p>
                    {parsedAddress.address_detail}, {parsedAddress.ward}, {parsedAddress.district}, {parsedAddress.province}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {typeof order.shipping_address === 'string' ? order.shipping_address : 'Chưa có thông tin địa chỉ'}
                </p>
              )}
              {order.customer_note && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase">Ghi chú của khách:</p>
                  <p className="text-xs text-gray-700 mt-1 italic">"{order.customer_note}"</p>
                </div>
              )}
            </div>

            {/* Thông tin thanh toán */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard size={18} className="mr-2 text-primary-600" />
                Hình thức thanh toán
              </h3>
              <div className="text-sm space-y-2.5 text-gray-600">
                <div className="flex justify-between items-center">
                  <span>Phương thức:</span>
                  <span className="font-semibold text-gray-900">
                    {order.payment_method === 'COD'
                      ? 'Thanh toán khi nhận hàng (COD)'
                      : order.payment_method === 'VNPAY'
                      ? 'Cổng thanh toán VNPay'
                      : order.payment_method === 'MOMO'
                      ? 'Ví MoMo'
                      : 'Chuyển khoản VietQR 24/7'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Trạng thái:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      order.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {order.payment_status === 'paid' ? '✓ Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>

              {/* Action Buttons nếu chưa thanh toán */}
              {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                  {order.payment_method === 'VNPAY' ? (
                    <button
                      onClick={handlePayVNPay}
                      disabled={isPayingVNPay}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
                    >
                      {isPayingVNPay ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" /> Đang kết nối VNPay...
                        </>
                      ) : (
                        <>
                          <CreditCard size={16} className="mr-2" /> Thanh toán ngay qua VNPay
                        </>
                      )}
                    </button>
                  ) : order.payment_method === 'BANK_TRANSFER' ? (
                    <button
                      onClick={handleConfirmTransfer}
                      disabled={isConfirmingTransfer}
                      className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center justify-center disabled:opacity-50"
                    >
                      {isConfirmingTransfer ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" /> Đang gửi...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} className="mr-2" /> Tôi đã chuyển khoản thành công
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handlePayVNPay}
                      disabled={isPayingVNPay}
                      className="w-full py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium transition flex items-center justify-center"
                    >
                      <CreditCard size={14} className="mr-1.5" /> Thanh toán online qua VNPay
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* VietQR Chuyển Khoản Card nếu là BANK_TRANSFER và chưa thanh toán */}
          {order.payment_method === 'BANK_TRANSFER' && order.payment_status !== 'paid' && order.status !== 'cancelled' && (
            <div className="bg-gradient-to-br from-emerald-50 via-white to-primary-50 rounded-2xl border-2 border-emerald-500/30 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="text-emerald-600" size={24} />
                <h3 className="font-bold text-gray-900 text-base">Quét mã VietQR để hoàn tất thanh toán</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* QR Code Image */}
                <div className="md:col-span-5 flex flex-col items-center justify-center bg-white p-4 rounded-xl border shadow-xs">
                  {(order as any).vietqr?.qrCodeUrl ? (
                    <img
                      src={(order as any).vietqr.qrCodeUrl}
                      alt="Mã QR Chuyển Khoản"
                      className="w-56 h-auto max-w-full rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                      Đang tải mã QR...
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Quét bằng app ngân hàng (MB, VCB, Techcombank, VPBank,...)
                  </p>
                </div>

                {/* Bank Account Details */}
                <div className="md:col-span-7 space-y-3 text-sm">
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500">Ngân hàng thụ hưởng</p>
                    <p className="font-bold text-gray-900">{(order as any).vietqr?.bankName || 'Ngân hàng Quân Đội (MB Bank)'}</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Số tài khoản</p>
                      <p className="font-mono font-bold text-gray-900 text-base">
                        {(order as any).vietqr?.accountNo || '0777498884'}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard((order as any).vietqr?.accountNo || '0777498884', 'Số tài khoản')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium flex items-center"
                    >
                      {copiedField === 'Số tài khoản' ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="mr-1" />}
                      {copiedField === 'Số tài khoản' ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500">Tên chủ tài khoản</p>
                    <p className="font-bold text-gray-900">{(order as any).vietqr?.accountName || 'NGUYEN HOANG THANH'}</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Số tiền chính xác</p>
                      <p className="font-bold text-red-600 text-base">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(String(Math.round(order.total_amount)), 'Số tiền')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium flex items-center"
                    >
                      {copiedField === 'Số tiền' ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="mr-1" />}
                      {copiedField === 'Số tiền' ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-lg border flex justify-between items-center border-amber-200 bg-amber-50/40">
                    <div>
                      <p className="text-xs text-amber-800 font-semibold">Nội dung chuyển khoản (Bắt buộc)</p>
                      <p className="font-mono font-bold text-primary-700 text-base">
                        {order.order_code}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(order.order_code, 'Nội dung')}
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium flex items-center"
                    >
                      {copiedField === 'Nội dung' ? <Check size={14} /> : <Copy size={14} className="mr-1" />}
                      {copiedField === 'Nội dung' ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>

                  <button
                    onClick={handleConfirmTransfer}
                    disabled={isConfirmingTransfer}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center shadow-md shadow-emerald-600/20"
                  >
                    {isConfirmingTransfer ? (
                      <>
                        <Loader2 size={18} className="animate-spin mr-2" /> Đang ghi nhận...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} className="mr-2" /> Tôi đã chuyển khoản xong
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {order && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          invoice={{
            order_id: order.id,
            order_code: order.order_code,
            created_at: order.created_at,
            status: order.status,
            payment_status: order.payment_status,
            payment_method: order.payment_method,
            customer_name: (order.shipping_address as any)?.recipient_name,
            customer_phone: (order.shipping_address as any)?.recipient_phone,
            customer_note: (order as any).customer_note,
            shipping_address: order.shipping_address || {},
            items: (order.items || []).map(i => ({
              id: i.id,
              name: i.product_name || (i as any).name || 'Sản phẩm',
              variant_name: i.variant_name,
              unit_price: i.unit_price,
              quantity: i.quantity,
              subtotal: i.subtotal,
            })),
            subtotal: order.subtotal,
            discount_amount: order.discount_amount,
            coupon_code: (order as any).coupon_code,
            shipping_fee: order.shipping_fee,
            total_amount: order.total_amount,
          }}
        />
      )}

      {/* Return Request Modal */}
      {order && (
        <ReturnRequestModal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          orderId={order.id}
          orderCode={order.order_code}
          onSuccess={() => {
            // Reload order and return details
            returnService.getReturnDetail(order.id).then(res => {
              if (res.data?.data) setReturnDetail(res.data.data);
            }).catch(() => {});
          }}
        />
      )}
    </div>
  );
};

export default OrderDetailPage;
