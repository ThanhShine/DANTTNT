import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../config/database';
import { sendSuccess, sendCreated, sendBadRequest, sendUnauthorized, sendForbidden, sendNotFound, getPagination, paginate } from '../utils/helpers';
import { config } from '../config';

const AI_SERVICE_URL = config.aiService.url;
const AI_TIMEOUT_MS = 50_000;

// Hàm tạo title ngắn gọn, có nghĩa từ tin nhắn đầu tiên
const generateTitleFromMessage = (text: string): string => {
  const cleaned = text.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return 'Cuộc trò chuyện mới';

  // Nhận diện một số mẫu câu thông dụng
  const lower = cleaned.toLowerCase();
  if (lower.includes('laptop')) {
    if (lower.includes('gaming')) return 'Tư vấn laptop gaming';
    if (lower.includes('lập trình') || lower.includes('dev') || lower.includes('code')) return 'Tư vấn laptop lập trình';
    if (lower.includes('văn phòng')) return 'Tư vấn laptop văn phòng';
    return 'Tư vấn laptop';
  }
  if (lower.includes('điện thoại') || lower.includes('smartphone') || lower.includes('iphone') || lower.includes('samsung')) {
    return 'Tư vấn điện thoại';
  }
  if (lower.includes('tai nghe') || lower.includes('headphone') || lower.includes('earphone')) {
    return 'Tư vấn tai nghe';
  }
  if (lower.includes('so sánh')) {
    return 'So sánh sản phẩm';
  }
  if (lower.includes('bảo hành') || lower.includes('đổi trả')) {
    return 'Hỏi về bảo hành & đổi trả';
  }
  if (lower.includes('đơn hàng') || lower.includes('vận chuyển') || lower.includes('giao hàng')) {
    return 'Hỏi về vận chuyển & đơn hàng';
  }

  // Cắt ngắn nếu dài quá 50 ký tự
  if (cleaned.length <= 45) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned.slice(0, 42).trim() + '...';
};

// ── 1. POST /api/chat/sessions — Tạo session mới ───────────────
export const createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId || null;
    const { title } = req.body;
    const sessionUuid = uuidv4();
    const sessionTitle = title?.trim() || 'Cuộc trò chuyện mới';

    const result = await execute(
      `INSERT INTO chat_sessions (session_uuid, user_id, title, status, total_messages, created_at, updated_at)
       VALUES (?, ?, ?, 'active', 0, NOW(), NOW())`,
      [sessionUuid, userId, sessionTitle]
    ) as ResultSetHeader;

    const newSession = {
      id: result.insertId,
      session_uuid: sessionUuid,
      title: sessionTitle,
      status: 'active',
      total_messages: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    sendCreated(res, newSession, 'Tạo phiên trò chuyện thành công');
  } catch (error) {
    next(error);
  }
};

