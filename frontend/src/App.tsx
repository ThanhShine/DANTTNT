import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout & Middleware
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import AccountPage from './pages/AccountPage';
import ActivityPage from './pages/ActivityPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import ChatHistoryDetailPage from './pages/ChatHistoryDetailPage';
import AiMemoryPage from './pages/AiMemoryPage';
import VNPayReturnPage from './pages/VNPayReturnPage';


// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Categories from './pages/admin/Categories';
import AdminProducts from './pages/admin/Products';
import Inventory from './pages/admin/Inventory';
import Orders from './pages/admin/Orders';
import Returns from './pages/admin/Returns';
import Coupons from './pages/admin/Coupons';
import Reviews from './pages/admin/Reviews';
import RevenueStats from './pages/admin/RevenueStats';
import TopProducts from './pages/admin/TopProducts';
import UserStats from './pages/admin/UserStats';
import ChatStats from './pages/admin/ChatStats';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="products" element={<Products />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="payment/vnpay-return" element={<VNPayReturnPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="checkout" element={<Checkout />} />

                <Route path="account" element={<AccountPage />} />
                <Route path="account/activity" element={<ActivityPage />} />
                <Route path="account/chat-history" element={<ChatHistoryPage />} />
                <Route path="account/chat-history/:sessionId" element={<ChatHistoryDetailPage />} />
                <Route path="account/ai-memory" element={<AiMemoryPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="chat-history" element={<ChatHistoryPage />} />
                <Route path="chat-history/:sessionId" element={<ChatHistoryDetailPage />} />
                <Route path="ai-memory" element={<AiMemoryPage />} />
                <Route path="profile" element={<AccountPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="orders" element={<Orders />} />
                <Route path="returns" element={<Returns />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="revenue" element={<RevenueStats />} />
                <Route path="top-products" element={<TopProducts />} />
                <Route path="user-stats" element={<UserStats />} />
                <Route path="chat-stats" element={<ChatStats />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
