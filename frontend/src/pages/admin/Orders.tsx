import React, { useEffect, useState, useCallback } from 'react';
import { Search, Eye, X, ChevronDown, CheckCircle2, Printer } from 'lucide-react';
import { adminService, paymentService } from '../../services';
import { AdminOrder, OrderStatus, OrderItem, ShippingAddress } from '../../types';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/format';
import InvoiceModal, { InvoiceData } from '../../components/InvoiceModal';

const fmt = (n: number | string) => formatCurrency(n);
const fmtDate = (s: string) => new Date(s).toLocaleString('vi-VN');

const STATUS_VN: Record<string, string> = {
  pending: 'Chờ xử lý', processing: 'Đang xử lý', shipped: 'Đã gửi',
  delivered: 'Đã giao', cancelled: 'Đã huỷ', returned: 'Hoàn hàng',
};
const PAYMENT_VN: Record<string, string> = {
  pending: 'Chờ TT', paid: 'Đã TT', failed: 'Thất bại', refunded: 'Hoàn tiền',
};
const ALL_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

interface DetailOrder extends AdminOrder {
  items: OrderItem[];
  shipping_address: ShippingAddress;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detail, setDetail] = useState<DetailOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [invoiceModalData, setInvoiceModalData] = useState<InvoiceData | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getOrders({
        search: search || undefined,
        status: statusFilter || undefined,
        payment_status: paymentFilter || undefined,
        page, limit: 15,
      });
      setOrders(res.data.data as AdminOrder[] || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, [search, statusFilter, paymentFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewDetail = async (id: number) => {
    try {
      const res = await adminService.getOrderDetail(id);
      const d = res.data.data as DetailOrder;
      if (d.shipping_address && typeof d.shipping_address === 'string') {
        d.shipping_address = JSON.parse(d.shipping_address as unknown as string);
      }
      setDetail(d);
    } catch { /* handled */ }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await adminService.updateOrderStatus(id, { status });
      toast.success(`Cập nhật trạng thái thành ${STATUS_VN[status]}`);
      fetchOrders();
      if (detail?.id === id) setDetail(prev => prev ? { ...prev, status: status as OrderStatus } : null);
    } catch { /* handled */ }
    finally { setUpdatingId(null); }
  };

  const handleVerifyPayment = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xác nhận đã nhận thanh toán cho đơn hàng này?')) return;
    try {
      await paymentService.adminVerifyBank(id, { note: 'Admin duyệt thanh toán thủ công' });
      toast.success('Xác nhận đã nhận thanh toán thành công!');
      fetchOrders();
      if (detail?.id === id) {
        setDetail(prev => prev ? { ...prev, payment_status: 'paid' as any, status: (prev.status === 'pending' ? 'processing' : prev.status) as any } : null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const openInvoice = async (o: AdminOrder | DetailOrder) => {
    try {
      let fullOrder = o as DetailOrder;
      if (!('items' in fullOrder) || !fullOrder.items) {
        const res = await adminService.getOrderDetail(o.id);
        fullOrder = res.data.data as DetailOrder;
        if (fullOrder.shipping_address && typeof fullOrder.shipping_address === 'string') {
          fullOrder.shipping_address = JSON.parse(fullOrder.shipping_address as unknown as string);
        }
      }
      setInvoiceModalData({
        order_id: fullOrder.id,
        order_code: fullOrder.order_code,
        created_at: fullOrder.created_at,
        status: fullOrder.status,
        payment_status: fullOrder.payment_status,
        payment_method: fullOrder.payment_method,
        customer_name: fullOrder.customer_name || fullOrder.shipping_address?.recipient_name,
        customer_email: fullOrder.customer_email,
        customer_phone: fullOrder.shipping_address?.recipient_phone,
        customer_note: (fullOrder as any).customer_note,
        shipping_address: fullOrder.shipping_address || {},
        items: (fullOrder.items || []).map(i => ({
          id: i.id,
          name: (i as any).product_name || i.name,
          variant_name: i.variant_name,
          unit_price: Number(i.unit_price),
          quantity: i.quantity,
          subtotal: Number(i.subtotal),
        })),
        subtotal: Number((fullOrder as any).subtotal || fullOrder.total_amount),
        discount_amount: Number((fullOrder as any).discount_amount || 0),
        coupon_code: (fullOrder as any).coupon_code,
        shipping_fee: Number((fullOrder as any).shipping_fee || 0),
        total_amount: Number(fullOrder.total_amount),
      });
    } catch {
      toast.error('Không thể lấy thông tin hóa đơn');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Quản lý Đơn hàng</h1>
      </div>

      <div className="admin-filters">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-box__icon" />
          <input type="text" placeholder="Tìm mã đơn, tên KH, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="admin-search-box__input" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-select">
          <option value="">Tất cả trạng thái</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_VN[s]}</option>)}
        </select>
        <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }} className="admin-select">
          <option value="">Tất cả thanh toán</option>
          <option value="pending">Chờ TT</option>
          <option value="paid">Đã TT</option>
          <option value="failed">Thất bại</option>
          <option value="refunded">Hoàn tiền</option>
        </select>
      </div>

      <div className="admin-card">
        {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th>Ngày đặt</th>
                  <th>Cập nhật TT</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><span className="admin-badge admin-badge--code">{o.order_code}</span></td>
                    <td>
                      <div>
                        <p style={{ color: '#e2e8f0' }}>{o.customer_name}</p>
                        <p style={{ fontSize: 12, color: '#64748b' }}>{o.customer_email}</p>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#a78bfa' }}>{fmt(Number(o.total_amount))}</td>
                    <td><span className={`admin-status admin-status--${o.status}`}>{STATUS_VN[o.status] || o.status}</span></td>
                    <td><span className={`admin-status admin-status--payment-${o.payment_status}`}>{PAYMENT_VN[o.payment_status] || o.payment_status}</span></td>
                    <td style={{ fontSize: 13 }}>{fmtDate(o.created_at)}</td>
                    <td>
                      <div className="admin-status-select-wrap">
                        <select
                          value={o.status}
                          onChange={e => handleStatusUpdate(o.id, e.target.value)}
                          className="admin-status-select"
                          disabled={updatingId === o.id}
                        >
                          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_VN[s]}</option>)}
                        </select>
                        <ChevronDown size={12} className="admin-status-select__arrow" />
                      </div>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-action-btn admin-action-btn--info" onClick={() => viewDetail(o.id)} title="Xem chi tiết đơn">
                          <Eye size={15} />
                        </button>
                        <button
                          className="admin-action-btn admin-action-btn--primary"
                          onClick={() => openInvoice(o)}
                          title="In Hóa Đơn / Phiếu Giao Hàng"
                          style={{ color: '#a78bfa' }}
                        >
                          <Printer size={15} />
                        </button>
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

      {/* Order Detail Modal */}
      {detail && (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal admin-modal--wide" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3>Chi tiết đơn hàng #{detail.order_code}</h3>
                <button
                  onClick={() => openInvoice(detail)}
                  className="admin-btn admin-btn--secondary"
                  style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  title="In hóa đơn & phiếu giao hàng"
                >
                  <Printer size={13} /> In Hóa Đơn
                </button>
              </div>
              <button onClick={() => setDetail(null)}><X size={20} /></button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-order-detail-grid">
                <div>
                  <p className="admin-detail-label">Khách hàng</p>
                  <p className="admin-detail-value">{detail.customer_name}</p>
                  <p className="admin-detail-sub">{detail.customer_email}</p>
                </div>
                <div>
                  <p className="admin-detail-label">Địa chỉ giao hàng</p>
                  {detail.shipping_address && (
                    <p className="admin-detail-value" style={{ fontSize: 13 }}>
                      {detail.shipping_address.recipient_name} — {detail.shipping_address.recipient_phone}<br />
                      {detail.shipping_address.address_detail}, {detail.shipping_address.ward}, {detail.shipping_address.district}, {detail.shipping_address.province}
                    </p>
                  )}
                </div>
                <div>
                  <p className="admin-detail-label">Trạng thái</p>
                  <span className={`admin-status admin-status--${detail.status}`}>{STATUS_VN[detail.status]}</span>
                </div>
                <div>
                  <p className="admin-detail-label">Thanh toán</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`admin-status admin-status--payment-${detail.payment_status}`}>
                      {PAYMENT_VN[detail.payment_status]}
                    </span>
                    {detail.payment_status !== 'paid' && detail.status !== 'cancelled' && (
                      <button
                        onClick={() => handleVerifyPayment(detail.id)}
                        className="admin-btn admin-btn--primary"
                        style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="Xác nhận đã nhận tiền chuyển khoản"
                      >
                        <CheckCircle2 size={12} /> Xác nhận đã TT
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {detail.items && detail.items.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p className="admin-detail-label" style={{ marginBottom: 8 }}>Sản phẩm đặt mua</p>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Biến thể</th>
                        <th>Đơn giá</th>
                        <th>SL</th>
                        <th>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {item.product_image && <img src={item.product_image} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />}
                              <span>{item.product_name}</span>
                            </div>
                          </td>
                          <td>{item.variant_name || '—'}</td>
                          <td>{fmt(item.unit_price)}</td>
                          <td>{item.quantity}</td>
                          <td style={{ fontWeight: 600 }}>{fmt(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="admin-order-totals">
                <div className="admin-order-total-row">
                  <span>Tổng cộng</span>
                  <span style={{ fontWeight: 700, color: '#a78bfa', fontSize: 18 }}>{fmt(Number(detail.total_amount))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Print Modal */}
      <InvoiceModal
        isOpen={Boolean(invoiceModalData)}
        onClose={() => setInvoiceModalData(null)}
        invoice={invoiceModalData}
      />
    </div>
  );
};

export default Orders;
