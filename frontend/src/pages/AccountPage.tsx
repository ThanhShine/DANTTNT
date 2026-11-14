import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, userService, accountService } from '../services';
import { User, LoginHistoryItem } from '../types';
import { formatDate } from '../utils/format';
import {
  User as UserIcon, Mail, Phone, MapPin, Shield, Calendar,
  Clock, Edit2, Check, X, Key, Activity, Package, ShoppingCart,
  ChevronRight, MessageSquare, Brain
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Sidebar Menu ─────────────────────────────────────────────
const SidebarMenu = ({ active }: { active: string }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-b">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
          <UserIcon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary-900">Tài khoản</p>
          <p className="text-xs text-primary-600">Quản lý tài khoản của bạn</p>
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

const getBrowser = (ua: string | null): string => {
  if (!ua) return 'Không xác định';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Trình duyệt khác';
};

// ── Main AccountPage ──────────────────────────────────────────
const AccountPage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', phone: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          authService.getProfile(),
          accountService.getLoginHistory({ limit: 10 }).catch(() => null),
        ]);

        const profileData = profileRes.data.data as User;
        setProfile(profileData);
        setEditData({ full_name: profileData.full_name || '', phone: profileData.phone || '' });

        if (historyRes?.data?.data) {
          setLoginHistory(Array.isArray(historyRes.data.data) ? historyRes.data.data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!editData.full_name.trim()) {
      toast.error('Họ tên không được để trống');
      return;
    }
    setSaving(true);
    try {
      const res = await userService.update(user!.id, {
        full_name: editData.full_name,
        phone: editData.phone,
      });
      const updated = res.data.data as User;
      updateUser({ ...user!, ...updated });
      setProfile(prev => prev ? { ...prev, ...updated } : prev);
      setIsEditing(false);
      toast.success('Cập nhật thông tin thành công');
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin' || role === 'ADMIN') return 'Quản trị viên';
    if (role === 'staff' || role === 'STAFF') return 'Nhân viên';
    return 'Khách hàng';
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin' || role === 'ADMIN') return 'bg-red-100 text-red-700';
    if (role === 'staff' || role === 'STAFF') return 'bg-blue-100 text-blue-700';
    return 'bg-green-100 text-green-700';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl h-48 animate-pulse" />
          </div>
          <div className="flex-1 bg-white rounded-xl h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <SidebarMenu active="account" />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Thông tin tài khoản */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h1 className="text-lg font-bold text-gray-900 flex items-center">
                <UserIcon size={20} className="mr-2 text-primary-600" />
                Thông tin tài khoản
              </h1>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Edit2 size={14} className="mr-1.5" />
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    <Check size={14} className="mr-1.5" />
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({ full_name: profile?.full_name || '', phone: profile?.phone || '' });
                    }}
                    className="flex items-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X size={14} className="mr-1.5" />
                    Hủy
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-5">
              {/* Họ tên */}
              <div className="flex items-start">
                <UserIcon size={18} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Họ tên</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.full_name}
                      onChange={e => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nhập họ tên"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{profile?.full_name || '—'}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start">
                <Mail size={18} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-gray-900">{profile?.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Email không thể thay đổi</p>
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="flex items-start">
                <Phone size={18} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Số điện thoại</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={e => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.phone || '—'}</p>
                  )}
                </div>
              </div>

              {/* Vai trò */}
              <div className="flex items-start">
                <Shield size={18} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Vai trò</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(profile?.role || '')}`}>
                    {getRoleLabel(profile?.role || '')}
                  </span>
                </div>
              </div>

              {/* Ngày tạo tài khoản */}
              <div className="flex items-start">
                <Calendar size={18} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ngày tạo tài khoản</p>
                  <p className="text-gray-900">{profile?.created_at ? formatDate(profile.created_at) : '—'}</p>
                </div>
              </div>

              {/* Đăng nhập gần nhất */}
              <div className="flex items-start">
                <Clock size={18} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Đăng nhập gần nhất</p>
                  <p className="text-gray-900">{profile?.last_login_at ? formatDate(profile.last_login_at) : '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lịch sử đăng nhập */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Key size={20} className="mr-2 text-primary-600" />
                Lịch sử đăng nhập
              </h2>
              <Link
                to="/account/activity"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Xem tất cả hoạt động →
              </Link>
            </div>

            <div className="overflow-x-auto">
              {loginHistory.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">
                  Chưa có lịch sử đăng nhập
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thiết bị</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loginHistory.slice(0, 10).map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-gray-700">
                          {formatDate(item.login_at)}
                        </td>
                        <td className="px-6 py-3">
                          {item.login_status === 'SUCCESS' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ✓ Thành công
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700" title={item.fail_reason || ''}>
                              ✕ Thất bại
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-gray-600">{getBrowser(item.user_agent)}</td>
                        <td className="px-6 py-3 text-gray-500 font-mono text-xs">{item.ip_address || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
