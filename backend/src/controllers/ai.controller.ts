import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../config/database';
import { sendSuccess, sendCreated, sendBadRequest, sendError, getPagination, paginate } from '../utils/helpers';
import { config } from '../config';

const AI_SERVICE_URL = config.aiService.url;
const AI_TIMEOUT_MS = 50_000; // 50 giây

// ── POST /api/ai/chat ─────────────────────────────────────────
export const chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, session_id } = req.body;
    const userId = req.user?.userId || null;

    if (!message?.trim()) {
      sendBadRequest(res, 'Tin nhắn không được để trống');
      return;
    }

    if (message.length > 2000) {
      sendBadRequest(res, 'Tin nhắn quá dài (tối đa 2000 ký tự)');
      return;
    }

    // ── 1. Lấy hoặc tạo chat session (phien_tro_chuyen) ──────
    let sessionId = session_id;
    let sessionDbId: number;

    if (sessionId) {
      const existingSession = await queryOne<RowDataPacket>(
        'SELECT ma_id, trang_thai AS status FROM phien_tro_chuyen WHERE ma_phien_uuid = ?',
        [sessionId]
      );

      if (existingSession && existingSession.status === 'active') {
        sessionDbId = existingSession.ma_id;
      } else {
        sessionId = uuidv4();
        const result = await execute(
          'INSERT INTO phien_tro_chuyen (ma_phien_uuid, ma_nguoi_dung, bat_dau_luc) VALUES (?, ?, NOW())',
          [sessionId, userId]
        ) as ResultSetHeader;
        sessionDbId = result.insertId;
      }
    } else {
      sessionId = uuidv4();
      const result = await execute(
        'INSERT INTO phien_tro_chuyen (ma_phien_uuid, ma_nguoi_dung, bat_dau_luc) VALUES (?, ?, NOW())',
        [sessionId, userId]
      ) as ResultSetHeader;
      sessionDbId = result.insertId;
    }

    // ── 2. Lấy lịch sử hội thoại (tin_nhan_tro_chuyen) ───────
    const historyRows = await query<RowDataPacket>(
      `SELECT vai_tro AS role, noi_dung AS content FROM tin_nhan_tro_chuyen
       WHERE ma_phien = ? AND vai_tro IN ('user', 'assistant') AND co_loi = 0
       ORDER BY ngay_tao DESC LIMIT 20`,
      [sessionDbId]
    );
    const conversationHistory = historyRows.reverse().map((r: RowDataPacket) => ({
      role:    r.role,
      content: r.content,
    }));

    // ── 3. Lưu message của user vào tin_nhan_tro_chuyen & chat_messages ───────
    await execute(
      `INSERT INTO tin_nhan_tro_chuyen (ma_phien, vai_tro, noi_dung) VALUES (?, 'user', ?)`,
      [sessionDbId, message.trim()]
    );

    try {
      let csRow = await queryOne<RowDataPacket>('SELECT id FROM chat_sessions WHERE session_uuid = ?', [sessionId]);
      if (!csRow) {
        const csRes = await execute(
          `INSERT INTO chat_sessions (session_uuid, user_id, title, status, total_messages, created_at, updated_at)
           VALUES (?, ?, ?, 'active', 1, NOW(), NOW())`,
          [sessionId, userId, message.trim().slice(0, 50)]
        ) as ResultSetHeader;
        await execute(
          `INSERT INTO chat_messages (session_id, sender_type, message, created_at) VALUES (?, 'user', ?, NOW())`,
          [csRes.insertId, message.trim()]
        );
      } else {
        await execute(
          `INSERT INTO chat_messages (session_id, sender_type, message, created_at) VALUES (?, 'user', ?, NOW())`,
          [csRow.id, message.trim()]
        );
      }
    } catch (syncErr) {
      console.warn('Sync to chat_messages user notice:', (syncErr as Error).message);
    }

    // ── 4. Gọi Python AI Service ──────────────────────────────
    let aiResponse: {
      message: string;
      products: unknown[];
      suggestions: string[];
      intent: string;
      tokens_used: number;
      is_error: boolean;
    };

    try {
      const { data } = await axios.post(
        `${AI_SERVICE_URL}/chat`,
        {
          message:              message.trim(),
          session_id:           sessionId,
          conversation_history: conversationHistory,
          user_id:              userId,
        },
        {
          timeout: AI_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': process.env.INTERNAL_API_KEY || '',
          },
        }
      );
      aiResponse = data;
    } catch (err) {
      const axiosErr = err as AxiosError;
      console.error('[AI Service Error]', axiosErr.message);

      aiResponse = {
        message:     'Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! 🙏\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',
        products:    [],
        suggestions: ['Tìm sản phẩm theo danh mục', 'Lọc theo ngân sách', 'Xem sản phẩm bán chạy'],
        intent:      'general',
        tokens_used: 0,
        is_error:    true,
      };
    }

    // ── 5. Lưu response vào tin_nhan_tro_chuyen ───────────────
    const productIds = (aiResponse.products as Array<{ id: number }>)
      .map(p => p.id)
      .filter(Boolean);

    await execute(
      `INSERT INTO tin_nhan_tro_chuyen
         (ma_phien, vai_tro, noi_dung, so_token_da_dung, mo_hinh_su_dung, san_pham_duoc_goi_y, muc_dich, co_loi)
       VALUES (?, 'assistant', ?, ?, ?, ?, ?, ?)`,
      [
        sessionDbId,
        aiResponse.message,
        aiResponse.tokens_used || null,
        process.env.OPENAI_MODEL || 'gpt-4o-mini',
        productIds.length > 0 ? JSON.stringify(productIds) : null,
        aiResponse.intent || null,
        aiResponse.is_error ? 1 : 0,
      ]
    );

    try {
      const csRow = await queryOne<RowDataPacket>('SELECT id FROM chat_sessions WHERE session_uuid = ?', [sessionId]);
      if (csRow) {
        await execute(
          `INSERT INTO chat_messages (session_id, sender_type, message, suggested_products, created_at) VALUES (?, 'ai', ?, ?, NOW())`,
          [csRow.id, aiResponse.message, productIds.length > 0 ? JSON.stringify(aiResponse.products) : null]
        );
        await execute(
          `UPDATE chat_sessions SET total_messages = total_messages + 1, updated_at = NOW() WHERE id = ?`,
          [csRow.id]
        );
      }
    } catch (syncErr) {
      console.warn('Sync to chat_messages ai notice:', (syncErr as Error).message);
    }

    // ── 6. Cập nhật phien_tro_chuyen metadata ────────────────
    await execute(
      `UPDATE phien_tro_chuyen
       SET tong_tin_nhan = tong_tin_nhan + 2,
           tin_nhan_cuoi_luc = NOW(),
           tieu_de = CASE WHEN tieu_de IS NULL THEN ? ELSE tieu_de END
       WHERE ma_id = ?`,
      [message.trim().slice(0, 100), sessionDbId]
    );

    // ── 7. Trả kết quả ────────────────────────────────────────
    sendSuccess(res, {
      session_id:  sessionId,
      message:     aiResponse.message,
      products:    aiResponse.products,
      suggestions: aiResponse.suggestions,
      intent:      aiResponse.intent,
      is_error:    aiResponse.is_error,
    });

  } catch (error) {
    next(error);
  }
};

