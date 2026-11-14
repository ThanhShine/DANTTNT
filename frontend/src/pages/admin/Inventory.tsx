import React, { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { adminService } from '../../services';
import { InventoryItem } from '../../types';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/format';

const fmt = (n: number | string) => formatCurrency(n);

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getInventory({
        search: search || undefined,
        low_stock: lowOnly ? '1' : undefined,
        page, limit: 20,
      });
      setItems(res.data.data as InventoryItem[] || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, [search, lowOnly, page]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditQty(String(item.stock_quantity));
  };

  const saveEdit = async (id: number) => {
    const qty = parseInt(editQty);
    if (isNaN(qty) || qty < 0) { toast.error('Số lượng không hợp lệ'); return; }
    try {
      await adminService.updateInventory(id, qty);
      toast.success('Cập nhật tồn kho thành công');
      setEditingId(null);
      fetchInventory();
    } catch { /* handled */ }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý Tồn kho</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label className="admin-toggle-label">
            <input type="checkbox" checked={lowOnly} onChange={e => { setLowOnly(e.target.checked); setPage(1); }} />
            <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
            <span>Chỉ hiện sắp hết</span>
          </label>
        </div>
      </div>

      <div className="admin-filters">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-box__icon" />
          <input type="text" placeholder="Tìm theo tên, SKU..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="admin-search-box__input" />
        </div>
      </div>

      <div className="admin-card">
        {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>SKU</th>
                  <th>Danh mục</th>
                  <th>Giá bán</th>
                  <th>Đã bán</th>
                  <th>Tồn kho</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className={item.stock_quantity <= 5 ? 'admin-table-row--warning' : ''}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={item.thumbnail_url || 'https://via.placeholder.com/36'} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{item.name}</span>
                      </div>
                    </td>
                    <td><code style={{ fontSize: 12, color: '#94a3b8' }}>{item.sku}</code></td>
                    <td>{item.category_name}</td>
                    <td>{fmt(item.base_price)}</td>
                    <td>{item.total_sold}</td>
                    <td>
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editQty}
                          onChange={e => setEditQty(e.target.value)}
                          className="admin-input admin-input--inline"
                          min={0}
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingId(null); }}
                        />
                      ) : (
                        <span className={`admin-stock-badge ${item.stock_quantity === 0 ? 'admin-stock-badge--zero' : item.stock_quantity <= 5 ? 'admin-stock-badge--critical' : item.stock_quantity <= 10 ? 'admin-stock-badge--low' : 'admin-stock-badge--ok'}`}>
                          {item.stock_quantity}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="admin-actions">
                        {editingId === item.id ? (
                          <>
                            <button className="admin-action-btn admin-action-btn--success" onClick={() => saveEdit(item.id)}>Lưu</button>
                            <button className="admin-action-btn admin-action-btn--ghost" onClick={() => setEditingId(null)}>Huỷ</button>
                          </>
                        ) : (
                          <button className="admin-action-btn admin-action-btn--info" title="Cập nhật tồn kho" onClick={() => startEdit(item)}>
                            <RefreshCw size={15} />
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
    </div>
  );
};

export default Inventory;
