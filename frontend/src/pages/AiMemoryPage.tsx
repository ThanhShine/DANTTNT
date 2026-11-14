import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Sparkles, Trash2, Edit3, Check, X, Shield, RefreshCw,
  Package, ShoppingCart, User as UserIcon, MessageSquare, Activity, ChevronRight, AlertCircle
} from 'lucide-react';
import { userMemoryService, UserMemory, UserPreferenceSummary } from '../services';
import { formatCurrency, formatDate } from '../utils/format';
import toast from 'react-hot-toast';

// ── Sidebar Menu ─────────────────────────────────────────────
const SidebarMenu = ({ active }: { active: string }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-b">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary-900">Tùy chọn AI</p>
          <p className="text-xs text-primary-600">Bộ nhớ & Sở thích cá nhân</p>
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

const getMemoryTypeBadge = (type: string) => {
  switch (type) {
    case 'brand':
      return { label: 'Thương hiệu', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'budget':
      return { label: 'Ngân sách', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'feature':
      return { label: 'Tính năng', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'dislike':
      return { label: 'Muốn tránh', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'category':
      return { label: 'Danh mục', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    default:
      return { label: 'Sở thích', bg: 'bg-gray-50 text-gray-700 border-gray-200' };
  }
};

const formatMemoryDisplayValue = (key: string, val: string) => {
  if (key.includes('budget')) {
    const num = Number(val);
    if (!isNaN(num)) return formatCurrency(num);
  }
  return val;
};

const AiMemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [summary, setSummary] = useState<UserPreferenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [memRes, sumRes] = await Promise.all([
        userMemoryService.getMemories(),
        userMemoryService.getPreferences(),
      ]);
      setMemories(memRes.data.data || []);
      setSummary(sumRes.data.data || null);
    } catch {
      toast.error('Không thể tải bộ nhớ AI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteOne = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa thông tin ghi nhớ này?')) return;
    try {
      await userMemoryService.deleteMemory(id);
      toast.success('Đã xóa ghi nhớ thành công');
      loadData();
    } catch {
      toast.error('Lỗi khi xóa ghi nhớ');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Hành động này sẽ xóa toàn bộ ký ức và sở thích AI đã ghi nhớ về bạn. Bạn chắc chắn chứ?')) return;
    try {
      await userMemoryService.deleteAllMemories();
      toast.success('Đã làm trống toàn bộ bộ nhớ AI');
      setMemories([]);
      setSummary(null);
    } catch {
      toast.error('Lỗi khi xóa bộ nhớ');
    }
  };

  const handleStartEdit = (m: UserMemory) => {
    setEditingId(m.id);
    setEditValue(m.memory_value);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editValue.trim()) return;
    try {
      await userMemoryService.updateMemory(id, editValue.trim());
      toast.success('Cập nhật thành công');
      setEditingId(null);
      loadData();
    } catch {
      toast.error('Lỗi khi cập nhật ký ức');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb */}
        <div className="mb-6">
          <nav className="flex text-sm text-gray-500 mb-2">
            <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link to="/account" className="hover:text-primary-600">Tài khoản</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-800 font-medium">Sở thích & Ký ức AI</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="text-primary-600" size={28} />
                Bộ Nhớ & Tùy Chọn AI Cá Nhân Hóa
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Quản lý các thông tin sở thích, thương hiệu và ngân sách mà AI ghi nhớ để tư vấn sát nhu cầu của bạn.
              </p>
            </div>
            {memories.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
              >
                <Trash2 size={16} />
                Xóa toàn bộ ký ức
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SidebarMenu active="ai-memory" />

            {/* Privacy notice box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-blue-800">
                <Shield size={16} />
                Quyền riêng tư & Minh bạch
              </div>
              <p className="leading-relaxed">
                Hệ thống chỉ lưu các thông tin liên quan đến tư vấn sản phẩm (thương hiệu, khoảng giá, nhu cầu kỹ thuật).
                Dữ liệu chạy <strong>100% nội bộ trên máy chủ Local</strong> và không gửi ra internet.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Preference Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Sparkles size={120} className="text-primary-600" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  Hồ Sơ Sở Thích Tổng Hợp (AI Thấu Hiểu Bạn)
                </h2>
                <button
                  onClick={loadData}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                  title="Làm mới"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              {summary ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-100 rounded-xl">
                    <p className="text-sm font-medium text-primary-900">
                      💡 Tóm tắt nhận định của AI:
                    </p>
                    <p className="text-sm text-primary-800 mt-1 italic">
                      "{summary.summary || 'Đang cập nhật tổng quan sở thích...'}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {/* Brands */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">Thương hiệu yêu thích</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {summary.preferred_brands && summary.preferred_brands.length > 0 ? (
                          summary.preferred_brands.map((b, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-md">
                              {b}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chưa xác định</span>
                        )}
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">Ngân sách thường chọn</span>
                      <p className="text-sm font-semibold text-gray-800 mt-1">
                        {summary.price_max ? `Khoảng ${formatCurrency(summary.price_max)}` : <span className="text-xs text-gray-400 italic font-normal">Chưa xác định</span>}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">Ưu tiên cấu hình</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {summary.preferred_features && Object.keys(summary.preferred_features).length > 0 ? (
                          Object.keys(summary.preferred_features).map((f, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded-md">
                              {f === 'camera' ? '📷 Camera đẹp' : f === 'gaming' ? '🎮 Gaming tốt' : f === 'battery' ? '🔋 Pin trâu' : f}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chưa xác định</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <Brain size={36} className="mx-auto mb-2 opacity-40" />
                  Bạn chưa có hồ sơ ghi nhớ. Khi bạn trò chuyện với AI, hệ thống sẽ tự động học các sở thích của bạn!
                </div>
              )}
            </div>

            {/* Memories List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chi Tiết Các Đơn Vị Ký Ức Đang Lưu ({memories.length})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Bạn có thể chỉnh sửa trực tiếp hoặc xóa bất kỳ thông tin nào bạn không muốn AI nhớ.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                  Đang tải bộ nhớ AI...
                </div>
              ) : memories.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  <AlertCircle size={36} className="mx-auto mb-2 opacity-30" />
                  Chưa có ký ức nào được ghi nhận.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {memories.map((m) => {
                    const badge = getMemoryTypeBadge(m.memory_type);
                    const isEditing = editingId === m.id;

                    return (
                      <div key={m.id} className="p-4 sm:p-5 hover:bg-gray-50/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <div>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="px-2.5 py-1 border border-primary-500 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary-500"
                                />
                                <button
                                  onClick={() => handleSaveEdit(m.id)}
                                  className="text-emerald-600 hover:text-emerald-700 p-1"
                                  title="Lưu"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-gray-400 hover:text-gray-600 p-1"
                                  title="Hủy"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm font-semibold text-gray-900">
                                {formatMemoryDisplayValue(m.memory_key, m.memory_value)}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                              <span>Khóa: {m.memory_key}</span>
                              <span>·</span>
                              <span>Độ tin cậy: {Math.round(m.confidence * 100)}%</span>
                              <span>·</span>
                              <span>Cập nhật: {formatDate(m.updated_at)}</span>
                            </div>
                          </div>
                        </div>

                        {!isEditing && (
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => handleStartEdit(m)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                              title="Sửa ký ức"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteOne(m.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Xóa ký ức"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiMemoryPage;
