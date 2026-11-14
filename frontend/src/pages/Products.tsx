import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Product, Category } from '../types';
import { productService, categoryService } from '../services';
import { Star, ShoppingCart, Filter } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useBehavior } from '../hooks/useBehavior';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { trackSearch, trackClick, trackAddToCart } = useBehavior();
  const searchTrackedRef = useRef<string>(''); // track query đã gửi

  const searchQuery = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id') || '';
  const sortBy = searchParams.get('sort_by') || 'created_at';

  useEffect(() => {
    categoryService.getAll().then(res => setCategories(res.data.data as Category[]));
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (searchQuery) params.search = searchQuery;
        if (categoryId) params.category_id = categoryId;
        if (sortBy) params.sort_by = sortBy;
        params.order = sortBy === 'base_price' ? 'asc' : 'desc';

        const res = await productService.getAll(params);
        const data = res.data.data as Product[];
        setProducts(data);

        // Track SEARCH khi có query và chưa gửi lần này
        if (searchQuery && searchQuery !== searchTrackedRef.current) {
          trackSearch(searchQuery, data.length, 'product_page');
          searchTrackedRef.current = searchQuery;
        }
        if (!searchQuery) searchTrackedRef.current = '';
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchQuery, categoryId, sortBy, trackSearch]);

  const handleFilterChange = (key: string, value: string) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar / Filters */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
          <div className="flex items-center space-x-2 font-bold text-lg mb-6 text-gray-900">
            <Filter size={20} />
            <span>Bộ Lọc</span>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-gray-700">Danh mục</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={!categoryId}
                  onChange={() => handleFilterChange('category_id', '')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-600 hover:text-primary-600">Tất cả</span>
              </label>
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={categoryId === String(cat.id)}
                    onChange={() => handleFilterChange('category_id', String(cat.id))}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-600 hover:text-primary-600">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-gray-700">Sắp xếp theo</h3>
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="created_at">Mới nhất</option>
              <option value="base_price">Giá thấp đến cao</option>
              <option value="total_sold">Bán chạy nhất</option>
              <option value="avg_rating">Đánh giá cao</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1">
        {searchQuery && (
          <h2 className="text-2xl font-bold mb-6">Kết quả tìm kiếm cho: "{searchQuery}"</h2>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-80 rounded-xl"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group relative flex flex-col">
                {product.discount_percent > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    -{product.discount_percent}%
                  </div>
                )}
                <Link
                  to={`/product/${product.id}`}
                  className="block relative h-56 overflow-hidden bg-gray-50 flex-shrink-0"
                  onClick={() => trackClick(product.id, searchQuery ? 'search_results' : 'product_list', products.indexOf(product))}
                >
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
                <div className="p-4 flex flex-col flex-grow">
                  <p className="text-xs text-gray-500 mb-1">{product.category_name}</p>
                  <Link to={`/product/${product.id}`} className="flex-grow">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-primary-600">
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
                      onClick={() => {
                        addToCart(product.id, 1);
                        trackAddToCart(product.id, 1, undefined, 'product_list');
                      }}
                      className="p-2 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-600 hover:text-white transition-colors"
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
    </div>
  );
};

export default Products;
