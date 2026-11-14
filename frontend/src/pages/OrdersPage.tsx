import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services';
import { Order } from '../types';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '../utils/format';
import { Package, ChevronRight, User as UserIcon, ShoppingCart, Activity, Eye, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Sidebar ───────────────────────────────────────────────────
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

// ── Status Filter ─────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];

// ── OrdersPage ────────────────────────────────────────────────
const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await orderService.getMyOrders(params);
      setOrders((res.data.data as Order[]) || []);
    } catch {
      console.error('Lỗi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const handleCancel = async (orderId: number) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    setCancellingId(orderId);
    try {
      await orderService.cancel(orderId, 'Khách hàng hủy đơn');
      toast.success('Hủy đơn hàng thành công');
      fetchOrders();
    } catch {
      toast.error('Không thể hủy đơn hàng');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <SidebarMenu active="orders" />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h1 className="text-lg font-bold text-gray-900 flex items-center">
                <Package size={20} className="mr-2 text-primary-600" />
                Đơn mua
              </h1>

              {/* Status tabs */}
              <div className="flex space-x-1 mt-4 overflow-x-auto pb-1">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                      statusFilter === f.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">
                  {statusFilter ? `Không có đơn hàng ${getStatusText(statusFilter as Order['status'])}` : 'Bạn chưa có đơn hàng nào'}
                </p>
                <Link to="/products" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
                  Mua sắm ngay
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {orders.map(order => (
                  <div key={order.id} className="p-6">
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">
                          Đơn hàng #{order.order_code}
                        </span>
                        <span className="text-gray-400 text-xs ml-3">{formatDate(order.created_at)}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    {/* Order Items (max 3) */}
                    <div className="space-y-3 mb-4">
                      {order.items?.slice(0, 3).map(item => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border">
                            {item.product_image ? (
                              <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Package size={20} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{item.product_name}</p>
                            <p className="text-xs text-gray-500">
                              x{item.quantity}
                              {item.variant_name ? ` · ${item.variant_name}` : ''}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900 flex-shrink-0">
                            {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <p className="text-xs text-gray-500 pl-15">
                          +{(order.items?.length || 0) - 3} sản phẩm khác
                        </p>
                      )}
                    </div>

                    {/* Order Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-sm text-gray-500">Tổng tiền: </span>
                        <span className="text-base font-bold text-red-600">{formatCurrency(order.total_amount)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {['pending', 'processing'].includes(order.status) && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={cancellingId === order.id}
                            className="flex items-center px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={14} className="mr-1" />
                            Hủy đơn
                          </button>
                        )}
                        <Link
                          to={`/orders/${order.id}`}
                          className="flex items-center px-4 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <Eye size={14} className="mr-1" />
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