// ── 2. GET /api/chat/sessions — Lấy danh sách session của user hiện tại ──
export const getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendUnauthorized(res, 'Vui lòng đăng nhập để xem lịch sử trò chuyện');
      return;
    }

    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);

    // Lấy danh sách session kèm tin nhắn gần nhất
    const sessions = await query<RowDataPacket>(
      `SELECT 
         s.id,
         s.session_uuid,
         s.title,
         s.status,
         s.total_messages,
         s.created_at,
         s.updated_at,
         (
           SELECT m.message 
           FROM chat_messages m 
           WHERE m.session_id = s.id 
           ORDER BY m.created_at DESC 
           LIMIT 1
         ) AS last_message,
         (
           SELECT m.sender_type 
           FROM chat_messages m 
           WHERE m.session_id = s.id 
           ORDER BY m.created_at DESC 
           LIMIT 1
         ) AS last_sender
       FROM chat_sessions s
       WHERE s.user_id = ?
       ORDER BY s.updated_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const totalRow = await queryOne<RowDataPacket>(
      'SELECT COUNT(*) AS total FROM chat_sessions WHERE user_id = ?',
      [userId]
    );
    const total = totalRow?.total || 0;

    sendSuccess(res, sessions, 'Lấy danh sách phiên trò chuyện thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── 3. GET /api/chat/sessions/:sessionId — Lấy toàn bộ tin nhắn ──
export const getSessionDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = String(req.params.sessionId || '');
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Tìm session theo numeric id hoặc session_uuid
    const isNumericId = /^\d+$/.test(sessionId);

    const session = await queryOne<RowDataPacket>(
      isNumericId
        ? `SELECT id, session_uuid, user_id, title, status, total_messages, created_at, updated_at FROM chat_sessions WHERE id = ?`
        : `SELECT id, session_uuid, user_id, title, status, total_messages, created_at, updated_at FROM chat_sessions WHERE session_uuid = ?`,
      [sessionId]
    );

    if (!session) {
      sendNotFound(res, 'Không tìm thấy phiên trò chuyện');
      return;
    }

    // Bảo mật: Kiểm tra quyền sở hữu session
    // Admin có thể xem (read-only), nhưng customer chỉ được xem của chính mình
    if (session.user_id && session.user_id !== userId && userRole !== 'admin') {
      sendForbidden(res, 'Bạn không có quyền truy cập phiên trò chuyện này');
      return;
    }

    // Lấy toàn bộ tin nhắn của session theo thứ tự thời gian tăng dần
    const messages = await query<RowDataPacket>(
      `SELECT id, session_id, sender_type, message, suggested_products, created_at
       FROM chat_messages
       WHERE session_id = ?
       ORDER BY created_at ASC`,
      [session.id]
    );

    sendSuccess(res, {
      session: {
        id: session.id,
        session_uuid: session.session_uuid,
        title: session.title,
        status: session.status,
        total_messages: session.total_messages,
        created_at: session.created_at,
        updated_at: session.updated_at,
      },
      messages: messages.map(m => ({
        id: m.id,
        session_id: m.session_id,
        sender_type: m.sender_type,
        message: m.message,
        suggested_products: typeof m.suggested_products === 'string' ? JSON.parse(m.suggested_products) : m.suggested_products,
        created_at: m.created_at,
      })),
    }, 'Lấy chi tiết phiên trò chuyện thành công');
  } catch (error) {
    next(error);
  }
};

// ── 4. POST /api/chat/sessions/:sessionId/messages — Gửi tin nhắn và nhận AI response ──
export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user?.userId || null;
    const userRole = req.user?.role;

    if (!message || typeof message !== 'string' || !message.trim()) {
      sendBadRequest(res, 'Nội dung tin nhắn không được để trống');
      return;
    }

    if (message.length > 2000) {
      sendBadRequest(res, 'Nội dung tin nhắn quá dài (tối đa 2000 ký tự)');
      return;
    }

    // 1. Kiểm tra session hiện tại
    const sessionStr = String(sessionId || '');
    const isNumericId = /^\d+$/.test(sessionStr);
    let session: any = await queryOne<RowDataPacket>(
      isNumericId
        ? `SELECT id, session_uuid, user_id, title, status, total_messages FROM chat_sessions WHERE id = ?`
        : `SELECT id, session_uuid, user_id, title, status, total_messages FROM chat_sessions WHERE session_uuid = ?`,
      [sessionStr]
    );

    if (!session) {
      // Nếu session_uuid gửi từ client chưa có trong DB, tự động tạo mới
      const newUuid = sessionStr.length >= 20 ? sessionStr : uuidv4();
      const generatedTitle = generateTitleFromMessage(message);
      const insertRes = await execute(
        `INSERT INTO chat_sessions (session_uuid, user_id, title, status, total_messages, created_at, updated_at)
         VALUES (?, ?, ?, 'active', 0, NOW(), NOW())`,
        [newUuid, userId, generatedTitle]
      ) as ResultSetHeader;

      session = {
        id: insertRes.insertId,
        session_uuid: newUuid,
        user_id: userId,
        title: generatedTitle,
        status: 'active',
        total_messages: 0,
      };
    } else {
      // Bảo mật: Nếu session có user_id khác với user hiện tại
      if (session.user_id && session.user_id !== userId && userRole !== 'admin') {
        sendForbidden(res, 'Bạn không có quyền gửi tin nhắn vào phiên trò chuyện này');
        return;
      }

      // Nếu session chưa gắn user_id (tạo lúc chưa đăng nhập) mà nay user đã đăng nhập → gắn vào user
      if (!session.user_id && userId) {
        await execute('UPDATE chat_sessions SET user_id = ? WHERE id = ?', [userId, session.id]);
        session.user_id = userId;
      }
    }

    const trimmedUserMsg = message.trim();

    // 2. Lưu tin nhắn của user vào chat_messages
    const userMsgResult = await execute(
      `INSERT INTO chat_messages (session_id, sender_type, message, created_at)
       VALUES (?, 'user', ?, NOW())`,
      [session.id, trimmedUserMsg]
    ) as ResultSetHeader;

    // Ghi nhận behavior của user (Section 12)
    if (userId) {
      try {
        await execute(
          `INSERT INTO nhat_ky_hoat_dong_nguoi_dung (ma_nguoi_dung, loai_hanh_dong, mo_ta, loai_doi_tuong, ma_doi_tuong, dia_chi_ip, trinh_duyet_thiet_bi)
           VALUES (?, 'CHAT_PRODUCT_QUERY', ?, 'chat_sessions', ?, ?, ?)`,
          [
            userId,
            `Hỏi Chatbot: ${trimmedUserMsg.slice(0, 150)}`,
            session.id,
            req.ip || null,
            req.headers['user-agent'] || null
          ]
        );
      } catch (behErr) {
        console.warn('Logging user activity notice:', (behErr as Error).message);
      }
    }

    // 3. Lấy Context hội thoại từ chat_messages để AI hiểu ngữ cảnh (Section 5)
    // Chỉ lấy lịch sử trước đó của session hiện tại (loại trừ tin nhắn vừa insert), giới hạn 14 tin gần nhất
    const contextRows = await query<RowDataPacket>(
      `SELECT sender_type, message
       FROM chat_messages
       WHERE session_id = ? AND id != ?
       ORDER BY created_at DESC
       LIMIT 14`,
      [session.id, userMsgResult.insertId]
    );

    // Format cho OpenAI / AI Service: role: 'user' | 'assistant'
    const conversationHistory = contextRows.reverse().map((r: RowDataPacket) => ({
      role: r.sender_type === 'user' ? 'user' : 'assistant',
      content: r.message,
    }));

    // 4. Gọi Python AI Service
    let aiResponse = {
      message: 'Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! 🙏',
      products: [] as any[],
      suggestions: ['Tìm sản phẩm bán chạy', 'Gợi ý laptop', 'Xem khuyến mãi'],
      intent: 'general',
      tokens_used: 0,
      is_error: false,
    };

    try {
      const { data } = await axios.post(
        `${AI_SERVICE_URL}/api/ai/chat`,
        {
          message: trimmedUserMsg,
          session_id: session.session_uuid,
          conversation_history: conversationHistory,
          user_id: userId,
        },
        {
          timeout: AI_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': process.env.INTERNAL_API_KEY || '',
          },
        }
      );
      if (data) {
        aiResponse = data;
      }
    } catch (err) {
      try {
        const { data } = await axios.post(
          `${AI_SERVICE_URL}/chat`,
          {
            message: trimmedUserMsg,
            session_id: session.session_uuid,
            conversation_history: conversationHistory,
            user_id: userId,
          },
          {
            timeout: AI_TIMEOUT_MS,
            headers: {
              'Content-Type': 'application/json',
              'x-internal-key': process.env.INTERNAL_API_KEY || '',
            },
          }
        );
        if (data) aiResponse = data;
      } catch (fallbackErr) {
        const axiosErr = fallbackErr as AxiosError;
        console.error('[AI Service Error in chat.controller]', axiosErr.message);
        aiResponse.is_error = true;
      }
    }

    // 5. Lưu tin nhắn của AI vào chat_messages (Section 4)
    const aiMsgResult = await execute(
      `INSERT INTO chat_messages (session_id, sender_type, message, suggested_products, created_at)
       VALUES (?, 'ai', ?, ?, NOW())`,
      [
        session.id,
        aiResponse.message,
        aiResponse.products && aiResponse.products.length > 0 ? JSON.stringify(aiResponse.products) : null
      ]
    ) as ResultSetHeader;

    // 6. Cập nhật số lượng tin nhắn, thời gian và tiêu đề session
    const currentTitle = session.title;
    const shouldUpdateTitle = !currentTitle || currentTitle === 'Cuộc trò chuyện mới';
    const newTitle = shouldUpdateTitle ? generateTitleFromMessage(trimmedUserMsg) : currentTitle;

    await execute(
      `UPDATE chat_sessions
       SET total_messages = total_messages + 2,
           title = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [newTitle, session.id]
    );

    // 7. Trả về kết quả
    sendSuccess(res, {
      session_id: session.session_uuid,
      session_db_id: session.id,
      title: newTitle,
      user_message: {
        id: userMsgResult.insertId,
        sender_type: 'user',
        message: trimmedUserMsg,
        created_at: new Date().toISOString(),
      },
      ai_message: {
        id: aiMsgResult.insertId,
        sender_type: 'ai',
        message: aiResponse.message,
        products: aiResponse.products || [],
        suggestions: aiResponse.suggestions || [],
        has_memory: Boolean((aiResponse as any).has_memory),
        created_at: new Date().toISOString(),
      },
      has_memory: Boolean((aiResponse as any).has_memory),
      intent: aiResponse.intent,
      is_error: aiResponse.is_error,
    }, 'Gửi tin nhắn thành công');

  } catch (error) {
    next(error);
  }
};

