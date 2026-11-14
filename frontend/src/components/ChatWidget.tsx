import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, User, ShoppingCart, Sparkles, ChevronDown, Loader2, Brain } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { chatService } from '../services';
import { formatCurrency } from '../utils/format';
import './ChatWidget.css';

// ── Types ────────────────────────────────────────────────────
interface Product {
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  suggestions?: string[];
  is_error?: boolean;
  timestamp: Date;
}

const SESSION_KEY = '__chat_session_id__';

// ── Chat Widget Component ─────────────────────────────────────
const ChatWidget: React.FC = () => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem(SESSION_KEY) || '';
  });
  const [hasMemoryActive, setHasMemoryActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Phục hồi lịch sử hội thoại khi load trang
  useEffect(() => {
    const initChat = async () => {
      const storedSessionId = localStorage.getItem(SESSION_KEY);
      if (storedSessionId) {
        try {
          const res = await chatService.getSessionDetail(storedSessionId);
          const historyMessages = res.data.data?.messages || [];
          if (historyMessages.length > 0) {
            const mapped: Message[] = historyMessages.map((m: any) => ({
              id: m.id.toString(),
              role: m.sender_type === 'user' ? 'user' : 'assistant',
              content: m.message,
              products: m.suggested_products || [],
              timestamp: new Date(m.created_at),
            }));
            setMessages(mapped);
            return;
          }
        } catch {
          // Nếu không lấy được session cũ (đã xóa), xóa key
          localStorage.removeItem(SESSION_KEY);
          setSessionId('');
        }
      }

      // Mặc định hiển thị lời chào nếu chưa có tin nhắn
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Xin chào${user ? ` **${user.full_name}**` : ''}! 👋\n\nTôi là **AI Tư Vấn Sản Phẩm**. Tôi có thể giúp bạn:\n- 🔍 Tìm sản phẩm theo nhu cầu\n- 💰 Gợi ý theo ngân sách\n- ⚖️ So sánh sản phẩm\n- 🎯 Tư vấn phù hợp với mục đích sử dụng\n\nBạn đang cần tìm gì hôm nay?`,
        suggestions: [
          'Laptop lập trình dưới 20 triệu',
          'Điện thoại chụp ảnh đẹp khoảng 15 triệu',
          'Tai nghe chống ồn tốt nhất',
        ],
        timestamp: new Date(),
      }]);
    };

    initChat();
  }, [user]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input khi mở
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    let activeSessionId = sessionId;
    // Nếu chưa có session, tạo session mới
    if (!activeSessionId) {
      try {
        const sessionRes = await chatService.createSession();
        activeSessionId = sessionRes.data.data.session_uuid;
        setSessionId(activeSessionId);
        localStorage.setItem(SESSION_KEY, activeSessionId);
      } catch {
        activeSessionId = 'session-' + Date.now();
      }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Gửi tới API chat đã lưu DB
      const { data } = await chatService.sendMessage(activeSessionId, trimmed);
      const result = data.data;

      // Đồng bộ session_id nếu mới sinh
      if (result.session_id && result.session_id !== sessionId) {
        setSessionId(result.session_id);
        localStorage.setItem(SESSION_KEY, result.session_id);
      }

      if (result.has_memory || result.ai_message?.has_memory) {
        setHasMemoryActive(true);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.ai_message?.message || result.message || 'Dạ tôi đã ghi nhận.',
        products: result.ai_message?.products || result.products || [],
        suggestions: result.ai_message?.suggestions || result.suggestions || [],
        is_error: result.is_error,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);

    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại! 🙏',
        is_error: true,
        suggestions: ['Thử lại', 'Tìm kiếm sản phẩm'],
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleNewChat = async () => {
    localStorage.removeItem(SESSION_KEY);
    setSessionId('');
    try {
      const res = await chatService.createSession();
      if (res.data.data?.session_uuid) {
        setSessionId(res.data.data.session_uuid);
        localStorage.setItem(SESSION_KEY, res.data.data.session_uuid);
      }
    } catch {}

    setMessages([]);
    setTimeout(() => {
      setMessages([{
        id: 'welcome-new',
        role: 'assistant',
        content: 'Bắt đầu cuộc trò chuyện mới! 🌟\n\nTôi có thể giúp gì cho bạn?',
        suggestions: ['Tìm laptop gaming', 'Điện thoại dưới 10 triệu', 'Phụ kiện máy tính'],
        timestamp: new Date(),
      }]);
    }, 50);
  };

  // Render markdown đơn giản (bold, newlines)
  const renderContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="chat-widget-toggle"
        className={`chat-widget__fab ${isOpen ? 'chat-widget__fab--open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label="Mở chatbot tư vấn"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
        {!isOpen && <span className="chat-widget__fab-badge">AI</span>}
      </button>

      {/* Chat Panel */}
      <div className={`chat-widget__panel ${isOpen ? 'chat-widget__panel--open' : ''}`}>
        {/* Header */}
        <div className="chat-widget__header">
          <div className="chat-widget__header-info">
            <div className="chat-widget__avatar">
              <Bot size={18} />
            </div>
            <div>
              <p className="chat-widget__name">AI Tư Vấn</p>
              <p className="chat-widget__status">
                <span className="chat-widget__status-dot" />
                Trực tuyến
              </p>
            </div>
          </div>
          <div className="chat-widget__header-actions">
            <button
              onClick={handleNewChat}
              title="Cuộc trò chuyện mới"
              className="chat-widget__icon-btn"
            >
              <Sparkles size={16} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="chat-widget__icon-btn"
              title="Thu nhỏ"
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </div>

        {/* Personalized Memory Indicator Banner */}
        {hasMemoryActive && user && (
          <div className="bg-gradient-to-r from-primary-50 to-indigo-50 px-3.5 py-1.5 border-b border-primary-100 flex items-center justify-between text-[11px] text-primary-900 shadow-inner">
            <span className="flex items-center gap-1.5 font-medium">
              <Brain size={13} className="text-primary-600 animate-pulse" />
              AI đã ghi nhớ sở thích của bạn
            </span>
            <a
              href="/account/ai-memory"
              target="_blank"
              rel="noreferrer"
              className="text-primary-600 hover:text-primary-800 underline font-semibold ml-2"
            >
              Xem & sửa
            </a>
          </div>
        )}

        {/* Messages */}
        <div className="chat-widget__messages" id="chat-messages-container">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`chat-msg ${msg.role === 'user' ? 'chat-msg--user' : 'chat-msg--assistant'}`}
            >
              {msg.role === 'assistant' && (
                <div className="chat-msg__avatar">
                  <Bot size={14} />
                </div>
              )}

              <div className="chat-msg__body">
                {/* Bubble */}
                <div
                  className={`chat-msg__bubble ${msg.is_error ? 'chat-msg__bubble--error' : ''}`}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />

                {/* Product Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="chat-products">
                    {msg.products.map(p => (
                      <div key={p.id} className="chat-product-card">
                        <div className="chat-product-card__img-wrap">
                          {p.thumbnail_url
                            ? <img src={p.thumbnail_url} alt={p.name} />
                            : <div className="chat-product-card__img-placeholder">📦</div>
                          }
                          {p.discount_percent && p.discount_percent > 0 && (
                            <span className="chat-product-card__badge">-{p.discount_percent}%</span>
                          )}
                        </div>
                        <div className="chat-product-card__info">
                          <p className="chat-product-card__category">{p.category_name}</p>
                          <p className="chat-product-card__name">{p.name}</p>
                          <div className="chat-product-card__price">
                            <span className="chat-product-card__price-main">
                              {formatCurrency(p.sale_price || p.base_price)}
                            </span>
                            {p.sale_price && (
                              <span className="chat-product-card__price-old">
                                {formatCurrency(p.base_price)}
                              </span>
                            )}
                          </div>
                          <div className="chat-product-card__meta">
                            <span>⭐ {p.avg_rating.toFixed(1)}</span>
                            <span>·</span>
                            <span>{p.total_reviews} đánh giá</span>
                          </div>
                        </div>
                        <div className="chat-product-card__actions">
                          <a
                            href={`/product/${p.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="chat-product-card__btn chat-product-card__btn--view"
                          >
                            Xem
                          </a>
                          <button
                            onClick={() => { addToCart(p.id, 1); }}
                            className="chat-product-card__btn chat-product-card__btn--cart"
                            title="Thêm vào giỏ"
                          >
                            <ShoppingCart size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestion chips */}
                {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="chat-suggestions">
                    {msg.suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="chat-suggestion-chip"
                        onClick={() => sendMessage(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <span className="chat-msg__time">
                  {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {msg.role === 'user' && (
                <div className="chat-msg__avatar chat-msg__avatar--user">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="chat-msg chat-msg--assistant">
              <div className="chat-msg__avatar"><Bot size={14} /></div>
              <div className="chat-msg__body">
                <div className="chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-widget__input-area">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi... (Enter để gửi)"
            className="chat-widget__input"
            rows={1}
            disabled={loading}
            maxLength={2000}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="chat-widget__send-btn"
            aria-label="Gửi"
          >
            {loading ? <Loader2 size={18} className="chat-widget__spinner" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
