import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare, User as UserIcon, Package, ShoppingCart, Activity,
  ChevronRight, Trash2, Clock, Sparkles, AlertCircle, ArrowRight,
  Bot, RefreshCw
} from 'lucide-react';
import { formatDate } from '../utils/format';
import { chatService } from '../services';
import toast from 'react-hot-toast';

// ── Sidebar Menu ─────────────────────────────────────────────
const SidebarMenu = ({ active }: { active: string }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-b">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary-900">Lịch sử AI</p>
          <p className="text-xs text-primary-600">Trò chuyện & Tư vấn</p>
        </div>
      </div>
    </div>
    <nav className="p-2">
      {[
        { to: '/account', label: 'Thông tin tài khoản', icon: UserIcon, key: 'account' },
        { to: '/orders', label: 'Đơn mua', icon: Package, key: 'orders' },
        { to: '/cart', label: 'Giỏ hàng', icon: ShoppingCart, key: 'cart' },
        { to: '/account/chat-history', label: 'Lịch sử trò chuyện', icon: MessageSquare, key: 'chat-history' },
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

interface ChatSessionItem {
  id: number;
  session_uuid: string;
  title: string;
  status: string;
  total_messages: number;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_sender?: 'user' | 'ai';
}

const ChatHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await chatService.getSessions({ limit: 50 });
      setSessions(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể tải lịch sử trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (e: React.MouseEvent, sessionId: string, dbId: number) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiên trò chuyện này không?')) return;

    try {
      setDeletingId(dbId);
      await chatService.deleteSession(sessionId);
      toast.success('Đã xóa phiên trò chuyện');
      setSessions(prev => prev.filter(s => s.id !== dbId));
    } catch {
      toast.error('Không thể xóa phiên trò chuyện');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartNewChat = async () => {
    try {
      const res = await chatService.createSession('Tư vấn sản phẩm mới');
      const newSession = res.data.data;
      localStorage.setItem('__chat_session_id__', newSession.session_uuid);
      navigate(`/account/chat-history/${newSession.session_uuid}`);
    } catch {
      toast.error('Không thể khởi tạo phiên trò chuyện mới');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to="/account" className="hover:text-primary-600">Tài khoản</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">Lịch sử trò chuyện</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <SidebarMenu active="chat-history" />
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                  <Bot size={22} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Lịch sử trò chuyện với AI</h1>
                  <p className="text-sm text-gray-500">Xem lại và tiếp tục các phiên tư vấn sản phẩm trước đây</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSessions}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Làm mới"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={handleStartNewChat}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <Sparkles size={16} />
                <span>Cuộc trò chuyện mới</span>
              </button>
            </div>
          </div>

          {/* Sessions List */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-400">
              <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Đang tải danh sách cuộc trò chuyện...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Chưa có cuộc trò chuyện nào</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                Bạn chưa trò chuyện với AI Tư Vấn. Hãy bắt đầu hỏi AI để tìm kiếm và lựa chọn sản phẩm phù hợp nhất!
              </p>
              <button
                onClick={handleStartNewChat}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
              >
                <Sparkles size={16} />
                Bắt đầu trò chuyện ngay
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/account/chat-history/${s.session_uuid}`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary-300 hover:shadow-md p-5 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-green-500" title="Trạng thái: Hoạt động" />
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                        {s.title || 'Cuộc trò chuyện tư vấn'}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                        {s.total_messages} tin nhắn
                      </span>
                    </div>

                    {/* Last message preview */}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {s.last_message ? (
                        <>
                          <span className="font-semibold text-gray-700">
                            {s.last_sender === 'user' ? 'Bạn: ' : 'AI: '}
                          </span>
                          {s.last_message}
                        </>
                      ) : (
                        <span className="italic text-gray-400">Chưa có tin nhắn nào trong phiên này</span>
                      )}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        Cập nhật: {formatDate(s.updated_at || s.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <button
                      onClick={(e) => handleDelete(e, s.session_uuid, s.id)}
                      disabled={deletingId === s.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa phiên trò chuyện"
                    >
                      <Trash2 size={16} />
                    </button>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 group-hover:translate-x-1 transition-transform">
                      Xem chi tiết
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryPage;
