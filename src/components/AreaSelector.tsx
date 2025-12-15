import { useRef, useEffect, useState } from 'react';
import * as api from '../lib/api';
import './AreaSelector.css';

interface AreaSelectorProps {
  imageUrl: string;
  imageId: string;
  onAreaSelected: (maskData: string, maskBlob: Blob) => void;
  onBack: () => void;
}

function AreaSelector({ imageUrl, imageId, onAreaSelected, onBack }: AreaSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMask, setCurrentMask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const scaleRef = useRef<number>(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.width);
      scaleRef.current = scale;

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = canvas.width;
        overlayCanvasRef.current.height = canvas.height;
      }

      imageRef.current = img;
      setCanvasReady(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isGenerating || !canvasReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let displayX: number;
    let displayY: number;

    if ('touches' in e) {
      e.preventDefault();
      const touch = e.touches[0] || e.changedTouches[0];
      displayX = touch.clientX - rect.left;
      displayY = touch.clientY - rect.top;
    } else {
      displayX = e.clientX - rect.left;
      displayY = e.clientY - rect.top;
    }

    const imageX = Math.round(displayX / scaleRef.current);
    const imageY = Math.round(displayY / scaleRef.current);

    setIsGenerating(true);
    setError(null);

    try {
      const img = imageRef.current;
      if (!img) return;

      const maskResponse = await api.generateMask(imageId, imageX, imageY);

      const maskImageResponse = await fetch(maskResponse.mask_url);
      const maskBlob = await maskImageResponse.blob();
      const maskBitmap = await createImageBitmap(maskBlob);

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) return;

      maskCtx.drawImage(maskBitmap, 0, 0);
      const maskImageData = maskCtx.getImageData(0, 0, img.width, img.height);
      const maskData = maskImageData.data;

      const overlayCanvas = overlayCanvasRef.current;
      if (!overlayCanvas) return;

      const overlayCtx = overlayCanvas.getContext('2d');
      if (!overlayCtx) return;

      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      overlayCtx.globalAlpha = 0.5;
      overlayCtx.fillStyle = '#3b82f6';

      overlayCtx.save();
      overlayCtx.scale(scaleRef.current, scaleRef.current);

      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4;
          if (maskData[i] > 128) {
            overlayCtx.fillRect(x, y, 1, 1);
          }
        }
      }

      overlayCtx.restore();
      setCurrentMask(maskResponse.mask_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate mask');
    } finally {
      setIsGenerating(false);
    }
  };


  const handleClear = () => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    setCurrentMask(null);
  };

  const handleContinue = async () => {
    if (!currentMask) return;

    try {
      const response = await fetch(currentMask);
      const blob = await response.blob();
      onAreaSelected(currentMask, blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mask data');
    }
  };

  return (
    <div className="area-selector">
      <h2 className="section-title">Select Your Surface</h2>
      <p className="section-description">
        Click anywhere on the countertop or table you want to transform. Our AI will automatically recognize and highlight the entire surface for precise stone material replacement.
      </p>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="selector-container">
        <div className="canvas-wrapper" style={{ position: 'relative', cursor: isGenerating ? 'wait' : 'crosshair' }}>
          <canvas
            ref={canvasRef}
            className="selection-canvas"
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
          <canvas
            ref={overlayCanvasRef}
            onClick={handleCanvasClick}
            onTouchEnd={handleCanvasClick}
            className="selection-canvas"
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: isGenerating ? 'none' : 'auto' }}
          />
          {!canvasReady && <div className="canvas-loading">Loading image...</div>}
          {isGenerating && <div className="canvas-loading">Detecting surface...</div>}
        </div>

        <div className="tools-panel">
          <div className="tool-group">
            <p className="tool-info">
              <strong>How to select:</strong>
            </p>
            <ul style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--color-text-light)', marginTop: '8px', paddingLeft: '20px' }}>
              <li>Click directly on your countertop or table surface</li>
              <li>AI automatically recognizes and detects the entire horizontal surface</li>
              <li>Works best with clear, well-lit photos taken from a straight angle</li>
              <li>If selection is inaccurate, click Clear and try a different spot on the surface</li>
            </ul>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={!currentMask || isGenerating}
          >
            Clear Selection
          </button>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onBack} disabled={isGenerating}>
          Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleContinue}
          disabled={!currentMask || isGenerating}
        >
          Continue to Stone Selection
        </button>
      </div>
    </div>
  );
}

export default AreaSelector;
