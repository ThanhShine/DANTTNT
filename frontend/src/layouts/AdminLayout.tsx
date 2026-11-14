import React, { useState } from 'react';
import '../admin.css';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Tag, Package, Warehouse,
  ShoppingCart, Star, TrendingUp, BarChart3, UserCheck,
  LogOut, Menu, X, ChevronRight, Bell, Shield, Store, Bot, Ticket, RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin',             label: 'Dashboard',       icon: LayoutDashboard, exact: true },
  { to: '/admin/users',       label: 'Người dùng',      icon: Users },
  { to: '/admin/categories',  label: 'Danh mục',        icon: Tag },
  { to: '/admin/products',    label: 'Sản phẩm',        icon: Package },
  { to: '/admin/inventory',   label: 'Tồn kho',         icon: Warehouse },
  { to: '/admin/orders',      label: 'Đơn hàng',        icon: ShoppingCart },
  { to: '/admin/returns',     label: 'Đổi / Trả hàng',  icon: RotateCcw },
  { to: '/admin/coupons',     label: 'Mã giảm giá',     icon: Ticket },
  { to: '/admin/reviews',     label: 'Đánh giá',        icon: Star },
  { to: '/admin/revenue',     label: 'Doanh thu',       icon: TrendingUp },
  { to: '/admin/top-products',label: 'SP Bán chạy',     icon: BarChart3 },
  { to: '/admin/user-stats',  label: 'Thống kê Users',  icon: UserCheck },
  { to: '/admin/chat-stats',  label: 'Lịch sử Chatbot', icon: Bot },
];

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-root">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : 'admin-sidebar--closed'}`}>
        {/* Logo */}
        <div className="admin-sidebar__logo">
          <Shield size={22} className="admin-sidebar__logo-icon" />
          {sidebarOpen && <span className="admin-sidebar__logo-text">Sales AI Admin</span>}
        </div>

        {/* Nav Items */}
        <nav className="admin-sidebar__nav">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'admin-nav-item--active' : ''}`
              }
            >
              <Icon size={18} className="admin-nav-item__icon" />
              {sidebarOpen && <span className="admin-nav-item__label">{label}</span>}
              {sidebarOpen && <ChevronRight size={14} className="admin-nav-item__arrow" />}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="admin-sidebar__footer">
          {sidebarOpen && (
            <div className="admin-sidebar__user">
              <div className="admin-sidebar__avatar">
                {user?.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="admin-sidebar__user-info">
                <p className="admin-sidebar__user-name">{user?.full_name}</p>
                <p className="admin-sidebar__user-role">{user?.role}</p>
              </div>
            </div>
          )}
          <button className="admin-sidebar__logout" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`admin-main ${sidebarOpen ? 'admin-main--sidebar-open' : ''}`}>
        {/* Top header */}
        <header className="admin-header">
          <button
            className="admin-header__toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="admin-header__right">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mr-2 cursor-pointer"
              title="Quay lại giao diện mua sắm"
            >
              <Store size={15} />
              <span>Về cửa hàng</span>
            </button>
            <button className="admin-header__btn">
              <Bell size={18} />
            </button>
            <div className="admin-header__user-badge">
              <span>{user?.full_name}</span>
              <span className="admin-header__role-badge">{user?.role?.toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
