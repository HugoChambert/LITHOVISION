import { useState, useEffect } from 'react';
import { supabase, type StoneMaterial } from '../lib/supabase';
import './AdminPanel.css';

function AdminPanel() {
  const [stones, setStones] = useState<StoneMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStone, setEditingStone] = useState<StoneMaterial | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'granite' as 'granite' | 'marble' | 'quartz',
    description: '',
    image_url: '',
    thumbnail_url: '',
    texture_scale: 1.0,
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchStones();
  }, []);

  const fetchStones = async () => {
    try {
      const { data, error } = await supabase
        .from('stone_materials')
        .select('*')
        .order('sort_order', { ascending: true });

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
          .from('stone_materials')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingStone.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('stone_materials')
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
      image_url: stone.image_url,
      thumbnail_url: stone.thumbnail_url || '',
      texture_scale: stone.texture_scale,
      is_active: stone.is_active,
      sort_order: stone.sort_order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stone material?')) return;

    try {
      const { error } = await supabase
        .from('stone_materials')
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
      image_url: '',
      thumbnail_url: '',
      texture_scale: 1.0,
      is_active: true,
      sort_order: 0,
    });
    setEditingStone(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="admin-panel">Loading...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Stone Materials Admin</h2>
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
            <label>Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Thumbnail URL (optional)</label>
            <input
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
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

          <div className="form-group">
            <label>Sort Order</label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
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
        <h3>Existing Stone Materials</h3>
        <div className="stones-table">
          {stones.map((stone) => (
            <div key={stone.id} className="stone-row">
              <img
                src={stone.thumbnail_url || stone.image_url}
                alt={stone.name}
                className="stone-thumb"
              />
              <div className="stone-details">
                <h4>{stone.name}</h4>
                <p className="stone-meta">
                  {stone.type} • Order: {stone.sort_order} • {stone.is_active ? 'Active' : 'Inactive'}
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
