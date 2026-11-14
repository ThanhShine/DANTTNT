import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users as UsersIcon, UserCheck, UserX, Shield } from 'lucide-react';
import { adminService } from '../../services';
import { UserStats as UserStatsType } from '../../types';

const MONTH_NAMES = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

const ROLE_COLORS: Record<string, string> = { admin: '#ef4444', staff: '#f59e0b', customer: '#3b82f6' };
const ROLE_VN: Record<string, string> = { admin: 'Admin', staff: 'Nhân viên', customer: 'Khách hàng' };

const UserStats: React.FC = () => {
  const [stats, setStats] = useState<UserStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getUserStats()
      .then(r => setStats(r.data.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /><p>Đang tải...</p></div>;
  if (!stats) return <div className="admin-empty">Không thể tải dữ liệu</div>;

  const activeCount = stats.byStatus.find(s => s.is_active === 1)?.count || 0;
  const inactiveCount = stats.byStatus.find(s => s.is_active === 0)?.count || 0;

  const roleChartData = stats.byRole.map(r => ({
    name: ROLE_VN[r.role] || r.role,
    value: Number(r.count),
    color: ROLE_COLORS[r.role] || '#6b7280',
  }));

  const growthData = stats.newByMonth.map(m => ({
    label: `${MONTH_NAMES[m.month - 1]}/${m.year}`,
    count: Number(m.count),
  }));

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Thống kê Người dùng</h1>
      </div>

      {/* KPI Cards */}
      <div className="admin-kpi-grid" style={{ marginBottom: 24 }}>
        <div className="admin-kpi-card admin-kpi-card--blue">
          <div className="admin-kpi-card__body">
            <p className="admin-kpi-card__title">Tổng người dùng</p>
            <p className="admin-kpi-card__value">{Number(stats.total).toLocaleString()}</p>
          </div>
          <div className="admin-kpi-card__icon-wrap"><UsersIcon size={28} /></div>
        </div>
        <div className="admin-kpi-card admin-kpi-card--green">
          <div className="admin-kpi-card__body">
            <p className="admin-kpi-card__title">Đang hoạt động</p>
            <p className="admin-kpi-card__value">{Number(activeCount).toLocaleString()}</p>
          </div>
          <div className="admin-kpi-card__icon-wrap"><UserCheck size={28} /></div>
        </div>
        <div className="admin-kpi-card admin-kpi-card--orange">
          <div className="admin-kpi-card__body">
            <p className="admin-kpi-card__title">Đã bị khóa</p>
            <p className="admin-kpi-card__value">{Number(inactiveCount).toLocaleString()}</p>
          </div>
          <div className="admin-kpi-card__icon-wrap"><UserX size={28} /></div>
        </div>
        <div className="admin-kpi-card admin-kpi-card--purple">
          <div className="admin-kpi-card__body">
            <p className="admin-kpi-card__title">Admins & Staff</p>
            <p className="admin-kpi-card__value">
              {stats.byRole.filter(r => r.role !== 'customer').reduce((s, r) => s + Number(r.count), 0)}
            </p>
          </div>
          <div className="admin-kpi-card__icon-wrap"><Shield size={28} /></div>
        </div>
      </div>

      <div className="admin-charts-row">
        {/* Pie - by role */}
        <div className="admin-card admin-card--sm">
          <div className="admin-card__header">
            <h3 className="admin-card__title">Phân bổ theo Role</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {roleChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="admin-pie-legend">
            {roleChartData.map((d, i) => (
              <div key={i} className="admin-pie-legend__item">
                <span className="admin-pie-legend__dot" style={{ background: d.color }} />
                <span className="admin-pie-legend__label">{d.name}</span>
                <span className="admin-pie-legend__count">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar - monthly growth */}
        <div className="admin-card admin-card--lg">
          <div className="admin-card__header">
            <h3 className="admin-card__title">Người dùng mới theo tháng (12 tháng gần nhất)</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#7c3aed" radius={[4,4,0,0]} name="Người dùng mới" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default UserStats;
