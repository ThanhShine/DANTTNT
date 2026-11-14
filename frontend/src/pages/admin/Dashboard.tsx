import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, ShoppingCart, Users, Package,
  AlertTriangle, Clock, ArrowUpRight
} from 'lucide-react';
import { adminService } from '../../services';
import { DashboardData } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending:    '#f59e0b',
  processing: '#3b82f6',
  shipped:    '#8b5cf6',
  delivered:  '#10b981',
  cancelled:  '#ef4444',
  returned:   '#6b7280',
};

const ORDER_STATUS_VN: Record<string, string> = {
  pending: 'Chờ xử lý', processing: 'Đang xử lý',
  shipped: 'Đã gửi', delivered: 'Đã giao',
  cancelled: 'Đã huỷ', returned: 'Hoàn hàng',
};

const PAYMENT_VN: Record<string, string> = {
  pending: 'Chờ TT', paid: 'Đã TT', failed: 'Thất bại', refunded: 'Hoàn tiền'
};

import { formatCurrency } from '../../utils/format';

const fmt = (n: number | string) => formatCurrency(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

interface KpiCardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  gradient: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, sub, icon: Icon, gradient }) => (
  <div className={`admin-kpi-card admin-kpi-card--${gradient}`}>
    <div className="admin-kpi-card__body">
      <p className="admin-kpi-card__title">{title}</p>
      <p className="admin-kpi-card__value">{value}</p>
      <p className="admin-kpi-card__sub">{sub}</p>
    </div>
    <div className="admin-kpi-card__icon-wrap">
      <Icon size={28} />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard()
      .then(r => setData(r.data.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="admin-loading">
      <div className="admin-spinner" />
      <p>Đang tải dữ liệu...</p>
    </div>
  );

  if (!data) return <div className="admin-empty">Không thể tải dữ liệu dashboard</div>;

  const { overview, revenueByDay, ordersByStatus, topProducts, lowStock, recentOrders } = data;

  const pieData = ordersByStatus.map(o => ({
    name: ORDER_STATUS_VN[o.status] || o.status,
    value: Number(o.count),
    color: STATUS_COLORS[o.status] || '#6b7280',
  }));

  const revenueChartData = revenueByDay.map(d => ({
    date: fmtDate(d.date),
    revenue: Number(d.revenue),
    orders: Number(d.orders),
  }));

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Dashboard</h1>
        <p className="admin-page__subtitle">Tổng quan hệ thống bán hàng</p>
      </div>

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <KpiCard
          title="Tổng doanh thu"
          value={fmt(Number(overview.totalRevenue))}
          sub="Đơn hàng đã thanh toán"
          icon={TrendingUp}
          gradient="green"
        />
        <KpiCard
          title="Tổng đơn hàng"
          value={overview.totalOrders.toLocaleString()}
          sub={`${overview.todayOrders} đơn hôm nay`}
          icon={ShoppingCart}
          gradient="blue"
        />
        <KpiCard
          title="Người dùng"
          value={overview.totalCustomers.toLocaleString()}
          sub={`+${overview.newUsersThisWeek} tuần này`}
          icon={Users}
          gradient="purple"
        />
        <KpiCard
          title="Sản phẩm"
          value={overview.totalProducts.toLocaleString()}
          sub="Đang hoạt động"
          icon={Package}
          gradient="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="admin-charts-row">
        {/* Revenue Area Chart */}
        <div className="admin-card admin-card--lg">
          <div className="admin-card__header">
            <h3 className="admin-card__title">Doanh thu 30 ngày gần nhất</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value: any) => [fmt(Number(value)), 'Doanh thu']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="admin-card admin-card--sm">
          <div className="admin-card__header">
            <h3 className="admin-card__title">Trạng thái đơn hàng</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(value: any, name: any) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="admin-pie-legend">
            {pieData.map((d, i) => (
              <div key={i} className="admin-pie-legend__item">
                <span className="admin-pie-legend__dot" style={{ background: d.color }} />
                <span className="admin-pie-legend__label">{d.name}</span>
                <span className="admin-pie-legend__count">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card__header">
          <h3 className="admin-card__title">Số đơn hàng theo ngày</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Đơn hàng" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row */}
      <div className="admin-bottom-row">
        {/* Recent Orders */}
        <div className="admin-card admin-card--lg">
          <div className="admin-card__header">
            <h3 className="admin-card__title"><Clock size={16} style={{ display: 'inline', marginRight: 6 }} />Đơn hàng mới nhất</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td><span className="admin-badge admin-badge--code">{order.order_code}</span></td>
                    <td>{order.customer_name}</td>
                    <td>{fmt(Number(order.total_amount))}</td>
                    <td>
                      <span className={`admin-status admin-status--${order.status}`}>
                        {ORDER_STATUS_VN[order.status] || order.status}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status admin-status--payment-${order.payment_status}`}>
                        {PAYMENT_VN[order.payment_status] || order.payment_status}
                      </span>
                    </td>
                    <td>{fmtDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="admin-right-col">
          {/* Top Products */}
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card__header">
              <h3 className="admin-card__title"><ArrowUpRight size={16} style={{ display: 'inline', marginRight: 6 }} />Top sản phẩm bán chạy</h3>
            </div>
            <div className="admin-top-products">
              {topProducts.map((p, i) => (
                <div key={p.id} className="admin-top-product-item">
                  <span className="admin-top-product-item__rank">{i + 1}</span>
                  <img
                    src={p.thumbnail_url || 'https://via.placeholder.com/40'}
                    alt={p.name}
                    className="admin-top-product-item__img"
                  />
                  <div className="admin-top-product-item__info">
                    <p className="admin-top-product-item__name">{p.name}</p>
                    <p className="admin-top-product-item__sold">Đã bán: {p.total_sold}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock */}
          <div className="admin-card">
            <div className="admin-card__header">
              <h3 className="admin-card__title">
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6, color: '#f59e0b' }} />
                Tồn kho thấp
              </h3>
            </div>
            <div className="admin-low-stock">
              {lowStock.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '16px 0' }}>Không có sản phẩm cần cảnh báo</p>
              ) : lowStock.map(p => (
                <div key={p.id} className="admin-low-stock-item">
                  <div>
                    <p className="admin-low-stock-item__name">{p.name}</p>
                    <p className="admin-low-stock-item__sku">SKU: {p.sku}</p>
                  </div>
                  <span className={`admin-stock-badge ${p.stock_quantity === 0 ? 'admin-stock-badge--zero' : p.stock_quantity <= 5 ? 'admin-stock-badge--critical' : 'admin-stock-badge--low'}`}>
                    {p.stock_quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
