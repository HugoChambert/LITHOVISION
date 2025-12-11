import { useState, useEffect } from 'react';
import { supabase, type StoneMaterial } from '../lib/supabase';
import { showToast } from './ToastContainer';
import './AdminPanel.css';

function AdminPanel() {
  const [stones, setStones] = useState<StoneMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStone, setEditingStone] = useState<StoneMaterial | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'granite',
    description: '',
    color_family: 'white',
    pattern: 'veined',
    finish: 'polished',
    preview_image_url: '',
    texture_scale: 1.0,
    is_active: true,
    metadata: {},
  });

  useEffect(() => {
    fetchStones();
  }, []);

  useEffect(() => {
    const active = stones.filter((s) => s.is_active).length;
    setStats({
      total: stones.length,
      active,
      inactive: stones.length - active,
    });
  }, [stones]);

  const fetchStones = async () => {
    try {
      const { data, error } = await supabase
        .from('material_presets')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setStones(data || []);
    } catch (error) {
      console.error('Error fetching stones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size must be less than 10MB', 'error');
      return;
    }

    try {
      setUploadingImage(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `stone-materials/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      setFormData({ ...formData, preview_image_url: publicUrl });
      setImagePreview(publicUrl);
      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, preview_image_url: '' });
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.preview_image_url) {
      showToast('Please upload a stone slab image', 'warning');
      return;
    }

    try {
      if (editingStone) {
        const { error } = await supabase
          .from('material_presets')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingStone.id);

        if (error) throw error;
        showToast('Stone material updated successfully', 'success');
      } else {
        const { error } = await supabase
          .from('material_presets')
          .insert([formData]);

        if (error) throw error;
        showToast('Stone material created successfully', 'success');
      }

      resetForm();
      fetchStones();
    } catch (error) {
      console.error('Error saving stone:', error);
      showToast('Failed to save stone material', 'error');
    }
  };

  const handleEdit = (stone: StoneMaterial) => {
    setEditingStone(stone);
    setFormData({
      name: stone.name,
      type: stone.type,
      description: stone.description,
      color_family: stone.color_family,
      pattern: stone.pattern,
      finish: stone.finish,
      preview_image_url: stone.preview_image_url || '',
      texture_scale: stone.texture_scale,
      is_active: stone.is_active,
      metadata: stone.metadata || {},
    });
    setImagePreview(stone.preview_image_url || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stone material?')) return;

    try {
      const { error } = await supabase
        .from('material_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Stone material deleted successfully', 'success');
      fetchStones();
    } catch (error) {
      console.error('Error deleting stone:', error);
      showToast('Failed to delete stone material', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'granite',
      description: '',
      color_family: 'white',
      pattern: 'veined',
      finish: 'polished',
      preview_image_url: '',
      texture_scale: 1.0,
      is_active: true,
      metadata: {},
    });
    setEditingStone(null);
    setShowForm(false);
    setImagePreview(null);
  };

  const filteredStones = stones.filter((stone) => {
    const matchesSearch = stone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stone.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || stone.type === filterType;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && stone.is_active) ||
      (filterStatus === 'inactive' && !stone.is_active);
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return <div className="admin-panel">Loading...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <h2>Stone Materials Admin</h2>
          <div className="admin-stats">
            <span className="stat">Total: {stats.total}</span>
            <span className="stat active">Active: {stats.active}</span>
            <span className="stat inactive">Inactive: {stats.inactive}</span>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Stone'}
        </button>
      </div>

      {showForm && (
        <form className="stone-form" onSubmit={handleSubmit}>
          <h3>{editingStone ? 'Edit Stone Material' : 'Add New Stone Material'}</h3>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              required
            >
              <option value="granite">Granite</option>
              <option value="marble">Marble</option>
              <option value="quartz">Quartz</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Color Family</label>
            <select
              value={formData.color_family}
              onChange={(e) => setFormData({ ...formData, color_family: e.target.value })}
              required
            >
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="gray">Gray</option>
              <option value="beige">Beige</option>
              <option value="brown">Brown</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="red">Red</option>
            </select>
          </div>

          <div className="form-group">
            <label>Pattern</label>
            <select
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              required
            >
              <option value="veined">Veined</option>
              <option value="speckled">Speckled</option>
              <option value="solid">Solid</option>
              <option value="crystalline">Crystalline</option>
              <option value="textured">Textured</option>
            </select>
          </div>

          <div className="form-group">
            <label>Finish</label>
            <select
              value={formData.finish}
              onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
              required
            >
              <option value="polished">Polished</option>
              <option value="honed">Honed</option>
              <option value="leathered">Leathered</option>
            </select>
          </div>

          <div className="form-group">
            <label>Stone Slab Image *</label>
            <p className="field-description">
              Upload a high-quality photo of the stone slab. This image will be used by the AI to apply the texture to user photos.
            </p>

            {imagePreview ? (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Stone preview" className="uploaded-image-preview" />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={handleRemoveImage}
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div className="image-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  id="stone-image-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="stone-image-upload" className="upload-label">
                  {uploadingImage ? (
                    <>
                      <div className="upload-spinner"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>Click to upload stone slab image</span>
                      <small>PNG, JPG, WEBP up to 10MB</small>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Texture Scale</label>
            <input
              type="number"
              step="0.1"
              value={formData.texture_scale}
              onChange={(e) => setFormData({ ...formData, texture_scale: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              Active
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingStone ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="stones-list">
        <div className="list-header">
          <h3>Existing Stone Materials</h3>

          <div className="search-filter-controls">
            <input
              type="text"
              placeholder="Search stones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="granite">Granite</option>
              <option value="marble">Marble</option>
              <option value="quartz">Quartz</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="stones-count">
          Showing {filteredStones.length} of {stones.length} materials
        </div>

        <div className="stones-table">
          {filteredStones.map((stone) => (
            <div key={stone.id} className="stone-row">
              {stone.preview_image_url && (
                <img
                  src={stone.preview_image_url}
                  alt={stone.name}
                  className="stone-thumb"
                />
              )}
              <div className="stone-details">
                <h4>{stone.name}</h4>
                <p className="stone-meta">
                  {stone.type} • {stone.pattern} • {stone.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="stone-actions">
                <button
                  className="btn-icon"
                  onClick={() => handleEdit(stone)}
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  className="btn-icon delete"
                  onClick={() => handleDelete(stone.id)}
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
