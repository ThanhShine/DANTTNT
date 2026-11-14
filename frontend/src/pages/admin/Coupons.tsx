import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check, Search, Ticket, Sparkles } from 'lucide-react';
import { couponService } from '../../services';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/format';

interface CouponItem {
  id: number;
  code: string;
  description: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: number;
  created_at: string;
  creator_name: string | null;
}

interface CouponForm {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_discount_amount: number | '';
  usage_limit: number | '';
  start_date: string;
  end_date: string;
  is_active: number;
}

const defaultForm: CouponForm = {
  code: '',
  description: '',
  type: 'percentage',
  value: 10,
  min_order_amount: 0,
  max_discount_amount: '',
  usage_limit: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  is_active: 1,
};

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await couponService.adminGetCoupons({ search: search || undefined });
      setCoupons((res.data.data as CouponItem[]) || []);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SALE';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, code }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setModal('create');
  };

  const openEdit = (c: CouponItem) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description || '',
      type: c.type,
      value: Number(c.value),
      min_order_amount: Number(c.min_order_amount) || 0,
      max_discount_amount: c.max_discount_amount ? Number(c.max_discount_amount) : '',
      usage_limit: c.usage_limit ? Number(c.usage_limit) : '',
      start_date: c.start_date.slice(0, 10),
      end_date: c.end_date.slice(0, 10),
      is_active: c.is_active,
    });
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error('Vui lòng nhập mã code');
      return;
    }
    if (form.value <= 0) {
      toast.error('Mức giảm phải lớn hơn 0');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        code: form.code.trim().toUpperCase(),
        description: form.description || null,
        type: form.type,
        value: Number(form.value),
        min_order_amount: Number(form.min_order_amount) || 0,
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        start_date: form.start_date,
        end_date: form.end_date,
        is_active: form.is_active,
      };

      if (modal === 'create') {
        await couponService.adminCreate(payload);
        toast.success(`Tạo mã ${payload.code} thành công!`);
      } else if (modal === 'edit' && editingId) {
        await couponService.adminUpdate(editingId, payload);
        toast.success('Cập nhật mã giảm giá thành công!');
      }

      setModal(null);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu mã giảm giá');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await couponService.adminToggle(id);
      toast.success(res.data.message || 'Đã thay đổi trạng thái');
      fetchCoupons();
    } catch {
      toast.error('Không thể đổi trạng thái');
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã "${code}" không?`)) return;
    try {
      await couponService.adminDelete(id);
      toast.success(`Đã xóa mã ${code}`);
      fetchCoupons();
    } catch {
      toast.error('Không thể xóa mã giảm giá');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Quản lý Mã Giảm Giá (Coupons)</h1>
        <button onClick={openCreate} className="admin-btn admin-btn--primary">
          <Plus size={16} /> Thêm Mã Mới
        </button>
      </div>

      <div className="admin-filters">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-box__icon" />
          <input
            type="text"
            placeholder="Tìm theo mã code, mô tả..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-search-box__input"
          />
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="admin-empty">
            <Ticket size={48} className="text-gray-300 mx-auto mb-2" />
            <p className="admin-empty__text">Chưa có mã giảm giá nào</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã code</th>
                <th>Mô tả</th>
                <th>Mức giảm</th>
                <th>Đơn tối thiểu</th>
                <th>Đã dùng / Giới hạn</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const isExpired = new Date(c.end_date) < new Date();
                return (
                  <tr key={c.id}>
                    <td>
                      <span className="font-mono font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md border border-primary-200">
                        {c.code}
                      </span>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <p className="line-clamp-2 text-xs text-gray-700">{c.description || '—'}</p>
                    </td>
                    <td>
                      {c.type === 'percentage' ? (
                        <div>
                          <span className="font-bold text-red-600">{Number(c.value)}%</span>
                          {c.max_discount_amount && (
                            <p className="text-[11px] text-gray-500">
                              (Tối đa {formatCurrency(c.max_discount_amount)})
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(Number(c.value))}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {Number(c.min_order_amount) > 0 ? formatCurrency(c.min_order_amount) : '0đ'}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <span className="font-medium text-gray-800">{c.used_count}</span> /{' '}
                      <span className="text-gray-500">{c.usage_limit || '∞'}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <p className="text-gray-600">Từ: {c.start_date.slice(0, 10)}</p>
                      <p className={isExpired ? 'text-red-500 font-medium' : 'text-gray-600'}>
                        Đến: {c.end_date.slice(0, 10)}
                        {isExpired && ' (Hết hạn)'}
                      </p>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(c.id)}
                        className={`admin-status ${
                          c.is_active ? 'admin-status--active' : 'admin-status--inactive'
                        }`}
                        title="Bấm để bật/tắt kích hoạt"
                      >
                        {c.is_active ? 'Đang bật' : 'Tạm tắt'}
                      </button>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          onClick={() => openEdit(c)}
                          className="admin-btn-icon"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          className="admin-btn-icon admin-btn-icon--danger"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Create / Edit */}
      {modal && (
        <div className="admin-modal-backdrop" onClick={() => setModal(null)}>
          <div className="admin-modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">
                {modal === 'create' ? 'Tạo Mã Giảm Giá Mới' : `Chỉnh Sửa Mã: ${form.code}`}
              </h2>
              <button onClick={() => setModal(null)} className="admin-modal__close">
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal__body space-y-4">
              <div>
                <label className="admin-form-label">Mã Code *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="VD: SALE10, FREESHIP..."
                    className="admin-form-input font-mono font-bold"
                    style={{ textTransform: 'uppercase' }}
                    disabled={modal === 'edit'}
                  />
                  {modal === 'create' && (
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="admin-btn admin-btn--secondary"
                      style={{ flexShrink: 0 }}
                      title="Tạo mã ngẫu nhiên"
                    >
                      <Sparkles size={14} className="mr-1" /> Ngẫu nhiên
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="admin-form-label">Mô tả hiển thị</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="VD: Giảm 10% cho đơn từ 500k..."
                  className="admin-form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="admin-form-label">Loại giảm giá *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                    className="admin-form-input"
                  >
                    <option value="percentage">Theo phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="admin-form-label">
                    Mức giảm {form.type === 'percentage' ? '(%)' : '(VNĐ)'} *
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                    className="admin-form-input font-bold"
                    min="1"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="admin-form-label">Đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    value={form.min_order_amount}
                    onChange={e => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                    placeholder="0"
                    className="admin-form-input"
                    min="0"
                  />
                </div>

                <div>
                  <label className="admin-form-label">Giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    value={form.max_discount_amount}
                    onChange={e =>
                      setForm({
                        ...form,
                        max_discount_amount: e.target.value ? Number(e.target.value) : '',
                      })
                    }
                    placeholder="Để trống nếu không giới hạn"
                    className="admin-form-input"
                    disabled={form.type === 'fixed'}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="admin-form-label">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div>
                  <label className="admin-form-label">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="admin-form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="admin-form-label">Giới hạn số lần dùng</label>
                  <input
                    type="number"
                    value={form.usage_limit}
                    onChange={e =>
                      setForm({
                        ...form,
                        usage_limit: e.target.value ? Number(e.target.value) : '',
                      })
                    }
                    placeholder="Để trống = Không giới hạn"
                    className="admin-form-input"
                    min="1"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.is_active === 1}
                      onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
                      style={{ width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Kích hoạt ngay</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="admin-modal__footer">
              <button onClick={() => setModal(null)} className="admin-btn admin-btn--secondary">
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="admin-btn admin-btn--primary"
              >
                {saving ? 'Đang lưu...' : 'Lưu Mã'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
