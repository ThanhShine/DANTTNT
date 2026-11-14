import React, { useEffect, useState, useCallback } from 'react';
import { Search, Eye, EyeOff, Trash2, Star } from 'lucide-react';
import { adminService } from '../../services';
import { AdminReview } from '../../types';
import toast from 'react-hot-toast';

const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN');

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getReviews({
        search: search || undefined,
        is_visible: visibilityFilter !== '' ? visibilityFilter : undefined,
        rating: ratingFilter || undefined,
        page, limit: 15,
      });
      setReviews(res.data.data as AdminReview[] || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, [search, visibilityFilter, ratingFilter, page]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleToggle = async (id: number) => {
    try {
      await adminService.toggleReviewVisibility(id);
      toast.success('Đã thay đổi trạng thái đánh giá');
      fetchReviews();
    } catch { /* handled */ }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa vĩnh viễn đánh giá này?')) return;
    try {
      await adminService.deleteReview(id);
      toast.success('Đã xóa đánh giá');
      fetchReviews();
    } catch { /* handled */ }
  };

  const renderStars = (rating: number) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} fill={i <= rating ? '#f59e0b' : 'none'} stroke={i <= rating ? '#f59e0b' : '#475569'} />
      ))}
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Quản lý Đánh giá</h1>
      </div>

      <div className="admin-filters">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-box__icon" />
          <input type="text" placeholder="Tìm reviewer, sản phẩm, nội dung..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="admin-search-box__input" />
        </div>
        <select value={visibilityFilter} onChange={e => { setVisibilityFilter(e.target.value); setPage(1); }} className="admin-select">
          <option value="">Tất cả</option>
          <option value="1">Đang hiện</option>
          <option value="0">Đang ẩn</option>
        </select>
        <select value={ratingFilter} onChange={e => { setRatingFilter(e.target.value); setPage(1); }} className="admin-select">
          <option value="">Tất cả sao</option>
          {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} sao</option>)}
        </select>
      </div>

      <div className="admin-card">
        {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Người đánh giá</th>
                  <th>Sản phẩm</th>
                  <th>Sao</th>
                  <th>Nội dung</th>
                  <th>Xác minh</th>
                  <th>Trạng thái</th>
                  <th>Ngày</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>
                      <div>
                        <p style={{ color: '#e2e8f0' }}>{r.reviewer_name}</p>
                        <p style={{ fontSize: 12, color: '#64748b' }}>{r.reviewer_email}</p>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {r.product_image && <img src={r.product_image} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />}
                        <span style={{ fontSize: 13 }}>{r.product_name}</span>
                      </div>
                    </td>
                    <td>{renderStars(r.rating)}</td>
                    <td style={{ maxWidth: 220 }}>
                      {r.title && <p style={{ fontWeight: 500, color: '#e2e8f0', fontSize: 13 }}>{r.title}</p>}
                      <p style={{ color: '#94a3b8', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {r.comment || '—'}
                      </p>
                    </td>
                    <td>
                      <span className={`admin-status ${r.is_verified ? 'admin-status--delivered' : 'admin-status--pending'}`}>
                        {r.is_verified ? 'Đã mua' : 'Chưa xác minh'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status ${r.is_visible ? 'admin-status--delivered' : 'admin-status--cancelled'}`}>
                        {r.is_visible ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </td>
                    <td>{fmtDate(r.created_at)}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className={`admin-action-btn ${r.is_visible ? 'admin-action-btn--warning' : 'admin-action-btn--success'}`}
                          title={r.is_visible ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
                          onClick={() => handleToggle(r.id)}
                        >
                          {r.is_visible ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button className="admin-action-btn admin-action-btn--danger" title="Xóa vĩnh viễn" onClick={() => handleDelete(r.id)}>
                          <Trash2 size={15} />
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
    </div>
  );
};

export default Reviews;
