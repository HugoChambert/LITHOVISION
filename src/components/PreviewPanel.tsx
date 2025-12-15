import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { type StoneMaterial } from '../lib/supabase';
import { createProject } from '../lib/projectManager';
import { showToast } from './ToastContainer';
import ImageZoom from './ImageZoom';
import './PreviewPanel.css';

interface PreviewPanelProps {
  originalImage: string | null;
  previewImages: Array<{ stone: StoneMaterial; imageUrl: string }>;
  selectedStones: StoneMaterial[];
  isProcessing: boolean;
  processingProgress: Array<{ stone: StoneMaterial; status: 'pending' | 'processing' | 'completed' | 'failed' }>;
  onReset: () => void;
  imageId?: string | null;
  maskId?: string | null;
}

function PreviewPanel({
  originalImage,
  previewImages,
  selectedStones,
  isProcessing,
  processingProgress,
  onReset,
  maskId,
}: PreviewPanelProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ url: string; alt: string } | null>(null);

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `stone-preview-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started', 'success');
  };

  const handleSaveProject = async (imageUrl: string, stone: StoneMaterial) => {
    if (!user) {
      showToast('Please sign in to save your project', 'info');
      return;
    }

    if (!originalImage) return;

    try {
      setIsSaving(true);

      await createProject(user.id, {
        name: `${stone.name} Design ${new Date().toLocaleDateString()}`,
        original_image_url: originalImage,
        mask_image_url: maskId || undefined,
        stone_material_id: stone.id,
        result_image_url: imageUrl,
        processing_status: 'completed',
      });

      showToast('Project saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save project', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="preview-panel">
      <h2 className="section-title">Compare Stone Designs</h2>
      <p className="section-description">
        View all {selectedStones.length} stone material{selectedStones.length !== 1 ? 's' : ''} applied to your space
      </p>

      {isProcessing ? (
        <div className="processing-state">
          <div className="processing-spinner" />
          <h3 className="processing-title">Generating Your Previews</h3>
          <p className="processing-description">
            Processing {selectedStones.length} stone material{selectedStones.length !== 1 ? 's' : ''}...
          </p>
          <div className="processing-steps">
            {processingProgress.map(({ stone, status }) => (
              <div key={stone.id} className={`processing-step ${status === 'processing' ? 'active' : ''}`}>
                <div className="step-icon">
                  {status === 'completed' ? '✓' : status === 'failed' ? '✗' : status === 'processing' ? <div className="mini-spinner" /> : '◦'}
                </div>
                <span>{stone.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : previewImages.length > 0 ? (
        <div className="preview-content">
          <div className="comparison-grid">
            {originalImage && (
              <div className="comparison-card">
                <div
                  className="comparison-image-wrapper"
                  onClick={() => setZoomImage({ url: originalImage, alt: 'Original' })}
                  style={{ cursor: 'pointer' }}
                  title="Click to zoom"
                >
                  <img src={originalImage} alt="Original" className="comparison-image" />
                  <div className="zoom-hint">🔍 Click to zoom</div>
                </div>
                <h3 className="comparison-label">Original</h3>
              </div>
            )}

            {previewImages.map(({ stone, imageUrl }) => (
              <div key={stone.id} className="comparison-card">
                <div
                  className="comparison-image-wrapper"
                  onClick={() => setZoomImage({ url: imageUrl, alt: stone.name })}
                  style={{ cursor: 'pointer' }}
                  title="Click to zoom"
                >
                  <img src={imageUrl} alt={stone.name} className="comparison-image" />
                  <div className="zoom-hint">🔍 Click to zoom</div>
                </div>
                <h3 className="comparison-label">{stone.name}</h3>
                <p className="comparison-details">
                  {stone.type} • {stone.pattern}
                  {stone.price_per_sqft && <span className="stone-price"> • ${stone.price_per_sqft.toFixed(2)}/sqft</span>}
                </p>
                <div className="comparison-actions">
                  <button
                    className="btn-icon-small"
                    onClick={() => handleDownload(imageUrl)}
                    title="Download"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                  </button>
                  {user && (
                    <button
                      className="btn-icon-small"
                      onClick={() => handleSaveProject(imageUrl, stone)}
                      disabled={isSaving}
                      title="Save"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={onReset}>
              Start New Project
            </button>
          </div>
        </div>
      ) : (
        <div className="error-state">
          <p>Failed to generate previews. Please try again.</p>
          <button className="btn btn-primary" onClick={onReset}>
            Start Over
          </button>
        </div>
      )}

      {zoomImage && (
        <ImageZoom
          imageUrl={zoomImage.url}
          alt={zoomImage.alt}
          onClose={() => setZoomImage(null)}
        />
      )}
    </div>
  );
}

export default PreviewPanel;
