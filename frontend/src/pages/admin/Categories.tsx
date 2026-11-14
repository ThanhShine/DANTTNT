import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { adminService } from '../../services';
import { Category } from '../../types';
import toast from 'react-hot-toast';

interface CategoryForm {
  name: string;
  description: string;
  parent_id: string;
  image_url: string;
  sort_order: number;
  is_active: number;
}

const defaultForm: CategoryForm = { name: '', description: '', parent_id: '', image_url: '', sort_order: 0, is_active: 1 };

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getCategories();
      setCategories(res.data.data as Category[] || []);
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setModal('create');
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
      image_url: cat.image_url || '',
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Tên danh mục không được để trống'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        image_url: form.image_url || undefined,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (modal === 'edit' && editing) {
        await adminService.updateCategory(editing.id, payload);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await adminService.createCategory(payload);
        toast.success('Tạo danh mục thành công');
      }
      setModal(null);
      fetchCategories();
    } catch { /* handled */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Ẩn danh mục "${cat.name}"?`)) return;
    try {
      await adminService.deleteCategory(cat.id);
      toast.success('Đã ẩn danh mục');
      fetchCategories();
    } catch { /* handled */ }
  };

  const roots = categories.filter(c => !c.parent_id);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý Danh mục</h1>
          <p className="admin-page__subtitle">{categories.length} danh mục</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      <div className="admin-card">
        {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên</th>
                  <th>Slug</th>
                  <th>Danh mục cha</th>
                  <th>Thứ tự</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td>{cat.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {cat.image_url && <img src={cat.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td><code style={{ color: '#94a3b8', fontSize: 12 }}>{cat.slug}</code></td>
                    <td>{categories.find(c => c.id === cat.parent_id)?.name || '—'}</td>
                    <td>{cat.sort_order}</td>
                    <td>
                      <span className={`admin-status ${cat.is_active ? 'admin-status--delivered' : 'admin-status--cancelled'}`}>
                        {cat.is_active ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-action-btn admin-action-btn--info" onClick={() => openEdit(cat)}>
                          <Pencil size={15} />
                        </button>
                        <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(cat)}>
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
      </div>

      {/* Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{modal === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}</h3>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-group">
                <label>Tên danh mục *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="admin-input" placeholder="VD: Điện thoại" />
              </div>
              <div className="admin-form-group">
                <label>Mô tả</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="admin-input" rows={3} placeholder="Mô tả danh mục..." />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Danh mục cha</label>
                  <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))} className="admin-select admin-select--full">
                    <option value="">Không có</option>
                    {roots.filter(c => c.id !== editing?.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Thứ tự</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="admin-input" />
                </div>
              </div>
              <div className="admin-form-group">
                <label>URL hình ảnh</label>
                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="admin-input" placeholder="https://..." />
              </div>
              {modal === 'edit' && (
                <div className="admin-form-group">
                  <label>Trạng thái</label>
                  <select value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: parseInt(e.target.value) }))} className="admin-select admin-select--full">
                    <option value={1}>Hiển thị</option>
                    <option value={0}>Ẩn</option>
                  </select>
                </div>
              )}
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--ghost" onClick={() => setModal(null)}>Huỷ</button>
              <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : <><Check size={15} /> Lưu</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
