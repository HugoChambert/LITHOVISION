import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { type StoneMaterial } from '../lib/supabase';
import { createProject, updateProject } from '../lib/projectManager';
import { showToast } from './ToastContainer';
import BeforeAfterSlider from './BeforeAfterSlider';
import ShareModal from './ShareModal';
import './PreviewPanel.css';

interface PreviewPanelProps {
  originalImage: string | null;
  previewImage: string | null;
  selectedStone: StoneMaterial | null;
  isProcessing: boolean;
  onReset: () => void;
  imageId?: string | null;
  maskId?: string | null;
}

function PreviewPanel({
  originalImage,
  previewImage,
  selectedStone,
  isProcessing,
  onReset,
  maskId,
}: PreviewPanelProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'preview'>('slider');
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleDownload = () => {
    if (!previewImage) return;

    const link = document.createElement('a');
    link.href = previewImage;
    link.download = `stone-preview-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started', 'success');
  };

  const handleSaveProject = async () => {
    if (!user) {
      showToast('Please sign in to save your project', 'info');
      return;
    }

    if (!originalImage || !previewImage) return;

    try {
      setIsSaving(true);

      if (currentProjectId) {
        await updateProject(currentProjectId, {
          result_image_url: previewImage,
          mask_image_url: maskId || undefined,
          stone_material_id: selectedStone?.id,
          processing_status: 'completed',
        });
        showToast('Project updated successfully', 'success');
      } else {
        const project = await createProject(user.id, {
          name: `Stone Design ${new Date().toLocaleDateString()}`,
          original_image_url: originalImage,
          mask_image_url: maskId || undefined,
          stone_material_id: selectedStone?.id,
          result_image_url: previewImage,
          processing_status: 'completed',
        });
        setCurrentProjectId(project.id);
        showToast('Project saved successfully', 'success');
      }
    } catch (error) {
      showToast('Failed to save project', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (!user) {
      showToast('Please sign in to share your project', 'info');
      return;
    }

    if (!currentProjectId) {
      showToast('Please save your project first', 'info');
      return;
    }

    setShowShareModal(true);
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
              className={`toggle-btn ${viewMode === 'slider' ? 'active' : ''}`}
              onClick={() => setViewMode('slider')}
            >
              Interactive Slider
            </button>
            <button
              className={`toggle-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setViewMode('side-by-side')}
            >
              Side by Side
            </button>
            <button
              className={`toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
            >
              Preview Only
            </button>
          </div>

          {viewMode === 'slider' && originalImage ? (
            <BeforeAfterSlider
              beforeImage={originalImage}
              afterImage={previewImage}
              beforeLabel="Original"
              afterLabel={`With ${selectedStone?.name || 'Stone'}`}
            />
          ) : viewMode === 'side-by-side' ? (
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
            {user && (
              <button
                className="btn btn-secondary"
                onClick={handleSaveProject}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : currentProjectId ? 'Update Project' : 'Save Project'}
              </button>
            )}
            {user && currentProjectId && (
              <button className="btn btn-secondary" onClick={handleShare}>
                Share
              </button>
            )}
            <button className="btn btn-primary" onClick={handleDownload}>
              Download
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

      {showShareModal && currentProjectId && selectedStone && (
        <ShareModal
          projectId={currentProjectId}
          projectName={`Design with ${selectedStone.name}`}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

export default PreviewPanel;
