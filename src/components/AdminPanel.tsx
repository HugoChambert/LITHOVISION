import { useState, useEffect } from 'react';
import { supabase, type StoneMaterial } from '../lib/supabase';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      } else {
        const { error } = await supabase
          .from('material_presets')
          .insert([formData]);

        if (error) throw error;
      }

      resetForm();
      fetchStones();
    } catch (error) {
      console.error('Error saving stone:', error);
      alert('Failed to save stone material');
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

      fetchStones();
    } catch (error) {
      console.error('Error deleting stone:', error);
      alert('Failed to delete stone material');
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
            <label>Preview Image URL (optional)</label>
            <input
              type="url"
              value={formData.preview_image_url}
              onChange={(e) => setFormData({ ...formData, preview_image_url: e.target.value })}
            />
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
