/**
 * ImageSearch.tsx — Component tìm kiếm sản phẩm bằng hình ảnh
 * Giai đoạn 9: Computer Vision
 *
 * Cách dùng:
 *   <ImageSearch />
 *
 * Hiển thị: nút camera mở modal → drag-drop/browse ảnh → hiển thị kết quả
 */

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectFromImage, VisionResult, VisionProduct } from '../services/visionService';
import { formatCurrency } from '../utils/format';

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n: number | string) => formatCurrency(n);

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB   = 5;

// ── Sub-components ────────────────────────────────────────────

const ProductCard: React.FC<{ product: VisionProduct }> = ({ product }) => {
  const navigate = useNavigate();
  const displayPrice = product.sale_price ?? product.price;
  const hasDiscount  = product.sale_price !== null && product.sale_price < product.price;

  return (
    <div
      className="vision-product-card"
      onClick={() => navigate(`/products/${product.product_id}`)}
    >
      <div className="vision-product-card__img-wrap">
        <img
          src={product.image || 'https://placehold.co/200x200?text=No+Image'}
          alt={product.product_name}
          className="vision-product-card__img"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=No+Image';
          }}
        />
        {hasDiscount && (
          <span className="vision-product-card__badge">
            -{Math.round((1 - product.sale_price! / product.price) * 100)}%
          </span>
        )}
      </div>
      <div className="vision-product-card__info">
        <p className="vision-product-card__name" title={product.product_name}>
          {product.product_name}
        </p>
        <p className="vision-product-card__category">{product.category_name}</p>
        <div className="vision-product-card__price-row">
          <span className="vision-product-card__price">{fmt(displayPrice)}</span>
          {hasDiscount && (
            <span className="vision-product-card__original">{fmt(product.price)}</span>
          )}
        </div>
        {product.avg_rating > 0 && (
          <p className="vision-product-card__rating">
            {'★'.repeat(Math.round(product.avg_rating))}{'☆'.repeat(5 - Math.round(product.avg_rating))}
            {' '}{product.avg_rating.toFixed(1)}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────

const ImageSearch: React.FC = () => {
  const [isOpen,    setIsOpen]    = useState(false);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [file,      setFile]      = useState<File | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<VisionResult | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [dragging,  setDragging]  = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Reset state ─────────────────────────────────────────────
  const resetState = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setError(null);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  // ── Validate và set file ─────────────────────────────────────
  const processFile = useCallback((f: File) => {
    setError(null);
    setResult(null);

    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File quá lớn. Tối đa ${MAX_SIZE_MB}MB`);
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  // ── File input change ────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  // ── Drag & Drop ──────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  // ── Gọi API detect ───────────────────────────────────────────
  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await detectFromImage(file);
      setResult(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message || 'Lỗi kết nối. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Camera Button */}
      <button
        className="image-search-trigger"
        onClick={() => setIsOpen(true)}
        title="Tìm kiếm bằng hình ảnh"
        aria-label="Tìm kiếm bằng hình ảnh"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="image-search-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
          <div className="image-search-modal">
            {/* Header */}
            <div className="image-search-modal__header">
              <h2 className="image-search-modal__title">🔍 Tìm kiếm bằng hình ảnh</h2>
              <button className="image-search-modal__close" onClick={handleClose} aria-label="Đóng">×</button>
            </div>

            {/* Upload Zone */}
            {!preview && (
              <div
                className={`image-search-dropzone ${dragging ? 'image-search-dropzone--active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="image-search-dropzone__icon">📷</div>
                <p className="image-search-dropzone__text">
                  Kéo thả ảnh vào đây hoặc <span>click để chọn file</span>
                </p>
                <p className="image-search-dropzone__hint">Hỗ trợ: JPG, PNG, WEBP • Tối đa {MAX_SIZE_MB}MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            )}

            {/* Preview + Actions */}
            {preview && !result && (
              <div className="image-search-preview">
                <img src={preview} alt="Preview" className="image-search-preview__img" />
                <div className="image-search-preview__actions">
                  <button className="btn btn--secondary" onClick={resetState} disabled={loading}>
                    Chọn ảnh khác
                  </button>
                  <button className="btn btn--primary" onClick={handleDetect} disabled={loading}>
                    {loading ? (
                      <><span className="spinner-xs" /> Đang phân tích...</>
                    ) : (
                      '🔍 Nhận diện sản phẩm'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="image-search-error">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="image-search-results">
                {/* Detection Info */}
                <div className={`image-search-results__info ${result.fallback ? 'image-search-results__info--warn' : 'image-search-results__info--success'}`}>
                  <div className="image-search-results__info-left">
                    {preview && (
                      <img src={preview} alt="Uploaded" className="image-search-results__thumb" />
                    )}
                    <div>
                      <p className="image-search-results__message">{result.message}</p>
                      {result.top_class && (
                        <p className="image-search-results__meta">
                          Nhận diện: <strong>{result.top_class}</strong>
                          {' '}({(result.confidence * 100).toFixed(0)}% độ chính xác)
                        </p>
                      )}
                    </div>
                  </div>
                  <button className="btn btn--ghost btn--sm" onClick={resetState}>
                    Thử lại
                  </button>
                </div>

                {/* Products Grid */}
                {result.products.length > 0 ? (
                  <div className="image-search-results__grid">
                    {result.products.map((p) => (
                      <ProductCard key={p.product_id} product={p} />
                    ))}
                  </div>
                ) : (
                  <p className="image-search-results__empty">
                    Không tìm thấy sản phẩm phù hợp trong hệ thống.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        .image-search-trigger {
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 50%;
          border: 1px solid #e2e8f0; background: #f8fafc;
          color: #64748b; cursor: pointer; transition: all .2s;
          flex-shrink: 0;
        }
        .image-search-trigger:hover { background: #6d28d9; color: #fff; border-color: #6d28d9; transform: scale(1.05); }

        .image-search-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 16px; backdrop-filter: blur(4px);
        }
        .image-search-modal {
          background: #fff; border-radius: 16px;
          width: 100%; max-width: 720px; max-height: 90vh;
          overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,.3);
        }
        .image-search-modal__header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
          position: sticky; top: 0; background: #fff; z-index: 1;
        }
        .image-search-modal__title { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0; }
        .image-search-modal__close {
          width: 32px; height: 32px; border-radius: 50%; border: none;
          background: #f1f5f9; font-size: 1.2rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; color: #64748b;
        }
        .image-search-modal__close:hover { background: #fee2e2; color: #ef4444; }

        .image-search-dropzone {
          margin: 24px; border: 2px dashed #cbd5e1; border-radius: 12px;
          padding: 48px 24px; text-align: center; cursor: pointer;
          transition: all .2s;
        }
        .image-search-dropzone:hover, .image-search-dropzone--active {
          border-color: #6d28d9; background: #faf5ff;
        }
        .image-search-dropzone__icon { font-size: 3rem; margin-bottom: 12px; }
        .image-search-dropzone__text { font-size: 1rem; color: #475569; margin-bottom: 6px; }
        .image-search-dropzone__text span { color: #6d28d9; font-weight: 600; text-decoration: underline; }
        .image-search-dropzone__hint { font-size: .85rem; color: #94a3b8; }

        .image-search-preview {
          padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 20px;
        }
        .image-search-preview__img {
          max-height: 280px; max-width: 100%; border-radius: 12px;
          object-fit: contain; box-shadow: 0 4px 20px rgba(0,0,0,.1);
        }
        .image-search-preview__actions { display: flex; gap: 12px; }

        .image-search-error {
          margin: 0 24px 16px; padding: 12px 16px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 8px; color: #dc2626; font-size: .9rem;
        }

        .image-search-results { padding: 0 24px 24px; }
        .image-search-results__info {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 14px 16px; border-radius: 10px;
          margin-bottom: 20px;
        }
        .image-search-results__info--success { background: #f0fdf4; border: 1px solid #86efac; }
        .image-search-results__info--warn    { background: #fffbeb; border: 1px solid #fde68a; }
        .image-search-results__info-left { display: flex; align-items: center; gap: 12px; }
        .image-search-results__thumb {
          width: 52px; height: 52px; border-radius: 8px; object-fit: cover;
          flex-shrink: 0;
        }
        .image-search-results__message { font-size: .9rem; color: #374151; font-weight: 500; margin: 0 0 4px; }
        .image-search-results__meta { font-size: .8rem; color: #6b7280; margin: 0; }

        .image-search-results__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 14px;
        }
        .image-search-results__empty { text-align: center; color: #94a3b8; padding: 24px; }

        /* Product Cards */
        .vision-product-card {
          border: 1px solid #e2e8f0; border-radius: 10px;
          overflow: hidden; cursor: pointer; transition: all .2s;
          background: #fff;
        }
        .vision-product-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(109,40,217,.12); border-color: #a78bfa; }
        .vision-product-card__img-wrap { position: relative; padding-top: 100%; background: #f8fafc; }
        .vision-product-card__img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: contain; padding: 8px;
        }
        .vision-product-card__badge {
          position: absolute; top: 8px; right: 8px;
          background: #ef4444; color: #fff; font-size: .7rem;
          font-weight: 700; padding: 2px 6px; border-radius: 4px;
        }
        .vision-product-card__info { padding: 10px; }
        .vision-product-card__name {
          font-size: .82rem; font-weight: 600; color: #1e293b;
          margin: 0 0 4px; display: -webkit-box;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .vision-product-card__category { font-size: .75rem; color: #6d28d9; margin: 0 0 6px; }
        .vision-product-card__price-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .vision-product-card__price { font-size: .85rem; font-weight: 700; color: #dc2626; }
        .vision-product-card__original { font-size: .75rem; color: #94a3b8; text-decoration: line-through; }
        .vision-product-card__rating { font-size: .75rem; color: #f59e0b; margin: 4px 0 0; }

        /* Buttons */
        .btn { padding: 10px 20px; border-radius: 8px; font-size: .9rem; font-weight: 600; cursor: pointer; border: none; transition: all .2s; display: inline-flex; align-items: center; gap: 6px; }
        .btn--primary { background: #6d28d9; color: #fff; }
        .btn--primary:hover:not(:disabled) { background: #5b21b6; }
        .btn--primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn--secondary { background: #f1f5f9; color: #475569; }
        .btn--secondary:hover:not(:disabled) { background: #e2e8f0; }
        .btn--ghost { background: transparent; color: #6d28d9; border: 1px solid #a78bfa; padding: 6px 12px; font-size: .8rem; }
        .btn--ghost:hover { background: #f5f3ff; }
        .btn--sm { padding: 6px 12px; font-size: .8rem; }
        .spinner-xs {
          width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 480px) {
          .image-search-results__grid { grid-template-columns: repeat(2, 1fr); }
          .image-search-modal__title { font-size: 1rem; }
        }
      `}</style>
    </>
  );
};

export default ImageSearch;