// ── 5. DELETE /api/chat/sessions/:sessionId — Xóa hoặc đóng session ──
export const deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = String(req.params.sessionId || '');
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      sendUnauthorized(res, 'Vui lòng đăng nhập');
      return;
    }

    const isNumericId = /^\d+$/.test(sessionId);

    const session = await queryOne<RowDataPacket>(
      isNumericId
        ? `SELECT id, user_id FROM chat_sessions WHERE id = ?`
        : `SELECT id, user_id FROM chat_sessions WHERE session_uuid = ?`,
      [sessionId]
    );

    if (!session) {
      sendNotFound(res, 'Không tìm thấy phiên trò chuyện');
      return;
    }

    // Customer chỉ được xóa của mình
    if (session.user_id !== userId && userRole !== 'admin') {
      sendForbidden(res, 'Bạn không có quyền xóa phiên trò chuyện này');
      return;
    }

    // Xóa session (chat_messages sẽ tự động CASCADE xóa theo FK)
    await execute('DELETE FROM chat_sessions WHERE id = ?', [session.id]);

    sendSuccess(res, null, 'Đã xóa phiên trò chuyện thành công');
  } catch (error) {
    next(error);
  }
};

// ── 6. GET /api/admin/chat/stats — Thống kê Chatbot cho Admin (Section 11) ──
export const getAdminChatStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Tổng số phiên chat & tổng số tin nhắn
    const totalStats = await queryOne<RowDataPacket>(`
      SELECT 
        COUNT(DISTINCT s.id) AS total_sessions,
        COALESCE(SUM(s.total_messages), 0) AS total_messages,
        COUNT(DISTINCT s.user_id) AS total_users
      FROM chat_sessions s
    `);

    // 2. Top users chat nhiều nhất
    const topUsers = await query<RowDataPacket>(`
      SELECT 
        u.ma_id AS user_id,
        u.ho_ten AS full_name,
        u.dia_chi_email AS email,
        COUNT(s.id) AS session_count,
        COALESCE(SUM(s.total_messages), 0) AS message_count,
        MAX(s.updated_at) AS last_active
      FROM nguoi_dung u
      JOIN chat_sessions s ON u.ma_id = s.user_id
      GROUP BY u.ma_id, u.ho_ten, u.dia_chi_email
      ORDER BY message_count DESC
      LIMIT 10
    `);

    // 3. Danh sách phiên chat gần đây
    const recentSessions = await query<RowDataPacket>(`
      SELECT 
        s.id,
        s.session_uuid,
        s.title,
        s.status,
        s.total_messages,
        s.created_at,
        s.updated_at,
        u.ho_ten AS user_name,
        u.dia_chi_email AS user_email,
        (
          SELECT message 
          FROM chat_messages 
          WHERE session_id = s.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) AS last_message
      FROM chat_sessions s
      LEFT JOIN nguoi_dung u ON s.user_id = u.ma_id
      ORDER BY s.updated_at DESC
      LIMIT 20
    `);

    // 4. Các chủ đề phổ biến (dựa theo title)
    const commonTopics = await query<RowDataPacket>(`
      SELECT title, COUNT(*) AS count
      FROM chat_sessions
      WHERE title IS NOT NULL AND title != 'Cuộc trò chuyện mới'
      GROUP BY title
      ORDER BY count DESC
      LIMIT 8
    `);

    sendSuccess(res, {
      summary: {
        total_sessions: Number(totalStats?.total_sessions || 0),
        total_messages: Number(totalStats?.total_messages || 0),
        total_users: Number(totalStats?.total_users || 0),
      },
      top_users: topUsers,
      recent_sessions: recentSessions,
      common_topics: commonTopics,
    }, 'Lấy thống kê Chatbot thành công');
  } catch (error) {
    next(error);
  }
};

