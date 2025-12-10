import { useState } from 'react';
import { type StoneMaterial } from '../lib/supabase';
import './PreviewPanel.css';

interface PreviewPanelProps {
  originalImage: string | null;
  previewImage: string | null;
  selectedStone: StoneMaterial | null;
  isProcessing: boolean;
  onReset: () => void;
}

function PreviewPanel({
  originalImage,
  previewImage,
  selectedStone,
  isProcessing,
  onReset,
}: PreviewPanelProps) {
  const [showComparison, setShowComparison] = useState(true);

  const handleDownload = () => {
    if (!previewImage) return;

    const link = document.createElement('a');
    link.href = previewImage;
    link.download = `stone-preview-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="preview-panel">
      <h2 className="section-title">Preview Your Design</h2>
      {selectedStone && (
        <p className="section-description">
          Showing preview with <strong>{selectedStone.name}</strong>
        </p>
      )}

      {isProcessing ? (
        <div className="processing-state">
          <div className="processing-spinner" />
          <h3 className="processing-title">Generating Your Preview</h3>
          <p className="processing-description">
            Our AI is working its magic to transform your space...
          </p>
          <div className="processing-steps">
            <div className="processing-step">
              <div className="step-icon">✓</div>
              <span>Analyzing image</span>
            </div>
            <div className="processing-step active">
              <div className="step-icon">
                <div className="mini-spinner" />
              </div>
              <span>Segmenting area</span>
            </div>
            <div className="processing-step">
              <div className="step-icon">◦</div>
              <span>Estimating depth</span>
            </div>
            <div className="processing-step">
              <div className="step-icon">◦</div>
              <span>Applying stone texture</span>
            </div>
            <div className="processing-step">
              <div className="step-icon">◦</div>
              <span>Color matching</span>
            </div>
          </div>
        </div>
      ) : previewImage ? (
        <div className="preview-content">
          <div className="comparison-toggle">
            <button
              className={`toggle-btn ${showComparison ? 'active' : ''}`}
              onClick={() => setShowComparison(true)}
            >
              Compare
            </button>
            <button
              className={`toggle-btn ${!showComparison ? 'active' : ''}`}
              onClick={() => setShowComparison(false)}
            >
              Preview Only
            </button>
          </div>

          {showComparison ? (
            <div className="comparison-view">
              <div className="comparison-item">
                <h3 className="comparison-label">Original</h3>
                <img src={originalImage!} alt="Original" className="comparison-image" />
              </div>
              <div className="comparison-item">
                <h3 className="comparison-label">With {selectedStone?.name}</h3>
                <img src={previewImage} alt="Preview" className="comparison-image" />
              </div>
            </div>
          ) : (
            <div className="single-view">
              <img src={previewImage} alt="Preview" className="preview-image-full" />
            </div>
          )}

          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={onReset}>
              Start New Project
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              Download Preview
            </button>
          </div>
        </div>
      ) : (
        <div className="error-state">
          <p>Failed to generate preview. Please try again.</p>
          <button className="btn btn-primary" onClick={onReset}>
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}

export default PreviewPanel;
