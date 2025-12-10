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
      const response = await api.generateMask(imageId, imageX, imageY);

      const maskImg = new Image();
      maskImg.onload = () => {
        const overlayCanvas = overlayCanvasRef.current;
        if (!overlayCanvas) return;

        const overlayCtx = overlayCanvas.getContext('2d');
        if (!overlayCtx) return;

        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        overlayCtx.globalAlpha = 0.5;
        overlayCtx.fillStyle = '#3b82f6';

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = maskImg.width;
        tempCanvas.height = maskImg.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.drawImage(maskImg, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, maskImg.width, maskImg.height);
        const data = imageData.data;

        overlayCtx.save();
        overlayCtx.scale(scaleRef.current, scaleRef.current);

        for (let y = 0; y < maskImg.height; y++) {
          for (let x = 0; x < maskImg.width; x++) {
            const i = (y * maskImg.width + x) * 4;
            if (data[i] > 128) {
              overlayCtx.fillRect(x, y, 1, 1);
            }
          }
        }

        overlayCtx.restore();
      };

      maskImg.src = `${import.meta.env.VITE_API_URL}${response.mask_url}`;
      setCurrentMask(response.mask_url);
    } catch (err) {
      console.error('Error generating mask:', err);
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
      const maskUrl = `${import.meta.env.VITE_API_URL}${currentMask}`;
      const response = await fetch(maskUrl);
      const blob = await response.blob();
      onAreaSelected(maskUrl, blob);
    } catch (err) {
      console.error('Error loading mask:', err);
      setError('Failed to load mask data');
    }
  };

  return (
    <div className="area-selector">
      <h2 className="section-title">Select the Area to Replace</h2>
      <p className="section-description">
        Click on the stone surface you want to replace. AI will automatically detect the area.
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
          {isGenerating && <div className="canvas-loading">Detecting area...</div>}
        </div>

        <div className="tools-panel">
          <div className="tool-group">
            <p className="tool-info">
              Click on any surface to automatically detect and select it using AI segmentation.
            </p>
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
