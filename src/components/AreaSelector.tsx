import { useRef, useEffect, useState } from 'react';
import './AreaSelector.css';

interface AreaSelectorProps {
  imageUrl: string;
  imageId: string;
  onAreaSelected: (maskData: string, maskBlob: Blob) => void;
  onBack: () => void;
}

function AreaSelector({ imageUrl, onAreaSelected, onBack }: AreaSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.width);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setCanvasReady(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = mode === 'draw' ? 'source-over' : 'destination-out';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageUrl;
  };

  const handleContinue = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0 && (data[i] === 59 || data[i + 1] === 130 || data[i + 2] === 246)) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }
    }

    tempCtx.putImageData(imageData, 0, 0);
    const maskDataUrl = tempCanvas.toDataURL('image/png');

    tempCanvas.toBlob((blob) => {
      if (blob) {
        onAreaSelected(maskDataUrl, blob);
      }
    }, 'image/png');
  };

  return (
    <div className="area-selector">
      <h2 className="section-title">Select the Area to Replace</h2>
      <p className="section-description">
        Paint over the stone surface you want to replace. Use the brush to mark areas and eraser to refine.
      </p>

      <div className="selector-container">
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="selection-canvas"
          />
          {!canvasReady && <div className="canvas-loading">Loading image...</div>}
        </div>

        <div className="tools-panel">
          <div className="tool-group">
            <label className="tool-label">Mode</label>
            <div className="mode-buttons">
              <button
                className={`mode-btn ${mode === 'draw' ? 'active' : ''}`}
                onClick={() => setMode('draw')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                </svg>
                Draw
              </button>
              <button
                className={`mode-btn ${mode === 'erase' ? 'active' : ''}`}
                onClick={() => setMode('erase')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 20H7L3 16l6-6 5 5 5-5 1 1v9z" />
                </svg>
                Erase
              </button>
            </div>
          </div>

          <div className="tool-group">
            <label className="tool-label">Brush Size: {brushSize}px</label>
            <input
              type="range"
              min="10"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="brush-slider"
            />
          </div>

          <button className="btn btn-secondary" onClick={handleClear}>
            Clear Selection
          </button>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn btn-primary" onClick={handleContinue}>
          Continue to Stone Selection
        </button>
      </div>
    </div>
  );
}

export default AreaSelector;
