import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Bot, User as UserIcon, Send, Clock, Trash2,
  Sparkles, RefreshCw, ShoppingCart, Star, ExternalLink, Loader2
} from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/format';
import { chatService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

interface ProductItem {
  id: number;
  name: string;
  slug: string;
  base_price: number;
  sale_price?: number;
  discount_percent?: number;
  avg_rating: number;
  total_reviews: number;
  thumbnail_url?: string;
  category_name?: string;
}

interface ChatMessageItem {
  id: number;
  session_id: number;
  sender_type: 'user' | 'ai';
  message: string;
  suggested_products?: ProductItem[];
  created_at: string;
}

interface ChatSessionDetail {
  id: number;
  session_uuid: string;
  title: string;
  status: string;
  total_messages: number;
  created_at: string;
  updated_at: string;
}

const ChatHistoryDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [session, setSession] = useState<ChatSessionDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSessionDetail = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const res = await chatService.getSessionDetail(sessionId);
      const data = res.data.data;
      setSession(data.session);
      setMessages(data.messages || []);
      // Đồng bộ vào localStorage để ChatWidget cũng dùng session này
      if (data.session?.session_uuid) {
        localStorage.setItem('__chat_session_id__', data.session.session_uuid);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền truy cập');
      navigate('/account/chat-history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionDetail();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || !sessionId) return;

    // Optimistic user message
    const tempUserMsg: ChatMessageItem = {
      id: Date.now(),
      session_id: session?.id || 0,
      sender_type: 'user',
      message: trimmed,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await chatService.sendMessage(sessionId, trimmed);
      const data = res.data.data;

      // Cập nhật title nếu vừa đổi
      if (data.title && session) {
        setSession(s => s ? { ...s, title: data.title } : null);
      }

      // Thêm AI response
      const aiMsg: ChatMessageItem = {
        id: data.ai_message?.id || Date.now() + 1,
        session_id: session?.id || 0,
        sender_type: 'ai',
        message: data.ai_message?.message || data.message || '',
        suggested_products: data.ai_message?.products || [],
        created_at: data.ai_message?.created_at || new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      toast.error('Gặp lỗi khi gửi tin nhắn, vui lòng thử lại');
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleDelete = async () => {
    if (!sessionId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiên trò chuyện này không?')) return;

    try {
      await chatService.deleteSession(sessionId);
      toast.success('Đã xóa phiên trò chuyện');
      localStorage.removeItem('__chat_session_id__');
      navigate('/account/chat-history');
    } catch {
      toast.error('Không thể xóa phiên trò chuyện');
    }
  };

  const renderFormattedMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/account/chat-history"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ChevronLeft size={18} />
          Quay lại danh sách trò chuyện
        </Link>

        {session && (
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
          >
            <Trash2 size={14} />
            Xóa cuộc trò chuyện
          </button>
        )}
      </div>

      {/* Main Chat Box Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[75vh] overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-sm">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 truncate max-w-md">
                {session?.title || 'Đang tải thông tin...'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Trực tuyến
                </span>
                <span>•</span>
                <span>{messages.length} tin nhắn</span>
                {session?.updated_at && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(session.updated_at)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={fetchSessionDetail}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            title="Tải lại nội dung"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Message History Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Đang tải lịch sử trò chuyện...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
              <Bot size={40} className="text-gray-300 mb-2" />
              <p className="text-sm">Chưa có tin nhắn trong phiên này. Hãy gửi tin nhắn đầu tiên!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  msg.sender_type === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs ${
                    msg.sender_type === 'user' ? 'bg-primary-600' : 'bg-gray-800'
                  }`}
                >
                  {msg.sender_type === 'user' ? (
                    user?.avatar_url ? (
                      <img src={user.avatar_url} alt="User" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <UserIcon size={16} />
                    )
                  ) : (
                    <Bot size={16} />
                  )}
                </div>

                {/* Message Bubble */}
                <div className="space-y-2 max-w-[85%]">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.sender_type === 'user'
                        ? 'bg-primary-600 text-white rounded-br-none shadow-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: renderFormattedMessage(msg.message) }}
                    />
                  </div>

                  {/* Recommended Product Cards */}
                  {msg.suggested_products && msg.suggested_products.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                      {msg.suggested_products.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white border border-gray-200 rounded-xl p-3 flex gap-3 hover:border-primary-400 hover:shadow-md transition-all"
                        >
                          <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                            {p.thumbnail_url ? (
                              <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                            )}
                            {p.discount_percent && p.discount_percent > 0 ? (
                              <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded">
                                -{p.discount_percent}%
                              </span>
                            ) : null}
                          </div>

                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${p.id}`}
                              className="text-xs font-bold text-gray-900 hover:text-primary-600 line-clamp-1"
                            >
                              {p.name}
                            </Link>
                            <p className="text-sm font-bold text-primary-600 mt-0.5">
                              {formatCurrency(p.sale_price || p.base_price)}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                                {p.avg_rating || 5}
                              </span>
                              <button
                                onClick={() => addToCart(p.id, 1)}
                                className="text-xs px-2 py-1 bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white rounded-md font-medium transition-colors flex items-center gap-1"
                              >
                                <ShoppingCart size={12} />
                                Mua
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p
                    className={`text-[10px] text-gray-400 ${
                      msg.sender_type === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatDate(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {sending && (
            <div className="flex gap-3 mr-auto items-center">
              <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi để tiếp tục cuộc trò chuyện..."
            disabled={sending || loading}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending || loading}
            className="px-5 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            <span>Gửi</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatHistoryDetailPage;
