import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Star } from 'lucide-react';
import { adminService } from '../../services';
import { TopProduct } from '../../types';
import { formatCurrency } from '../../utils/format';

const fmt = (n: number | string) => formatCurrency(n);

const COLORS = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#f97316','#ec4899'];

const TopProducts: React.FC = () => {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setLoading(true);
    adminService.getTopProducts(limit)
      .then(r => setProducts(r.data.data as TopProduct[] || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);

  const chartData = products.map(p => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
    fullName: p.name,
    sold: p.total_sold,
  }));

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Thống kê Sản phẩm Bán chạy</h1>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="admin-select">
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
        </select>
      </div>

      {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
        <>
          <div className="admin-card" style={{ marginBottom: 24 }}>
            <div className="admin-card__header">
              <h3 className="admin-card__title">Top {limit} sản phẩm theo số lượng bán</h3>
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(value: any, _: any, props: any) => [value + ' đã bán', props?.payload?.fullName || '']}
                />
                <Bar dataKey="sold" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-card">
            <div className="admin-card__header">
              <h3 className="admin-card__title">Danh sách chi tiết</h3>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Đánh giá</th>
                    <th>Giá</th>
                    <th>Tồn kho</th>
                    <th>Đã bán</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={p.id}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: COLORS[i % COLORS.length], color: '#fff', fontSize: 13, fontWeight: 700 }}>
                          {i + 1}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={p.thumbnail_url || 'https://via.placeholder.com/40'} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                          <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{p.name}</span>
                        </div>
                      </td>
                      <td>{p.category_name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
                          <span>{Number(p.avg_rating).toFixed(1)}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          {p.sale_price ? (
                            <>
                              <span style={{ color: '#f472b6', fontWeight: 600 }}>{fmt(p.sale_price)}</span>
                              <span style={{ color: '#64748b', textDecoration: 'line-through', fontSize: 12, marginLeft: 6 }}>{fmt(p.base_price)}</span>
                            </>
                          ) : <span style={{ fontWeight: 600 }}>{fmt(p.base_price)}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-stock-badge ${p.stock_quantity === 0 ? 'admin-stock-badge--zero' : p.stock_quantity <= 5 ? 'admin-stock-badge--critical' : 'admin-stock-badge--ok'}`}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#a78bfa' }}>{p.total_sold.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TopProducts;
