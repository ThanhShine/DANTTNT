import React, { useEffect, useState } from 'react';
import {
  MessageSquare, Users, BarChart3, Clock, Eye, X, Bot,
  User as UserIcon, Calendar, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';
import { formatDate } from '../../utils/format';
import { chatService } from '../../services';
import toast from 'react-hot-toast';

interface SummaryStats {
  total_sessions: number;
  total_messages: number;
  total_users: number;
}

interface TopUser {
  user_id: number;
  full_name: string;
  email: string;
  session_count: number;
  message_count: number;
  last_active: string;
}

interface RecentSession {
  id: number;
  session_uuid: string;
  title: string;
  status: string;
  total_messages: number;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_email: string | null;
  last_message: string | null;
}

interface CommonTopic {
  title: string;
  count: number;
}

const ChatStats: React.FC = () => {
  const [summary, setSummary] = useState<SummaryStats>({ total_sessions: 0, total_messages: 0, total_users: 0 });
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [commonTopics, setCommonTopics] = useState<CommonTopic[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal xem chi tiết phiên chat (Read-only)
  const [selectedSessionUuid, setSelectedSessionUuid] = useState<string | null>(null);
  const [selectedSessionData, setSelectedSessionData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await chatService.getAdminStats();
      const data = res.data.data;
      setSummary(data.summary || { total_sessions: 0, total_messages: 0, total_users: 0 });
      setTopUsers(data.top_users || []);
      setRecentSessions(data.recent_sessions || []);
      setCommonTopics(data.common_topics || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể tải thống kê Chatbot');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetailModal = async (sessionUuid: string) => {
    setSelectedSessionUuid(sessionUuid);
    try {
      setModalLoading(true);
      const res = await chatService.getSessionDetail(sessionUuid);
      setSelectedSessionData(res.data.data);
    } catch {
      toast.error('Không thể tải nội dung phiên trò chuyện');
      setSelectedSessionUuid(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedSessionUuid(null);
    setSelectedSessionData(null);
  };

  const renderContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="text-primary-600" size={28} />
            Thống kê & Giám sát AI Chatbot
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi lưu lượng trò chuyện, chủ đề khách hàng quan tâm và người dùng tương tác nhiều nhất
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm self-start"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Tổng phiên chat</span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{summary.total_sessions}</p>
          <p className="text-xs text-gray-400 mt-1">Toàn bộ cuộc hội thoại đã tạo</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Tổng số tin nhắn</span>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{summary.total_messages}</p>
          <p className="text-xs text-gray-400 mt-1">Cả tin nhắn User và AI</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Người dùng đã đăng nhập</span>
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{summary.total_users}</p>
          <p className="text-xs text-gray-400 mt-1">User tương tác có tài khoản</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Trung bình tin/phiên</span>
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {summary.total_sessions > 0
              ? (summary.total_messages / summary.total_sessions).toFixed(1)
              : 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Độ sâu cuộc hội thoại</p>
        </div>
      </div>

      {/* Common Topics */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          Các chủ đề khách hàng thường hỏi nhiều nhất
        </h2>
        {commonTopics.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có đủ dữ liệu chủ đề.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {commonTopics.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm bg-gray-50 text-gray-700 border border-gray-200"
              >
                <span className="font-medium">{topic.title}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-700 font-bold">
                  {topic.count}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Users Table */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary-600" />
            Top Users dùng Chatbot nhiều
          </h2>
          <div className="flex-1 overflow-y-auto">
            {topUsers.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Chưa có user tương tác.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {topUsers.map((u, i) => (
                  <div key={u.user_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        #{i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {u.message_count} tin
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">{u.session_count} phiên</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary-600" />
            Các phiên trò chuyện gần đây (Chỉ đọc)
          </h2>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Tiêu đề / Chủ đề</th>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3 text-center">Số tin</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Chưa có phiên trò chuyện nào.
                    </td>
                  </tr>
                ) : (
                  recentSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="font-medium text-gray-900 truncate">{s.title || 'Cuộc trò chuyện'}</p>
                        {s.last_message && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{s.last_message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.user_name ? (
                          <div>
                            <p className="text-sm font-medium text-gray-800">{s.user_name}</p>
                            <p className="text-[11px] text-gray-400">{s.user_email}</p>
                          </div>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Khách vãng lai</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                          {s.total_messages}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(s.updated_at || s.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenDetailModal(s.session_uuid)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Read-Only Modal xem chi tiết nội dung cuộc trò chuyện */}
      {selectedSessionUuid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {selectedSessionData?.session?.title || 'Chi tiết cuộc trò chuyện'}
                  </h3>
                  <p className="text-xs text-gray-500">Chế độ xem quản trị (Chỉ đọc - Read only)</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {modalLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm">Đang tải tin nhắn...</p>
                </div>
              ) : selectedSessionData?.messages?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Không có tin nhắn nào trong phiên này.</p>
              ) : (
                selectedSessionData?.messages?.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-xl ${
                      msg.sender_type === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 ${
                        msg.sender_type === 'user' ? 'bg-primary-600' : 'bg-gray-800'
                      }`}
                    >
                      {msg.sender_type === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                    </div>

                    <div className="space-y-1 max-w-[85%]">
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm ${
                          msg.sender_type === 'user'
                            ? 'bg-primary-600 text-white rounded-br-none shadow-sm'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <div dangerouslySetInnerHTML={{ __html: renderContent(msg.message) }} />
                      </div>
                      <p className={`text-[10px] text-gray-400 ${msg.sender_type === 'user' ? 'text-right' : 'text-left'}`}>
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
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

export default ChatStats;
