import { useState, useEffect } from 'react';
import { supabase, type StoneMaterial } from '../lib/supabase';
import './StoneCatalog.css';

interface StoneCatalogProps {
  onStoneSelected: (stone: StoneMaterial) => void;
  onBack: () => void;
}

function StoneCatalog({ onStoneSelected, onBack }: StoneCatalogProps) {
  const [stones, setStones] = useState<StoneMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'granite' | 'marble' | 'quartz'>('all');
  const [selectedStone, setSelectedStone] = useState<StoneMaterial | null>(null);

  useEffect(() => {
    fetchStones();
  }, []);

  const fetchStones = async () => {
    try {
      const { data, error } = await supabase
        .from('stone_materials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setStones(data || []);
    } catch (error) {
      console.error('Error fetching stones:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStones = selectedType === 'all'
    ? stones
    : stones.filter(stone => stone.type === selectedType);

  const handleStoneClick = (stone: StoneMaterial) => {
    setSelectedStone(stone);
  };

  const handleContinue = () => {
    if (selectedStone) {
      onStoneSelected(selectedStone);
    }
  };

  if (loading) {
    return (
      <div className="stone-catalog">
        <div className="loading-state">Loading stone materials...</div>
      </div>
    );
  }

  return (
    <div className="stone-catalog">
      <h2 className="section-title">Choose Your Stone Material</h2>
      <p className="section-description">
        Select from our curated collection of premium stone materials.
      </p>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${selectedType === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedType('all')}
        >
          All Stones
        </button>
        <button
          className={`filter-tab ${selectedType === 'granite' ? 'active' : ''}`}
          onClick={() => setSelectedType('granite')}
        >
          Granite
        </button>
        <button
          className={`filter-tab ${selectedType === 'marble' ? 'active' : ''}`}
          onClick={() => setSelectedType('marble')}
        >
          Marble
        </button>
        <button
          className={`filter-tab ${selectedType === 'quartz' ? 'active' : ''}`}
          onClick={() => setSelectedType('quartz')}
        >
          Quartz
        </button>
      </div>

      <div className="stones-grid">
        {filteredStones.map((stone) => (
          <div
            key={stone.id}
            className={`stone-card ${selectedStone?.id === stone.id ? 'selected' : ''}`}
            onClick={() => handleStoneClick(stone)}
          >
            <div className="stone-image-wrapper">
              <img
                src={stone.thumbnail_url || stone.image_url}
                alt={stone.name}
                className="stone-image"
              />
              {selectedStone?.id === stone.id && (
                <div className="selected-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="stone-info">
              <h3 className="stone-name">{stone.name}</h3>
              <span className="stone-type">{stone.type}</span>
              <p className="stone-description">{stone.description}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredStones.length === 0 && (
        <div className="empty-state">
          No {selectedType === 'all' ? '' : selectedType} stones available.
        </div>
      )}

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleContinue}
          disabled={!selectedStone}
        >
          Generate Preview
        </button>
      </div>
    </div>
  );
}

export default StoneCatalog;
