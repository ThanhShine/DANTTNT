import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">SalesAI</h3>
            <p className="text-sm">
              Hệ thống bán hàng tích hợp AI thông minh, mang đến trải nghiệm mua sắm cá nhân hoá và tiện lợi nhất.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white">Facebook</a>
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">Instagram</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Liên Kết</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white">Trang chủ</Link></li>
              <li><Link to="/products" className="hover:text-white">Sản phẩm</Link></li>
              <li><Link to="/about" className="hover:text-white">Về chúng tôi</Link></li>
              <li><Link to="/contact" className="hover:text-white">Liên hệ</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Chăm Sóc Khách Hàng</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="hover:text-white">Trung tâm hỗ trợ</Link></li>
              <li><Link to="/shipping" className="hover:text-white">Chính sách vận chuyển</Link></li>
              <li><Link to="/returns" className="hover:text-white">Chính sách đổi trả</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Chính sách bảo mật</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Liên Hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <MapPin size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                <span>Đà Nẵng</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-2 flex-shrink-0" />
                <span>1900 1234</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 flex-shrink-0" />
                <span>support@salesai.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} SalesAI. Đồ án môn học AI.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