// ── GET /api/ai/chat/history/:sessionId ──────────────────────
export const getChatHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);

    const session = await queryOne<RowDataPacket>(
      `SELECT ma_id, ma_nguoi_dung AS user_id, tieu_de AS title,
              trang_thai AS status, tong_tin_nhan AS total_messages, bat_dau_luc AS started_at
       FROM phien_tro_chuyen WHERE ma_phien_uuid = ?`,
      [sessionId]
    );

    if (!session) {
      sendSuccess(res, { session: null, messages: [] });
      return;
    }

    const total = session.total_messages || 0;

    const messages = await query<RowDataPacket>(
      `SELECT ma_id AS id, vai_tro AS role, noi_dung AS content,
              san_pham_duoc_goi_y AS suggested_products, muc_dich AS intent,
              co_loi AS is_error, ngay_tao AS created_at
       FROM tin_nhan_tro_chuyen
       WHERE ma_phien = ?
       ORDER BY ngay_tao ASC
       LIMIT ? OFFSET ?`,
      [session.ma_id, limit, offset]
    );

    sendSuccess(res, {
      session: {
        id:             session.ma_id,
        session_id:     sessionId,
        title:          session.title,
        status:         session.status,
        total_messages: session.total_messages,
        started_at:     session.started_at,
      },
      messages,
    }, 'Lấy lịch sử chat thành công', 200, paginate(total, page, limit));

  } catch (error) {
    next(error);
  }
};

// ── GET /api/ai/chat/sessions — Lấy danh sách sessions ────────
export const getChatSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);

    const sessions = await query<RowDataPacket>(
      `SELECT ma_phien_uuid AS session_uuid, tieu_de AS title, trang_thai AS status,
              tong_tin_nhan AS total_messages, bat_dau_luc AS started_at,
              tin_nhan_cuoi_luc AS last_message_at
       FROM phien_tro_chuyen
       WHERE ma_nguoi_dung = ? AND trang_thai = 'active'
       ORDER BY tin_nhan_cuoi_luc DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const total = (await queryOne<RowDataPacket>(
      'SELECT COUNT(*) AS total FROM phien_tro_chuyen WHERE ma_nguoi_dung = ?',
      [userId]
    ))?.total || 0;

    sendSuccess(res, sessions, 'Lấy danh sách session thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/ai/chat/sessions/:sessionId — Đóng session ────
export const closeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    await execute(
      `UPDATE phien_tro_chuyen SET trang_thai = 'closed', dong_luc = NOW() WHERE ma_phien_uuid = ?`,
      [sessionId]
    );
    sendSuccess(res, null, 'Đã đóng phiên chat');
  } catch (error) {
    next(error);
  }
};

// Suppress unused import warnings
void sendCreated; void sendError;
