import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { productService } from '../services';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await productService.getAll({ is_featured: 1, limit: 8 });
        setFeaturedProducts(res.data.data as Product[]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Mua sắm thông minh cùng SalesAI
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl text-primary-100">
            Trải nghiệm công nghệ AI Chatbot tư vấn và Hệ thống gợi ý cá nhân hoá dành riêng cho bạn.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-bold rounded-full hover:bg-gray-50 transition-colors text-lg"
          >
            Khám phá ngay <ArrowRight className="ml-2" />
          </Link>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Sản phẩm nổi bật</h2>
            <p className="text-gray-500 mt-2">Các sản phẩm được yêu thích nhất trong tuần</p>
          </div>
          <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
            Xem tất cả <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-80 rounded-xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group relative">
                {product.discount_percent > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    -{product.discount_percent}%
                  </div>
                )}
                <Link to={`/product/${product.id}`} className="block relative h-64 overflow-hidden bg-gray-50">
                  {product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </Link>
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">{product.category_name}</p>
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-primary-600 h-12">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center mt-2 text-yellow-400">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm text-gray-600 ml-1">{product.avg_rating} ({product.total_reviews})</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      {product.sale_price ? (
                        <>
                          <p className="text-lg font-bold text-red-600">{formatCurrency(product.sale_price)}</p>
                          <p className="text-sm text-gray-400 line-through">{formatCurrency(product.base_price)}</p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(product.base_price)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product.id, 1)}
                      className="p-2 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-600 hover:text-white transition-colors"
                      title="Thêm vào giỏ"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="bg-gray-50 border-t py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🤖</div>
              <h3 className="text-xl font-bold mb-2">AI Tư Vấn</h3>
              <p className="text-gray-600">Chatbot thông minh giải đáp thắc mắc và hỗ trợ mua hàng 24/7.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✨</div>
              <h3 className="text-xl font-bold mb-2">Gợi Ý Cá Nhân Hoá</h3>
              <p className="text-gray-600">Gợi ý sản phẩm phù hợp nhất dựa trên sở thích và hành vi của bạn.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚡</div>
              <h3 className="text-xl font-bold mb-2">Giao Hàng Nhanh</h3>
              <p className="text-gray-600">Hỗ trợ vận chuyển toàn quốc với tốc độ nhanh chóng và an toàn.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
