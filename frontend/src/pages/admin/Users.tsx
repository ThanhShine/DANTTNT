import React, { useEffect, useState, useCallback } from 'react';
import { Search, Shield, ShieldOff, Trash2, Eye, X, Activity, ShoppingCart, Clock, Bot } from 'lucide-react';
import { adminService } from '../../services';
import { User } from '../../types';
import toast from 'react-hot-toast';

const ROLE_VN: Record<string, string> = { admin: 'Admin', staff: 'Nhân viên', customer: 'Khách hàng' };
const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN');
const fmtTime = (s: string) => new Date(s).toLocaleString('vi-VN');

interface ActivityItem {
  id: number;
  action_type: string;
  description: string;
  entity_type?: string;
  entity_id?: number;
  created_at: string;
}

interface CartHistoryItem {
  id: number;
  action_type: string;
  quantity: number;
  old_quantity: number;
  created_at: string;
  product_name: string;
  product_id?: number;
  thumbnail_url?: string;
}

interface LoginHistoryItem {
  id: number;
  login_at: string;
  logout_at?: string;
  ip_address: string;
  user_agent: string;
  login_status: string;
  fail_reason?: string;
}

const ACTION_MAP: Record<string, { label: string; color: string }> = {
  ADD_TO_CART: { label: 'Thêm vào giỏ', color: 'bg-green-100 text-green-800' },
  UPDATE_QUANTITY: { label: 'Đổi số lượng', color: 'bg-blue-100 text-blue-800' },
  REMOVE_FROM_CART: { label: 'Xóa khỏi giỏ', color: 'bg-red-100 text-red-800' },
  CLEAR_CART: { label: 'Xóa giỏ hàng', color: 'bg-gray-100 text-gray-800' },
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal lịch sử chi tiết người dùng
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'cart' | 'login' | 'chat'>('activity');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [cartHistory, setCartHistory] = useState<CartHistoryItem[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ search: search || undefined, role: role || undefined, page, limit: 15 });
      setUsers(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, [search, role, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const loadUserHistory = useCallback(async (user: User, tab: 'activity' | 'cart' | 'login' | 'chat') => {
    setHistoryLoading(true);
    try {
      if (tab === 'activity') {
        const res = await adminService.getUserActivity(user.id);
        setActivities((res.data.data as ActivityItem[]) || []);
      } else if (tab === 'cart') {
        const res = await adminService.getUserCartHistory(user.id);
        setCartHistory((res.data.data as CartHistoryItem[]) || []);
      } else if (tab === 'login') {
        const res = await adminService.getUserLoginHistory(user.id);
        setLoginHistory((res.data.data as LoginHistoryItem[]) || []);
      } else if (tab === 'chat') {
        const res = await adminService.getUserChatHistory(user.id);
        setChatHistory((res.data.data as any[]) || []);
      }
    } catch {
      toast.error('Không thể tải lịch sử người dùng');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const openHistoryModal = (user: User) => {
    setSelectedUser(user);
    setActiveTab('activity');
    loadUserHistory(user, 'activity');
  };

  const handleTabChange = (tab: 'activity' | 'cart' | 'login' | 'chat') => {
    setActiveTab(tab);
    if (selectedUser) {
      loadUserHistory(selectedUser, tab);
    }
  };

  const handleToggle = async (id: number, name: string) => {
    try {
      await adminService.toggleUserStatus(id);
      toast.success(`Đã thay đổi trạng thái ${name}`);
      fetchUsers();
    } catch { /* handled */ }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Xác nhận khóa tài khoản "${name}"?`)) return;
    try {
      await adminService.deleteUser(id);
      toast.success(`Đã khóa tài khoản ${name}`);
      fetchUsers();
    } catch { /* handled */ }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Quản lý Người dùng & Lịch sử Hoạt động</h1>
        <p className="admin-page__subtitle">Tổng cộng {users.length} người dùng trong hệ thống</p>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-box__icon" />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="admin-search-box__input"
          />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="admin-select">
          <option value="">Tất cả role</option>
          <option value="admin">Admin</option>
          <option value="staff">Nhân viên</option>
          <option value="customer">Khách hàng</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-card">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Role</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">{u.full_name?.[0]?.toUpperCase()}</div>
                        <span className="font-medium text-gray-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className={`admin-role-badge admin-role-badge--${u.role}`}>
                        {ROLE_VN[u.role] || u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status ${u.is_active ? 'admin-status--delivered' : 'admin-status--cancelled'}`}>
                        {u.is_active ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td>{fmtDate(u.created_at)}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-action-btn admin-action-btn--primary"
                          title="Xem lịch sử hoạt động & giỏ hàng"
                          onClick={() => openHistoryModal(u)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="admin-action-btn admin-action-btn--info"
                          title={u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                          onClick={() => handleToggle(u.id, u.full_name)}
                        >
                          {u.is_active ? <ShieldOff size={15} /> : <Shield size={15} />}
                        </button>
                        <button
                          className="admin-action-btn admin-action-btn--danger"
                          title="Khóa tài khoản"
                          onClick={() => handleDelete(u.id, u.full_name)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="admin-pagination__btn">Trước</button>
            <span className="admin-pagination__info">Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="admin-pagination__btn">Sau</button>
          </div>
        )}
      </div>

      {/* MODAL XEM CHI TIẾT LỊCH SỬ HOẠT ĐỘNG VÀ GIỎ HÀNG */}
      {selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal--large max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header modal */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>Lịch sử tài khoản:</span>
                  <span className="text-primary-600">{selectedUser.full_name}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedUser.email} &bull; ID: #{selectedUser.id}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 px-6 bg-white gap-6">
              <button
                onClick={() => handleTabChange('activity')}
                className={`py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'activity'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Activity size={16} />
                Lịch sử hoạt động ({activities.length})
              </button>
              <button
                onClick={() => handleTabChange('cart')}
                className={`py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'cart'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <ShoppingCart size={16} />
                Lịch sử mua hàng({cartHistory.length})
              </button>
              <button
                onClick={() => handleTabChange('login')}
                className={`py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'login'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Clock size={16} />
                Lịch sử đăng nhập ({loginHistory.length})
              </button>
              <button
                onClick={() => handleTabChange('chat')}
                className={`py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'chat'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Bot size={16} />
                Lịch sử Chatbot ({chatHistory.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <div className="admin-spinner mb-3" />
                  <p className="text-sm">Đang tải lịch sử...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: HOẠT ĐỘNG */}
                  {activeTab === 'activity' && (
                    <div>
                      {activities.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">Chưa có bản ghi hoạt động nào.</div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {activities.map((a) => (
                            <div key={a.id} className="py-3 flex justify-between items-start gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                                    {a.action_type}
                                  </span>
                                  {a.entity_type && (
                                    <span className="text-xs text-gray-400">
                                      ({a.entity_type} #{a.entity_id})
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-800 mt-1">{a.description}</p>
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">{fmtTime(a.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: LỊCH SỬ GIỎ HÀNG */}
                  {activeTab === 'cart' && (
                    <div>
                      {cartHistory.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">Tài khoản này chưa có thao tác giỏ hàng nào.</div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {cartHistory.map((item) => {
                            const badge = ACTION_MAP[item.action_type] || { label: item.action_type, color: 'bg-gray-100 text-gray-700' };
                            return (
                              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  {item.thumbnail_url ? (
                                    <img
                                      src={item.thumbnail_url}
                                      alt={item.product_name}
                                      className="w-11 h-11 rounded-lg object-cover border border-gray-200"
                                    />
                                  ) : (
                                    <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                      <ShoppingCart size={18} />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{item.product_name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                                        {badge.label}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        Số lượng: <strong className="text-gray-900">{item.quantity}</strong>
                                        {item.old_quantity !== null && item.old_quantity !== undefined && (
                                          <span className="text-gray-400 line-through ml-1.5">{item.old_quantity}</span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">{fmtTime(item.created_at)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: ĐĂNG NHẬP */}
                  {activeTab === 'login' && (
                    <div>
                      {loginHistory.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">Chưa có lịch sử đăng nhập nào.</div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {loginHistory.map((l) => (
                            <div key={l.id} className="py-3 flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${l.login_status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {l.login_status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                                  </span>
                                  <span className="text-xs font-mono text-gray-600">{l.ip_address}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 max-w-lg truncate">{l.user_agent}</p>
                                {l.fail_reason && <p className="text-xs text-red-500 mt-0.5">{l.fail_reason}</p>}
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">{fmtTime(l.login_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: LỊCH SỬ CHATBOT */}
                  {activeTab === 'chat' && (
                    <div>
                      {chatHistory.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">Người dùng này chưa có phiên trò chuyện nào với Chatbot.</div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {chatHistory.map((c) => (
                            <div key={c.id} className="py-3.5 flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                                    {c.title || 'Cuộc trò chuyện'}
                                  </h4>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                                    {c.total_messages} tin
                                  </span>
                                </div>
                                {c.last_message && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.last_message}</p>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                {fmtTime(c.updated_at || c.created_at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer modal */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
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

export default Users;
