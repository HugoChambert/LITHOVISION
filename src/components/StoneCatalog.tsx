import { useState, useEffect } from 'react';
import { getMaterials, getMaterialTypes, type StoneMaterial } from '../lib/supabase';
import './StoneCatalog.css';

interface StoneCatalogProps {
  onStoneSelected: (stone: StoneMaterial) => void;
  onBack: () => void;
}

function getColorForFamily(colorFamily: string, darker: boolean = false): string {
  const colors: Record<string, [string, string]> = {
    white: ['#f8f9fa', '#e9ecef'],
    black: ['#343a40', '#212529'],
    gray: ['#6c757d', '#495057'],
    beige: ['#d4c5b9', '#c5b5a8'],
    brown: ['#8b4513', '#654321'],
    green: ['#2d6a4f', '#1b4332'],
    blue: ['#0077b6', '#023e8a'],
    red: ['#d62828', '#9d0208'],
  };

  const [light, dark] = colors[colorFamily.toLowerCase()] || ['#adb5bd', '#868e96'];
  return darker ? dark : light;
}

function StoneCatalog({ onStoneSelected, onBack }: StoneCatalogProps) {
  const [stones, setStones] = useState<StoneMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStone, setSelectedStone] = useState<StoneMaterial | null>(null);

  useEffect(() => {
    fetchStones();
    fetchTypes();
  }, []);

  const fetchStones = async () => {
    try {
      const data = await getMaterials();
      setStones(data || []);
    } catch (error) {
      console.error('Error fetching stones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const data = await getMaterialTypes();
      setTypes(data || []);
    } catch (error) {
      console.error('Error fetching types:', error);
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
          All Materials
        </button>
        {types.map((type) => (
          <button
            key={type}
            className={`filter-tab ${selectedType === type ? 'active' : ''}`}
            onClick={() => setSelectedType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="stones-grid">
        {filteredStones.map((stone) => (
          <div
            key={stone.id}
            className={`stone-card ${selectedStone?.id === stone.id ? 'selected' : ''}`}
            onClick={() => handleStoneClick(stone)}
          >
            <div className="stone-image-wrapper">
              {stone.preview_image_url ? (
                <img
                  src={stone.preview_image_url}
                  alt={stone.name}
                  className="stone-image"
                />
              ) : (
                <div className="stone-placeholder" style={{
                  background: `linear-gradient(135deg, ${getColorForFamily(stone.color_family)} 0%, ${getColorForFamily(stone.color_family, true)} 100%)`
                }}>
                  <span className="placeholder-text">{stone.name}</span>
                </div>
              )}
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
              <div className="stone-meta">
                <span className="stone-type">{stone.type}</span>
                <span className="stone-pattern">{stone.pattern}</span>
              </div>
              <p className="stone-description">{stone.description.substring(0, 100)}...</p>
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
