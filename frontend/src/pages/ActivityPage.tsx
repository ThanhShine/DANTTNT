import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, User as UserIcon, Package, ShoppingCart, ChevronRight,
  LogIn, LogOut, ShoppingBag, Trash2, RefreshCw, Star, Search,
  Eye, AlertCircle, MessageSquare, Brain
} from 'lucide-react';
import { formatDate } from '../utils/format';
import { accountService } from '../services';
import { UserActivityItem } from '../types';

// ── Sidebar (copy từ AccountPage) ────────────────────────────
const SidebarMenu = ({ active }: { active: string }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-b">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
          <Activity size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary-900">Lịch sử</p>
          <p className="text-xs text-primary-600">Hoạt động của tôi</p>
        </div>
      </div>
    </div>
    <nav className="p-2">
      {[
        { to: '/account', label: 'Thông tin tài khoản', icon: UserIcon, key: 'account' },
        { to: '/orders', label: 'Đơn mua', icon: Package, key: 'orders' },
        { to: '/cart', label: 'Giỏ hàng', icon: ShoppingCart, key: 'cart' },
        { to: '/account/chat-history', label: 'Lịch sử trò chuyện', icon: MessageSquare, key: 'chat-history' },
        { to: '/account/ai-memory', label: 'Sở thích & Ký ức AI', icon: Brain, key: 'ai-memory' },
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

// ── Action Icon & Color map ───────────────────────────────────
const getActionMeta = (actionType: string) => {
  const map: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    LOGIN:            { icon: <LogIn size={16} />,       color: 'text-green-600 bg-green-100',   label: 'Đăng nhập' },
    LOGOUT:           { icon: <LogOut size={16} />,      color: 'text-gray-600 bg-gray-100',     label: 'Đăng xuất' },
    ADD_TO_CART:      { icon: <ShoppingCart size={16} />,color: 'text-blue-600 bg-blue-100',     label: 'Thêm vào giỏ' },
    REMOVE_FROM_CART: { icon: <Trash2 size={16} />,      color: 'text-red-600 bg-red-100',       label: 'Xóa khỏi giỏ' },
    UPDATE_CART:      { icon: <RefreshCw size={16} />,   color: 'text-orange-600 bg-orange-100', label: 'Cập nhật giỏ' },
    CLEAR_CART:       { icon: <Trash2 size={16} />,      color: 'text-red-600 bg-red-100',       label: 'Xóa giỏ hàng' },
    CREATE_ORDER:     { icon: <ShoppingBag size={16} />, color: 'text-purple-600 bg-purple-100', label: 'Đặt đơn hàng' },
    CANCEL_ORDER:     { icon: <AlertCircle size={16} />, color: 'text-red-600 bg-red-100',       label: 'Hủy đơn hàng' },
    REVIEW_PRODUCT:   { icon: <Star size={16} />,        color: 'text-yellow-600 bg-yellow-100', label: 'Đánh giá' },
    VIEW_PRODUCT:     { icon: <Eye size={16} />,         color: 'text-gray-600 bg-gray-100',     label: 'Xem sản phẩm' },
    SEARCH_PRODUCT:   { icon: <Search size={16} />,      color: 'text-gray-600 bg-gray-100',     label: 'Tìm kiếm' },
  };
  return map[actionType] || {
    icon: <Activity size={16} />,
    color: 'text-gray-600 bg-gray-100',
    label: actionType,
  };
};

const ActivityPage = () => {
  const [activities, setActivities] = useState<UserActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const res = await accountService.getActivity({ page, limit });
        if (res.data.success && res.data.data) {
          setActivities(res.data.data);
          if (res.data.meta) {
            setTotalPages(res.data.meta.totalPages || 1);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <SidebarMenu active="activity" />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h1 className="text-lg font-bold text-gray-900 flex items-center">
                <Activity size={20} className="mr-2 text-primary-600" />
                Lịch sử hoạt động
              </h1>
              <p className="text-sm text-gray-500 mt-1">Tất cả các hoạt động gần đây của bạn</p>
            </div>

            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Activity size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Chưa có hoạt động nào được ghi nhận</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activities.map((item, idx) => {
                  const meta = getActionMeta(item.action_type);
                  return (
                    <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-4">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                            {meta.icon}
                          </div>
                          {idx < activities.length - 1 && (
                            <div className="w-px h-full bg-gray-100 mt-1 min-h-[16px]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{item.description || meta.label}</p>
                            <span className="text-xs text-gray-400 ml-4 flex-shrink-0">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                          {item.entity_type && item.entity_id && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.entity_type === 'product' && (
                                <Link to={`/product/${item.entity_id}`} className="text-primary-600 hover:underline">
                                  Xem sản phẩm →
                                </Link>
                              )}
                              {item.entity_type === 'order' && (
                                <Link to={`/orders/${item.entity_id}`} className="text-primary-600 hover:underline">
                                  Xem đơn hàng →
                                </Link>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex justify-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Trước
                </button>
                <span className="px-4 py-1.5 text-sm text-gray-600">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Tiếp →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
