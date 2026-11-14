import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, LogOut, Menu, X, ClipboardList, Activity, Package, MessageSquare, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ImageSearch from './ImageSearch';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              SalesAI
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden sm:flex flex-1 max-w-lg mx-8 items-center gap-2">
            <form onSubmit={handleSearch} className="flex-1 flex relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700"
              >
                <Search size={20} />
              </button>
            </form>
            {/* Nút tìm kiếm bằng hình ảnh — Giai đoạn 9 */}
            <ImageSearch />
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center space-x-6">
            <Link to="/products" className="text-gray-600 hover:text-primary-600">
              Sản phẩm
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
              >
                <ClipboardList size={14} />
                <span>Trang Quản Trị</span>
              </Link>
            )}
            
            <Link to="/cart" className="text-gray-600 hover:text-primary-600 relative">
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <User size={18} className="text-primary-600" />
                    )}
                  </div>
                  <span className="max-w-[100px] truncate text-sm font-medium">{user?.full_name}</span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    {/* Header dropdown */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/account"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                    >
                      <User size={16} className="mr-3 text-gray-400" />
                      Tài khoản của tôi
                    </Link>

                    <Link
                      to="/cart"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                    >
                      <ShoppingCart size={16} className="mr-3 text-gray-400" />
                      Giỏ hàng
                      {itemCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                          {itemCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                    >
                      <Package size={16} className="mr-3 text-gray-400" />
                      Đơn mua
                    </Link>

                    <Link
                      to="/account/chat-history"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                    >
                      <MessageSquare size={16} className="mr-3 text-gray-400" />
                      Lịch sử trò chuyện
                    </Link>

                    <Link
                      to="/account/ai-memory"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                    >
                      <Brain size={16} className="mr-3 text-primary-500" />
                      Sở thích & Ký ức AI
                    </Link>

                    <Link
                      to="/account/activity"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                    >
                      <Activity size={16} className="mr-3 text-gray-400" />
                      Lịch sử hoạt động
                    </Link>

                    {/* Admin link */}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <ClipboardList size={16} className="mr-3" />
                        Trang Quản Trị
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                      >
                        <LogOut size={16} className="mr-3 text-gray-400" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-primary-600">Đăng nhập</Link>
                <Link to="/register" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Đăng ký</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center space-x-4">
            <Link to="/cart" className="text-gray-600 relative">
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white border-t">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <form onSubmit={handleSearch} className="flex relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full px-4 py-2 border border-gray-300 rounded-l-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="px-4 bg-primary-600 text-white rounded-r-md">
                <Search size={20} />
              </button>
            </form>
            
            <Link to="/products" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-primary-600 py-2">Sản phẩm</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/account" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-primary-600 py-2">Tài khoản của tôi</Link>
                <Link to="/orders" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-primary-600 py-2">Đơn mua</Link>
                <Link to="/account/chat-history" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-primary-600 py-2">Lịch sử trò chuyện</Link>
                <Link to="/account/activity" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-primary-600 py-2">Lịch sử hoạt động</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block text-red-600 py-2">Trang Quản Trị</Link>
                )}
                <button onClick={handleLogout} className="block text-gray-600 hover:text-primary-600 py-2 w-full text-left">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-primary-600 py-2">Đăng nhập</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-primary-600 py-2">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
