import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { adminService } from '../../services';
import { RevenueReport } from '../../types';
import { formatCurrency } from '../../utils/format';

const fmt = (n: number | string) => formatCurrency(n);
const fmtM = (v: number) => `${(v / 1e6).toFixed(1)}M`;

const MONTH_NAMES = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

const RevenueStats: React.FC = () => {
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [year, setYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    setLoading(true);
    adminService.getRevenueReport({ period, year })
      .then(r => setReport(r.data.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, year]);

  const chartData = report?.data.map(d => ({
    label: period === 'month' ? MONTH_NAMES[Number(d.period) - 1] : String(d.period),
    revenue: Number(d.revenue),
    orders: Number(d.orders),
    avg: Number(d.avg_order_value || 0),
  })) || [];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Thống kê Doanh thu</h1>
      </div>

      <div className="admin-filters">
        <select value={period} onChange={e => setPeriod(e.target.value)} className="admin-select">
          <option value="day">Theo ngày</option>
          <option value="month">Theo tháng</option>
          <option value="week">Theo tuần</option>
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="admin-select">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary KPIs */}
      {report?.summary && (
        <div className="admin-kpi-grid" style={{ marginBottom: 24 }}>
          <div className="admin-kpi-card admin-kpi-card--green">
            <div className="admin-kpi-card__body">
              <p className="admin-kpi-card__title">Tổng doanh thu</p>
              <p className="admin-kpi-card__value">{fmt(Number(report.summary.total_revenue))}</p>
              <p className="admin-kpi-card__sub">Năm {year}</p>
            </div>
          </div>
          <div className="admin-kpi-card admin-kpi-card--blue">
            <div className="admin-kpi-card__body">
              <p className="admin-kpi-card__title">Tổng đơn hàng</p>
              <p className="admin-kpi-card__value">{Number(report.summary.total_orders).toLocaleString()}</p>
              <p className="admin-kpi-card__sub">Đã thanh toán</p>
            </div>
          </div>
          <div className="admin-kpi-card admin-kpi-card--purple">
            <div className="admin-kpi-card__body">
              <p className="admin-kpi-card__title">Giá trị TB/đơn</p>
              <p className="admin-kpi-card__value">{fmt(Number(report.summary.avg_order_value))}</p>
              <p className="admin-kpi-card__sub">Average order value</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /></div>
      ) : (
        <>
          <div className="admin-card" style={{ marginBottom: 24 }}>
            <div className="admin-card__header">
              <h3 className="admin-card__title">Doanh thu {period === 'month' ? 'theo tháng' : period === 'day' ? 'theo ngày' : 'theo tuần'} — {year}</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={fmtM} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(value: any, name: any) => [
                    name === 'revenue' ? fmt(Number(value)) : value,
                    name === 'revenue' ? 'Doanh thu' : 'Đơn hàng'
                  ]}
                />
                <Legend formatter={v => v === 'revenue' ? 'Doanh thu' : 'Đơn hàng'} />
                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-card">
            <div className="admin-card__header">
              <h3 className="admin-card__title">Số lượng đơn hàng</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4,4,0,0]} name="Đơn hàng" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueStats;
