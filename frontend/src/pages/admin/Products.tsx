import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, X, Check, Search, Image as ImageIcon,
  Layers, Star, CheckCircle2, AlertCircle, ExternalLink, RefreshCw
} from 'lucide-react';
import { adminService, productService } from '../../services';
import { Product, Category, ProductVariant, ProductImage } from '../../types';
import toast from 'react-hot-toast';
import { formatCurrency, parseVndInput } from '../../utils/format';

interface ProductForm {
  category_id: string;
  name: string;
  sku: string;
  brand: string;
  short_description: string;
  base_price: string;
  sale_price: string;
  stock_quantity: string;
  thumbnail_url: string;
  is_featured: number;
  is_active: number;
}

const defaultForm: ProductForm = {
  category_id: '', name: '', sku: '', brand: '', short_description: '',
  base_price: '', sale_price: '', stock_quantity: '0', thumbnail_url: '',
  is_featured: 0, is_active: 1,
};

type ModalTab = 'info' | 'images' | 'variants';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('info');
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  // Gallery & Variants state for editing product
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // New Image Form
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [newImageIsPrimary, setNewImageIsPrimary] = useState(false);
  const [addingImage, setAddingImage] = useState(false);

  // New Variant Form
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantSku, setNewVariantSku] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantStock, setNewVariantStock] = useState('10');
  const [newVariantImage, setNewVariantImage] = useState('');
  const [addingVariant, setAddingVariant] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        adminService.getProducts({ search: search || undefined, category_id: categoryFilter || undefined, page, limit: 15 }),
        adminService.getCategories(),
      ]);
      setProducts(prodRes.data.data as Product[] || []);
      setTotalPages(prodRes.data.meta?.totalPages || 1);
      setCategories(catRes.data.data as Category[] || []);
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, [search, categoryFilter, page]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Load detailed product images and variants
  const loadProductDetail = async (productId: number) => {
    setLoadingDetail(true);
    try {
      const res = await productService.getById(productId);
      const data = res.data.data as any;
      setProductImages(data.images || []);
      setProductVariants(data.variants || []);
    } catch {
      toast.error('Không thể tải chi tiết ảnh và biến thể');
    } finally {
      setLoadingDetail(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setProductImages([]);
    setProductVariants([]);
    setActiveTab('info');
    setModal('create');
  };

  const openEdit = async (p: Product, initialTab: ModalTab = 'info') => {
    setEditing(p);
    setForm({
      category_id: String(p.category_id), name: p.name, sku: p.sku,
      brand: p.brand || '', short_description: p.short_description || '',
      base_price: String(p.base_price), sale_price: p.sale_price ? String(p.sale_price) : '',
      stock_quantity: String(p.stock_quantity), thumbnail_url: p.thumbnail_url || '',
      is_featured: p.is_featured, is_active: 1,
    });
    // Reset child forms
    setNewImageUrl('');
    setNewImageAlt('');
    setNewImageIsPrimary(false);
    setNewVariantName('');
    setNewVariantSku(`${p.sku}-`);
    setNewVariantPrice(p.sale_price ? String(p.sale_price) : String(p.base_price));
    setNewVariantStock('10');
    setNewVariantImage('');

    setActiveTab(initialTab);
    setModal('edit');
    await loadProductDetail(p.id);
  };

  const handleSave = async () => {
    if (!form.name || !form.category_id || !form.base_price) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc'); return;
    }
    setSaving(true);
    try {
      const payload = {
        category_id: Number(form.category_id),
        name: form.name, sku: form.sku, brand: form.brand || null,
        short_description: form.short_description || null,
        base_price: parseVndInput(form.base_price),
        sale_price: form.sale_price ? parseVndInput(form.sale_price) : null,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        thumbnail_url: form.thumbnail_url || null,
        is_featured: form.is_featured,
        is_active: form.is_active,
      };
      if (modal === 'edit' && editing) {
        await adminService.updateProduct(editing.id, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        const created = await adminService.createProduct(payload);
        toast.success('Tạo sản phẩm thành công');
        const createdId = (created.data.data as any)?.id;
        if (createdId) {
          // Switch to edit modal to allow adding images & variants
          setEditing(created.data.data as Product);
          setModal('edit');
          setActiveTab('images');
          await loadProductDetail(createdId);
          fetchAll();
          setSaving(false);
          return;
        }
      }
      setModal(null);
      fetchAll();
    } catch { /* handled */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Ẩn sản phẩm "${p.name}"?`)) return;
    try {
      await adminService.deleteProduct(p.id);
      toast.success('Đã ẩn sản phẩm');
      fetchAll();
    } catch { /* handled */ }
  };

  // Image actions
  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !newImageUrl.trim()) {
      toast.error('Vui lòng nhập URL hình ảnh');
      return;
    }
    setAddingImage(true);
    try {
      await adminService.addImage(editing.id, {
        image_url: newImageUrl.trim(),
        alt_text: newImageAlt.trim() || undefined,
        is_primary: newImageIsPrimary,
      });
      toast.success('Đã thêm ảnh vào bộ sưu tập');
      setNewImageUrl('');
      setNewImageAlt('');
      setNewImageIsPrimary(false);
      await loadProductDetail(editing.id);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thêm ảnh');
    } finally {
      setAddingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!editing) return;
    try {
      await adminService.deleteImage(editing.id, imageId);
      toast.success('Đã xóa hình ảnh');
      await loadProductDetail(editing.id);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi khi xóa ảnh');
    }
  };

  const handleSetPrimaryImage = async (imageId: number) => {
    if (!editing) return;
    try {
      await adminService.setPrimaryImage(editing.id, imageId);
      toast.success('Đã đặt làm ảnh chính');
      await loadProductDetail(editing.id);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Variant actions
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !newVariantName.trim() || !newVariantSku.trim()) {
      toast.error('Vui lòng nhập Tên biến thể và SKU');
      return;
    }
    setAddingVariant(true);
    try {
      await adminService.addVariant(editing.id, {
        variant_name: newVariantName.trim(),
        sku: newVariantSku.trim(),
        price: newVariantPrice ? parseVndInput(newVariantPrice) : null,
        stock_quantity: parseInt(newVariantStock) || 0,
        image_url: newVariantImage.trim() || undefined,
      });
      toast.success('Đã thêm biến thể mới');
      setNewVariantName('');
      setNewVariantSku(`${editing.sku}-${productVariants.length + 2}`);
      setNewVariantImage('');
      await loadProductDetail(editing.id);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thêm biến thể');
    } finally {
      setAddingVariant(false);
    }
  };

  const handleDeleteVariant = async (variantId: number, variantName: string) => {
    if (!editing) return;
    if (!confirm(`Xóa biến thể "${variantName}"?`)) return;
    try {
      await adminService.deleteVariant(editing.id, variantId);
      toast.success('Đã xóa biến thể');
      await loadProductDetail(editing.id);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi khi xóa biến thể');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý Sản phẩm</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Quản lý danh mục, giá bán, tồn kho, bộ sưu tập ảnh và các phân loại biến thể
          </p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      <div className="admin-filters">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-box__icon" />
          <input
            type="text"
            placeholder="Tìm theo tên, SKU, thương hiệu..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="admin-search-box__input"
          />
        </div>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="admin-select">
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="admin-card">
        {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>SKU</th>
                  <th>Danh mục</th>
                  <th>Giá gốc</th>
                  <th>Giá KM</th>
                  <th>Tồn kho</th>
                  <th>Phân loại & Ảnh</th>
                  <th>Nổi bật</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={p.thumbnail_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                          alt=""
                          style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #334155' }}
                        />
                        <div>
                          <p style={{ fontWeight: 600, color: '#f8fafc', fontSize: 14 }}>{p.name}</p>
                          <p style={{ fontSize: 12, color: '#64748b' }}>{p.brand || 'No brand'}</p>
                        </div>
                      </div>
                    </td>
                    <td><code style={{ fontSize: 12, color: '#38bdf8', background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>{p.sku}</code></td>
                    <td>{p.category_name}</td>
                    <td>{formatCurrency(p.base_price)}</td>
                    <td>{p.sale_price ? <span style={{ color: '#f87171', fontWeight: 600 }}>{formatCurrency(p.sale_price)}</span> : '—'}</td>
                    <td>
                      <span className={`admin-stock-badge ${p.stock_quantity === 0 ? 'admin-stock-badge--zero' : p.stock_quantity <= 5 ? 'admin-stock-badge--critical' : p.stock_quantity <= 10 ? 'admin-stock-badge--low' : 'admin-stock-badge--ok'}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => openEdit(p, 'images')}
                          className="admin-btn admin-btn--secondary"
                          style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Quản lý bộ sưu tập ảnh"
                        >
                          <ImageIcon size={12} /> Gallery
                        </button>
                        <button
                          onClick={() => openEdit(p, 'variants')}
                          className="admin-btn admin-btn--secondary"
                          style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Quản lý biến thể phân loại"
                        >
                          <Layers size={12} /> Biến thể
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status ${p.is_featured ? 'admin-status--delivered' : 'admin-status--cancelled'}`}>
                        {p.is_featured ? 'Có' : 'Không'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-action-btn admin-action-btn--info" onClick={() => openEdit(p, 'info')} title="Chỉnh sửa sản phẩm">
                          <Pencil size={15} />
                        </button>
                        <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(p)} title="Ẩn sản phẩm">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="admin-pagination__btn">Trước</button>
            <span className="admin-pagination__info">Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="admin-pagination__btn">Sau</button>
          </div>
        )}
      </div>

      {/* Main Tabbed Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal admin-modal--wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 840, width: '95%' }}>
            <div className="admin-modal__header">
              <div>
                <h3 style={{ margin: 0 }}>
                  {modal === 'create' ? 'Thêm sản phẩm mới' : `Chỉnh sửa: ${editing?.name}`}
                </h3>
                {editing && (
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0 0' }}>
                    SKU: <code>{editing.sku}</code> • ID: #{editing.id}
                  </p>
                )}
              </div>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>

            {/* Modal Tabs Bar */}
            {modal === 'edit' && (
              <div style={{ display: 'flex', borderBottom: '1px solid #334155', background: '#0f172a', padding: '0 16px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: activeTab === 'info' ? '#38bdf8' : '#94a3b8',
                    borderBottom: activeTab === 'info' ? '2px solid #38bdf8' : '2px solid transparent',
                    background: 'none',
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Pencil size={14} /> Thông tin chung
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('images')}
                  style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: activeTab === 'images' ? '#38bdf8' : '#94a3b8',
                    borderBottom: activeTab === 'images' ? '2px solid #38bdf8' : '2px solid transparent',
                    background: 'none',
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <ImageIcon size={14} /> Thư viện ảnh ({productImages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('variants')}
                  style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: activeTab === 'variants' ? '#38bdf8' : '#94a3b8',
                    borderBottom: activeTab === 'variants' ? '2px solid #38bdf8' : '2px solid transparent',
                    background: 'none',
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Layers size={14} /> Phân loại / Biến thể ({productVariants.length})
                </button>
              </div>
            )}

            <div className="admin-modal__body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
              {/* TAB 1: THÔNG TIN CHUNG */}
              {activeTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="admin-form-row">
                    <div className="admin-form-group admin-form-group--grow">
                      <label>Tên sản phẩm *</label>
                      <input
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="admin-input"
                        placeholder="VD: iPhone 16 Pro Max 256GB"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>SKU Gốc *</label>
                      <input
                        value={form.sku}
                        onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                        className="admin-input"
                        placeholder="IP16PM"
                        disabled={modal === 'edit'}
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group admin-form-group--grow">
                      <label>Danh mục *</label>
                      <select
                        value={form.category_id}
                        onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                        className="admin-select admin-select--full"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="admin-form-group admin-form-group--grow">
                      <label>Thương hiệu</label>
                      <input
                        value={form.brand}
                        onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                        className="admin-input"
                        placeholder="Apple, Samsung, Sony..."
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group admin-form-group--grow">
                      <label>Giá gốc (VNĐ) *</label>
                      <input
                        type="text"
                        value={form.base_price}
                        onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))}
                        className="admin-input"
                        placeholder="VD: 34.990.000"
                      />
                      {form.base_price ? (
                        <span style={{ fontSize: 12, color: '#38bdf8', marginTop: 4, display: 'block' }}>
                          = {formatCurrency(parseVndInput(form.base_price))}
                        </span>
                      ) : null}
                    </div>
                    <div className="admin-form-group admin-form-group--grow">
                      <label>Giá khuyến mãi (VNĐ)</label>
                      <input
                        type="text"
                        value={form.sale_price}
                        onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))}
                        className="admin-input"
                        placeholder="VD: 31.990.000"
                      />
                      {form.sale_price ? (
                        <span style={{ fontSize: 12, color: '#38bdf8', marginTop: 4, display: 'block' }}>
                          = {formatCurrency(parseVndInput(form.sale_price))}
                        </span>
                      ) : null}
                    </div>
                    <div className="admin-form-group">
                      <label>Tồn kho cha</label>
                      <input
                        type="number"
                        value={form.stock_quantity}
                        onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                        className="admin-input"
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>URL Ảnh đại diện chính</label>
                    <input
                      value={form.thumbnail_url}
                      onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                      className="admin-input"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Mô tả ngắn</label>
                    <textarea
                      value={form.short_description}
                      onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                      className="admin-input"
                      rows={2}
                      placeholder="Tóm tắt đặc điểm nổi bật..."
                    />
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group admin-form-group--grow">
                      <label>Sản phẩm nổi bật</label>
                      <select
                        value={form.is_featured}
                        onChange={e => setForm(f => ({ ...f, is_featured: parseInt(e.target.value) }))}
                        className="admin-select admin-select--full"
                      >
                        <option value={0}>Không</option>
                        <option value={1}>Có (Hiển thị Trang chủ)</option>
                      </select>
                    </div>
                    {modal === 'edit' && (
                      <div className="admin-form-group admin-form-group--grow">
                        <label>Trạng thái</label>
                        <select
                          value={form.is_active}
                          onChange={e => setForm(f => ({ ...f, is_active: parseInt(e.target.value) }))}
                          className="admin-select admin-select--full"
                        >
                          <option value={1}>Hiển thị bán</option>
                          <option value={0}>Tạm ẩn khỏi gian hàng</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: THƯ VIỆN ẢNH (GALLERY IMAGES) */}
              {activeTab === 'images' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Form thêm ảnh */}
                  <form onSubmit={handleAddImage} style={{ background: '#0f172a', padding: 14, borderRadius: 8, border: '1px solid #334155' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={14} /> Thêm ảnh mới vào bộ sưu tập
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, alignItems: 'center' }}>
                      <input
                        type="url"
                        placeholder="Nhập đường dẫn URL ảnh (https://...)"
                        value={newImageUrl}
                        onChange={e => setNewImageUrl(e.target.value)}
                        className="admin-input"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Chú thích ảnh (Alt text)"
                        value={newImageAlt}
                        onChange={e => setNewImageAlt(e.target.value)}
                        className="admin-input"
                      />
                      <button
                        type="submit"
                        disabled={addingImage}
                        className="admin-btn admin-btn--primary"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {addingImage ? 'Đang thêm...' : 'Thêm ảnh'}
                      </button>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', marginTop: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newImageIsPrimary}
                        onChange={e => setNewImageIsPrimary(e.target.checked)}
                      />
                      Đặt làm ảnh đại diện chính của sản phẩm
                    </label>
                  </form>

                  {/* Danh sách ảnh lưới */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#f8fafc' }}>
                      Danh sách ảnh hiện có ({productImages.length})
                    </h4>
                    {loadingDetail ? (
                      <div className="admin-loading"><div className="admin-spinner" /></div>
                    ) : productImages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: 13, border: '1px dashed #334155', borderRadius: 8 }}>
                        Chưa có ảnh phụ nào trong bộ sưu tập. Hãy thêm ảnh phía trên.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                        {productImages.map(img => (
                          <div
                            key={img.id}
                            style={{
                              background: '#0f172a',
                              border: img.is_primary ? '2px solid #10b981' : '1px solid #334155',
                              borderRadius: 8,
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            <div style={{ position: 'relative', width: '100%', height: 110 }}>
                              <img
                                src={img.image_url}
                                alt={img.alt_text || ''}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              {Boolean(img.is_primary) && (
                                <span style={{
                                  position: 'absolute', top: 4, left: 4,
                                  background: '#10b981', color: '#fff', fontSize: 10,
                                  fontWeight: 700, padding: '2px 5px', borderRadius: 4
                                }}>
                                  Ảnh chính
                                </span>
                              )}
                            </div>
                            <div style={{ padding: 6, display: 'flex', justifyContent: 'space-between', gap: 4, background: '#1e293b' }}>
                              {!img.is_primary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(img.id)}
                                  className="admin-action-btn admin-action-btn--info"
                                  style={{ padding: '2px 6px', fontSize: 11, flex: 1 }}
                                  title="Đặt làm ảnh chính"
                                >
                                  <Star size={12} /> Chính
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(img.id)}
                                className="admin-action-btn admin-action-btn--danger"
                                style={{ padding: '2px 6px' }}
                                title="Xóa ảnh"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PHÂN LOẠI / BIẾN THỂ (VARIANTS) */}
              {activeTab === 'variants' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Form thêm biến thể */}
                  <form onSubmit={handleAddVariant} style={{ background: '#0f172a', padding: 14, borderRadius: 8, border: '1px solid #334155' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={14} /> Thêm phân loại / biến thể mới
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Tên phân loại *</label>
                        <input
                          type="text"
                          placeholder="VD: Titan Sa Mạc - 256GB"
                          value={newVariantName}
                          onChange={e => setNewVariantName(e.target.value)}
                          className="admin-input"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Mã SKU *</label>
                        <input
                          type="text"
                          placeholder="IP16PM-256-DESERT"
                          value={newVariantSku}
                          onChange={e => setNewVariantSku(e.target.value)}
                          className="admin-input"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Giá riêng (VNĐ)</label>
                        <input
                          type="text"
                          placeholder="Giá riêng"
                          value={newVariantPrice}
                          onChange={e => setNewVariantPrice(e.target.value)}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Tồn kho</label>
                        <input
                          type="number"
                          placeholder="10"
                          value={newVariantStock}
                          onChange={e => setNewVariantStock(e.target.value)}
                          className="admin-input"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={addingVariant}
                        className="admin-btn admin-btn--primary"
                        style={{ height: 38 }}
                      >
                        {addingVariant ? 'Đang thêm...' : 'Thêm'}
                      </button>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <input
                        type="url"
                        placeholder="URL ảnh riêng của biến thể này (tùy chọn)"
                        value={newVariantImage}
                        onChange={e => setNewVariantImage(e.target.value)}
                        className="admin-input"
                      />
                    </div>
                  </form>

                  {/* Bảng danh sách biến thể */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#f8fafc' }}>
                      Các biến thể của sản phẩm ({productVariants.length})
                    </h4>
                    {loadingDetail ? (
                      <div className="admin-loading"><div className="admin-spinner" /></div>
                    ) : productVariants.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: 13, border: '1px dashed #334155', borderRadius: 8 }}>
                        Sản phẩm chưa có biến thể nào. Dùng form phía trên để thêm các phiên bản (Màu sắc, Dung lượng, Kích cỡ...).
                      </div>
                    ) : (
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Tên biến thể</th>
                              <th>SKU</th>
                              <th>Giá bán riêng</th>
                              <th>Tồn kho</th>
                              <th>Trạng thái</th>
                              <th>Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productVariants.map(v => (
                              <tr key={v.id}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {v.image_url ? (
                                      <img src={v.image_url} alt="" style={{ width: 30, height: 30, borderRadius: 4, objectFit: 'cover' }} />
                                    ) : (
                                      <div style={{ width: 30, height: 30, borderRadius: 4, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Layers size={14} color="#94a3b8" />
                                      </div>
                                    )}
                                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{v.variant_name}</span>
                                  </div>
                                </td>
                                <td><code style={{ fontSize: 12, color: '#38bdf8' }}>{v.sku}</code></td>
                                <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                                  {v.price ? formatCurrency(v.price) : 'Mặc định'}
                                </td>
                                <td>
                                  <span className={`admin-stock-badge ${v.stock_quantity === 0 ? 'admin-stock-badge--zero' : v.stock_quantity <= 5 ? 'admin-stock-badge--critical' : 'admin-stock-badge--ok'}`}>
                                    {v.stock_quantity}
                                  </span>
                                </td>
                                <td>
                                  <span className="admin-status admin-status--delivered">Đang bán</span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVariant(v.id, v.variant_name)}
                                    className="admin-action-btn admin-action-btn--danger"
                                    title="Xóa biến thể"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--ghost" onClick={() => setModal(null)}>
                Đóng
              </button>
              {activeTab === 'info' && (
                <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : <><Check size={15} /> Lưu thông tin</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