// ── 7. POST /api/chat/message — Direct message endpoint (Section 8) ──
export const postDirectChatMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { session_id, message } = req.body;
    // Security: user_id must come strictly from JWT, never trust frontend body
    const userId = req.user?.userId || null;
    const userRole = req.user?.role;

    if (!message || typeof message !== 'string' || !message.trim()) {
      sendBadRequest(res, 'Nội dung tin nhắn không được để trống');
      return;
    }

    if (message.length > 2000) {
      sendBadRequest(res, 'Nội dung tin nhắn quá dài (tối đa 2000 ký tự)');
      return;
    }

    const trimmedUserMsg = message.trim();

    // 1. Resolve or create chat_sessions
    let session: any = null;
    if (session_id) {
      const isNumeric = /^\d+$/.test(String(session_id));
      session = await queryOne<RowDataPacket>(
        isNumeric
          ? `SELECT id, session_uuid, user_id, title, status, total_messages FROM chat_sessions WHERE id = ?`
          : `SELECT id, session_uuid, user_id, title, status, total_messages FROM chat_sessions WHERE session_uuid = ?`,
        [session_id]
      );
    }

    if (!session) {
      const newUuid = uuidv4();
      const generatedTitle = generateTitleFromMessage(trimmedUserMsg);
      const insertRes = await execute(
        `INSERT INTO chat_sessions (session_uuid, user_id, title, status, total_messages, created_at, updated_at)
         VALUES (?, ?, ?, 'active', 0, NOW(), NOW())`,
        [newUuid, userId, generatedTitle]
      ) as ResultSetHeader;

      session = {
        id: insertRes.insertId,
        session_uuid: newUuid,
        user_id: userId,
        title: generatedTitle,
        status: 'active',
        total_messages: 0,
      };
    } else {
      // Security check: Customer can only post to their own session
      if (session.user_id && session.user_id !== userId && userRole !== 'admin') {
        sendForbidden(res, 'Bạn không có quyền truy cập phiên trò chuyện này');
        return;
      }
      if (!session.user_id && userId) {
        await execute('UPDATE chat_sessions SET user_id = ? WHERE id = ?', [userId, session.id]);
        session.user_id = userId;
      }
    }

    // 2. Save user message into chat_messages
    const directUserMsgRes = await execute(
      `INSERT INTO chat_messages (session_id, sender_type, message, created_at)
       VALUES (?, 'user', ?, NOW())`,
      [session.id, trimmedUserMsg]
    ) as ResultSetHeader;

    // 3. Get history context (excluding the newly inserted user message)
    const contextRows = await query<RowDataPacket>(
      `SELECT sender_type, message
       FROM chat_messages
       WHERE session_id = ? AND id != ?
       ORDER BY created_at DESC
       LIMIT 14`,
      [session.id, directUserMsgRes.insertId]
    );

    const conversationHistory = contextRows.reverse().map((r: RowDataPacket) => ({
      role: r.sender_type === 'user' ? 'user' : 'assistant',
      content: r.message,
    }));

    // 4. Call Python AI Service (Local Ollama pipeline)
    let aiResponse = {
      success: true,
      message: 'AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama.',
      products: [] as any[],
      suggestions: [] as string[],
    };

    try {
      const { data } = await axios.post(
        `${AI_SERVICE_URL}/api/ai/chat`,
        {
          message: trimmedUserMsg,
          session_id: session.id,
          conversation_history: conversationHistory,
          user_id: userId,
        },
        {
          timeout: AI_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': process.env.INTERNAL_API_KEY || '',
          },
        }
      );
      if (data) {
        aiResponse = data;
      }
    } catch (err) {
      try {
        const { data } = await axios.post(
          `${AI_SERVICE_URL}/chat`,
          {
            message: trimmedUserMsg,
            session_id: session.id,
            conversation_history: conversationHistory,
            user_id: userId,
          },
          {
            timeout: AI_TIMEOUT_MS,
            headers: {
              'Content-Type': 'application/json',
              'x-internal-key': process.env.INTERNAL_API_KEY || '',
            },
          }
        );
        if (data) aiResponse = data;
      } catch (fallbackErr) {
        console.error('[AI Service Error on /api/chat/message]', (fallbackErr as Error).message);
      }
    }

    // 5. Save AI response into chat_messages
    await execute(
      `INSERT INTO chat_messages (session_id, sender_type, message, suggested_products, created_at)
       VALUES (?, 'ai', ?, ?, NOW())`,
      [
        session.id,
        aiResponse.message,
        aiResponse.products && aiResponse.products.length > 0 ? JSON.stringify(aiResponse.products) : null
      ]
    );

    // 6. Update session metadata
    const currentTitle = session.title;
    const shouldUpdateTitle = !currentTitle || currentTitle === 'Cuộc trò chuyện mới';
    const newTitle = shouldUpdateTitle ? generateTitleFromMessage(trimmedUserMsg) : currentTitle;

    await execute(
      `UPDATE chat_sessions
       SET total_messages = total_messages + 2,
           title = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [newTitle, session.id]
    );

    // 7. Return standard format matching Section 7 & 8
    res.status(200).json({
      success: aiResponse.success !== false,
      session_id: session.id,
      session_uuid: session.session_uuid,
      message: aiResponse.message,
      products: aiResponse.products || [],
      suggestions: aiResponse.suggestions || [],
      has_memory: Boolean((aiResponse as any).has_memory),
    });
  } catch (error) {
    next(error);
  }
};

