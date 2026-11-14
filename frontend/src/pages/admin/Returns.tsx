import React, { useEffect, useState, useCallback } from 'react';
import { RotateCcw, CheckCircle2, XCircle, AlertCircle, Search, Eye, Check, X, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { returnService } from '../../services';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/format';

interface ReturnRequestItem {
  id: number;
  order_id: number;
  order_code: string;
  order_status: string;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  return_type: 'refund' | 'exchange';
  reason: string;
  description?: string;
  images?: string[];
  bank_info?: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_note?: string;
  created_at: string;
  updated_at: string;
}

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  pending:   { label: 'Chờ duyệt',      class: 'admin-status--processing' },
  approved:  { label: 'Đã chấp thuận',  class: 'admin-status--info' },
  rejected:  { label: 'Đã từ chối',     class: 'admin-status--cancelled' },
  completed: { label: 'Đã hoàn tất',    class: 'admin-status--delivered' },
};

const Returns: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequestItem | null>(null);
  const [actionModal, setActionModal] = useState<{ item: ReturnRequestItem; targetStatus: 'approved' | 'rejected' | 'completed' } | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await returnService.adminGetReturns({
        status: statusFilter || undefined,
        page,
        limit: 15,
      });
      setReturns(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch {
      toast.error('Không thể tải danh sách yêu cầu đổi/trả');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleOpenAction = (item: ReturnRequestItem, targetStatus: 'approved' | 'rejected' | 'completed') => {
    setActionModal({ item, targetStatus });
    setAdminNote(
      targetStatus === 'approved'
        ? 'Shop đã chấp thuận yêu cầu. Shipper sẽ đến thu hồi sản phẩm trong 1-2 ngày làm việc.'
        : targetStatus === 'completed'
        ? 'Shop đã nhận lại hàng và hoàn tất đối soát/chuyển khoản hoàn tiền thành công.'
        : 'Yêu cầu không đáp ứng điều kiện đổi trả do sản phẩm đã qua sử dụng quá thời hạn quy định.'
    );
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    setIsProcessing(true);
    try {
      await returnService.adminProcessReturn(actionModal.item.id, {
        status: actionModal.targetStatus,
        admin_note: adminNote.trim() || undefined,
      });

      toast.success(
        actionModal.targetStatus === 'completed'
          ? 'Đã duyệt hoàn tất đổi/trả! Tồn kho sản phẩm đã được tự động khôi phục.'
          : actionModal.targetStatus === 'approved'
          ? 'Đã chấp thuận yêu cầu đổi/trả.'
          : 'Đã từ chối yêu cầu đổi/trả.'
      );

      setActionModal(null);
      setSelectedReturn(null);
      fetchReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật yêu cầu');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý Đổi / Trả hàng & Hoàn tiền</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Tiếp nhận, thẩm định và phê duyệt các yêu cầu hoàn tiền hoặc đổi sản phẩm lỗi từ khách hàng
          </p>
        </div>
      </div>

      <div className="admin-filters">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="admin-select"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt (Pending)</option>
          <option value="approved">Đã chấp thuận (Approved)</option>
          <option value="completed">Đã hoàn tất (Completed)</option>
          <option value="rejected">Từ chối (Rejected)</option>
        </select>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /></div>
        ) : returns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <RotateCcw size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p>Hiện không có yêu cầu đổi/trả hàng nào.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Hình thức</th>
                  <th>Lý do</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {returns.map(item => (
                  <tr key={item.id}>
                    <td>
                      <code style={{ fontSize: 13, color: '#38bdf8', fontWeight: 600 }}>
                        #{item.order_code}
                      </code>
                    </td>
                    <td>
                      <p style={{ fontWeight: 600, color: '#f8fafc', margin: 0 }}>{item.customer_name}</p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{item.customer_email}</p>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: item.return_type === 'refund' ? '#3b0764' : '#1e3a8a',
                        color: item.return_type === 'refund' ? '#d8b4fe' : '#93c5fd'
                      }}>
                        {item.return_type === 'refund' ? '💰 Trả hàng & Hoàn tiền' : '🔄 Đổi sản phẩm'}
                      </span>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.reason}
                      </p>
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>
                      {formatDate(item.created_at)}
                    </td>
                    <td>
                      <span className={`admin-status ${STATUS_BADGE[item.status]?.class || 'admin-status--pending'}`}>
                        {STATUS_BADGE[item.status]?.label || item.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-action-btn admin-action-btn--info"
                          onClick={() => setSelectedReturn(item)}
                          title="Xem chi tiết & thẩm định"
                        >
                          <Eye size={15} />
                        </button>
                        {item.status === 'pending' && (
                          <>
                            <button
                              className="admin-action-btn admin-action-btn--success"
                              onClick={() => handleOpenAction(item, 'approved')}
                              title="Chấp thuận yêu cầu"
                              style={{ color: '#34d399' }}
                            >
                              <Check size={15} />
                            </button>
                            <button
                              className="admin-action-btn admin-action-btn--danger"
                              onClick={() => handleOpenAction(item, 'rejected')}
                              title="Từ chối yêu cầu"
                            >
                              <X size={15} />
                            </button>
                          </>
                        )}
                        {item.status === 'approved' && (
                          <button
                            className="admin-btn admin-btn--primary"
                            style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => handleOpenAction(item, 'completed')}
                            title="Hoàn tất và khôi phục tồn kho"
                          >
                            <CheckCircle2 size={13} /> Hoàn tất
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="admin-pagination__btn">Trước</button>
            <span className="admin-pagination__info">Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="admin-pagination__btn">Sau</button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReturn && (
        <div className="admin-modal-overlay" onClick={() => setSelectedReturn(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 620, width: '95%' }}>
            <div className="admin-modal__header">
              <h3>Chi tiết yêu cầu đổi/trả #{selectedReturn.order_code}</h3>
              <button onClick={() => setSelectedReturn(null)}><X size={20} /></button>
            </div>
            <div className="admin-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#0f172a', padding: 14, borderRadius: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Khách hàng</p>
                  <p style={{ margin: '3px 0 0', fontWeight: 600, color: '#f8fafc' }}>{selectedReturn.customer_name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{selectedReturn.customer_email}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Đơn hàng & Tổng tiền</p>
                  <p style={{ margin: '3px 0 0', fontWeight: 600, color: '#38bdf8' }}>#{selectedReturn.order_code}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#f87171', fontWeight: 600 }}>
                    {formatCurrency(selectedReturn.total_amount)}
                  </p>
                </div>
              </div>

              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Lý do đổi trả:</p>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 10, fontSize: 13, color: '#e2e8f0' }}>
                  <strong>{selectedReturn.reason}</strong>
                  {selectedReturn.description && (
                    <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 12 }}>
                      {selectedReturn.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Bank Info */}
              {selectedReturn.return_type === 'refund' && selectedReturn.bank_info && (
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Thông tin tài khoản nhận tiền hoàn:</p>
                  <div style={{ background: '#3b0764', border: '1px solid #581c87', borderRadius: 8, padding: 10, fontSize: 13, color: '#f5d0fe' }}>
                    <p style={{ margin: '0 0 4px' }}>Ngân hàng: <strong>{selectedReturn.bank_info.bank_name}</strong></p>
                    <p style={{ margin: '0 0 4px' }}>Số tài khoản: <code style={{ fontSize: 14, fontWeight: 'bold' }}>{selectedReturn.bank_info.account_number}</code></p>
                    <p style={{ margin: 0 }}>Chủ tài khoản: <strong>{selectedReturn.bank_info.account_holder}</strong></p>
                  </div>
                </div>
              )}

              {/* Evidence Images */}
              {selectedReturn.images && selectedReturn.images.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Ảnh chụp bằng chứng lỗi:</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {selectedReturn.images.map((imgUrl, idx) => (
                      <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" style={{ display: 'block', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', border: '1px solid #475569' }}>
                        <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedReturn.admin_note && (
                <div style={{ background: '#0f172a', padding: 10, borderRadius: 8, borderLeft: '3px solid #38bdf8' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Ghi chú phản hồi đã gửi:</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#e2e8f0' }}>{selectedReturn.admin_note}</p>
                </div>
              )}
            </div>

            <div className="admin-modal__footer" style={{ justifyContent: 'space-between' }}>
              <button className="admin-btn admin-btn--ghost" onClick={() => setSelectedReturn(null)}>
                Đóng
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedReturn.status === 'pending' && (
                  <>
                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() => handleOpenAction(selectedReturn, 'rejected')}
                    >
                      Từ chối
                    </button>
                    <button
                      className="admin-btn admin-btn--primary"
                      onClick={() => handleOpenAction(selectedReturn, 'approved')}
                    >
                      Chấp thuận
                    </button>
                  </>
                )}
                {selectedReturn.status === 'approved' && (
                  <button
                    className="admin-btn admin-btn--primary"
                    onClick={() => handleOpenAction(selectedReturn, 'completed')}
                  >
                    Xác nhận hoàn tất & Hoàn kho
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Prompt Modal */}
      {actionModal && (
        <div className="admin-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, width: '95%' }}>
            <div className="admin-modal__header">
              <h3>
                {actionModal.targetStatus === 'approved'
                  ? 'Chấp thuận yêu cầu đổi/trả'
                  : actionModal.targetStatus === 'completed'
                  ? 'Hoàn tất đổi/trả & Khôi phục kho'
                  : 'Từ chối yêu cầu đổi/trả'}
              </h3>
              <button onClick={() => setActionModal(null)}><X size={20} /></button>
            </div>
            <div className="admin-modal__body">
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px' }}>
                Đơn hàng #{actionModal.item.order_code} • Khách hàng {actionModal.item.customer_name}
              </p>
              <div className="admin-form-group">
                <label>Ghi chú phản hồi cho khách hàng (Hiển thị trên đơn của khách):</label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%', resize: 'vertical' }}
                  required
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--ghost" onClick={() => setActionModal(null)}>
                Hủy
              </button>
              <button
                className={`admin-btn ${actionModal.targetStatus === 'rejected' ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                onClick={handleConfirmAction}
                disabled={isProcessing}
              >
                {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
