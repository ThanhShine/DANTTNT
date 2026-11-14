import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, ProductVariant, Review } from '../types';
import { productService, reviewService } from '../services';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useBehavior } from '../hooks/useBehavior';
import { formatCurrency, formatDate } from '../utils/format';
import { Star, ShoppingCart, Minus, Plus, ChevronRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { trackView, trackAddToCart, trackReview } = useBehavior();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productService.getById(Number(id));
        const data = res.data.data as Product;
        setProduct(data);
        if (data.thumbnail_url) setMainImage(data.thumbnail_url);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (error) {
        toast.error('Không tìm thấy sản phẩm');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, navigate]);

  // Track VIEW_PRODUCT khi vào trang, ghi duration khi rời
  useEffect(() => {
    if (id) {
      const stopTracking = trackView(Number(id), 'product_page');
      return stopTracking; // cleanup: ghi duration khi unmount
    }
  }, [id, trackView]);

  const handleAddToCart = () => {
    if (product) {
      const stock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
      if (quantity > stock) {
        toast.error(`Chỉ còn ${stock} sản phẩm trong kho`);
        return;
      }
      addToCart(product.id, quantity, selectedVariant?.id);
      // Track ADD_TO_CART
      trackAddToCart(product.id, quantity, selectedVariant?.id, 'product_page');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập để đánh giá'); return; }
    if (!reviewComment.trim()) { toast.error('Vui lòng nhập nội dung'); return; }
    setIsSubmittingReview(true);
    try {
      await reviewService.create({ product_id: Number(id), rating: reviewRating, comment: reviewComment });
      toast.success('Đánh giá thành công');
      trackReview(Number(id), reviewRating);
      setReviewComment('');
      setReviewRating(5);
      // Reload để thấy review mới (hoặc fetch lại product)
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đánh giá');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center">Đang tải...</div>;
  if (!product) return null;

  const currentPrice = selectedVariant ? selectedVariant.price : (product.sale_price || product.base_price);
  const originalPrice = selectedVariant ? null : (product.sale_price ? product.base_price : null);
  const stock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex text-sm text-gray-500 mb-8">
        <ol className="flex items-center space-x-2">
          <li><button onClick={() => navigate('/')} className="hover:text-primary-600">Trang chủ</button></li>
          <li><ChevronRight size={16} /></li>
          <li><button onClick={() => navigate('/products')} className="hover:text-primary-600">Sản phẩm</button></li>
          <li><ChevronRight size={16} /></li>
          <li className="text-gray-900 font-medium truncate">{product.name}</li>
        </ol>
      </nav>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-w-1 aspect-h-1 w-full bg-gray-50 rounded-xl overflow-hidden border">
              {mainImage ? (
                <img src={mainImage} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
              )}
            </div>
            {product.images && product.images.length > 0 && (
              <div className="flex space-x-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setMainImage(product.thumbnail_url || '')}
                  className={`w-20 h-20 rounded-md border-2 overflow-hidden flex-shrink-0 ${mainImage === product.thumbnail_url ? 'border-primary-500' : 'border-transparent'}`}
                >
                  <img src={product.thumbnail_url || ''} className="w-full h-full object-cover" />
                </button>
                {product.images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setMainImage(img.image_url)}
                    className={`w-20 h-20 rounded-md border-2 overflow-hidden flex-shrink-0 ${mainImage === img.image_url ? 'border-primary-500' : 'border-transparent'}`}
                  >
                    <img src={img.image_url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center text-yellow-400">
                <Star size={20} fill="currentColor" />
                <span className="text-gray-900 font-medium ml-1">{product.avg_rating}</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">{product.total_reviews} Đánh giá</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">Đã bán {product.total_sold}</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <div className="flex items-end space-x-4">
                <span className="text-3xl font-bold text-red-600">{formatCurrency(currentPrice)}</span>
                {originalPrice && (
                  <span className="text-lg text-gray-400 line-through mb-1">{formatCurrency(originalPrice)}</span>
                )}
                {product.discount_percent > 0 && !selectedVariant && (
                  <span className="bg-red-100 text-red-700 text-sm font-semibold px-2 py-1 rounded mb-1">
                    -{product.discount_percent}%
                  </span>
                )}
              </div>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Phân loại hàng</h3>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 border rounded-md ${selectedVariant?.id === v.id ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                    >
                      {v.variant_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="font-medium text-gray-900 mb-3">Số lượng</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-gray-100 text-gray-600">
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(stock, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center py-2 focus:outline-none border-x border-gray-300"
                  />
                  <button onClick={() => setQuantity(Math.min(stock, quantity + 1))} className="px-3 py-2 hover:bg-gray-100 text-gray-600">
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-sm text-gray-500">{stock} sản phẩm có sẵn</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={stock === 0}
                className="flex-1 bg-primary-50 text-primary-600 border border-primary-600 px-6 py-3 rounded-md font-medium hover:bg-primary-100 flex items-center justify-center disabled:opacity-50"
              >
                <ShoppingCart size={20} className="mr-2" /> Thêm Vào Giỏ
              </button>
              <button
                onClick={() => {
                  handleAddToCart();
                  navigate('/cart');
                }}
                disabled={stock === 0}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                Mua Ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Reviews Tabs */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b">Mô Tả Sản Phẩm</h2>
        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
          {product.description || product.short_description || 'Chưa có mô tả.'}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b">Đánh Giá Sản Phẩm</h2>
        
        {/* Write Review Form */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitReview} className="mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Viết đánh giá của bạn</h3>
            <div className="flex items-center mb-4 space-x-2">
              <span className="text-sm text-gray-600 mr-2">Đánh giá:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className={`focus:outline-none transition-colors ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  <Star fill={reviewRating >= star ? 'currentColor' : 'none'} size={24} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-primary-500 focus:border-primary-500 mb-3 min-h-[100px]"
              required
            ></textarea>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="bg-primary-600 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {isSubmittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
            <p className="text-gray-600">Bạn cần đăng nhập để đánh giá sản phẩm này.</p>
          </div>
        )}

        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map(review => (
              <div key={review.id} className="border-b pb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {review.reviewer_avatar ? (
                      <img src={review.reviewer_avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-gray-500" size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.reviewer_name}</p>
                    <div className="flex items-center text-yellow-400 text-sm">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} className={i >= review.rating ? 'text-gray-300' : ''} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 ml-auto">{formatDate(review.created_at)}</span>
                </div>
                <p className="text-gray-700 ml-13 pl-13">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Chưa có đánh giá nào.</p>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
