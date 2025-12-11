import { useRef, useEffect, useState } from 'react';
import * as api from '../lib/api';
import './AreaSelector.css';

interface AreaSelectorProps {
  imageUrl: string;
  imageId: string;
  onAreaSelected: (maskData: string, maskBlob: Blob) => void;
  onBack: () => void;
}

function AreaSelector({ imageUrl, imageId: _imageId, onAreaSelected, onBack }: AreaSelectorProps) {
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

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.drawImage(img, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
      const maskData = new Uint8ClampedArray(imageData.data.length).fill(0);

      const targetPixel = getPixel(imageData, imageX, imageY);
      const tolerance = calculateAdaptiveTolerance(imageData, imageX, imageY, img.width, img.height);

      floodFill(imageData, maskData, img.width, img.height, imageX, imageY, targetPixel, tolerance);

      morphologicalClose(maskData, img.width, img.height, 2);
      removeSmallRegions(maskData, img.width, img.height, 50);

      for (let i = 0; i < maskData.length; i += 4) {
        const alpha = maskData[i + 3];
        maskData[i] = alpha;
        maskData[i + 1] = alpha;
        maskData[i + 2] = alpha;
        maskData[i + 3] = 255;
      }

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) return;

      const maskImageData = new ImageData(maskData, img.width, img.height);
      maskCtx.putImageData(maskImageData, 0, 0);

      const maskBlob = await new Promise<Blob>((resolve) => {
        maskCanvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      const maskResponse = await api.uploadMask(maskBlob);

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
      setCurrentMask(maskResponse.image_url);
    } catch (err) {
      console.error('Error generating mask:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate mask');
    } finally {
      setIsGenerating(false);
    }
  };

  function getPixel(imageData: ImageData, x: number, y: number): [number, number, number] {
    const i = (y * imageData.width + x) * 4;
    return [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]];
  }

  function colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
    const dr = c1[0] - c2[0];
    const dg = c1[1] - c2[1];
    const db = c1[2] - c2[2];
    return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
  }

  function calculateAdaptiveTolerance(
    imageData: ImageData,
    x: number,
    y: number,
    width: number,
    height: number
  ): number {
    const sampleRadius = 5;
    const samples: [number, number, number][] = [];

    for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
      for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
        const sx = x + dx;
        const sy = y + dy;
        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          samples.push(getPixel(imageData, sx, sy));
        }
      }
    }

    const centerColor = getPixel(imageData, x, y);
    let totalVariance = 0;

    for (const sample of samples) {
      totalVariance += colorDistance(centerColor, sample);
    }

    const avgVariance = totalVariance / samples.length;
    const baseTolerance = 35;
    const adaptiveTolerance = Math.max(25, Math.min(60, baseTolerance + avgVariance * 0.5));

    return adaptiveTolerance;
  }

  function morphologicalClose(
    maskData: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ) {
    const temp = new Uint8ClampedArray(maskData.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let maxVal = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const i = (ny * width + nx) * 4;
              maxVal = Math.max(maxVal, maskData[i + 3]);
            }
          }
        }
        const i = (y * width + x) * 4;
        temp[i + 3] = maxVal;
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let minVal = 255;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const i = (ny * width + nx) * 4;
              minVal = Math.min(minVal, temp[i + 3]);
            }
          }
        }
        const i = (y * width + x) * 4;
        maskData[i + 3] = minVal;
      }
    }
  }

  function removeSmallRegions(
    maskData: Uint8ClampedArray,
    width: number,
    height: number,
    minSize: number
  ) {
    const visited = new Uint8Array(width * height);
    const regions: { size: number; pixels: number[] }[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const idx = y * width + x;

        if (maskData[i + 3] > 0 && !visited[idx]) {
          const region: number[] = [];
          const queue: [number, number][] = [[x, y]];

          while (queue.length > 0) {
            const [cx, cy] = queue.shift()!;
            const cidx = cy * width + cx;

            if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
            if (visited[cidx]) continue;

            const ci = (cy * width + cx) * 4;
            if (maskData[ci + 3] === 0) continue;

            visited[cidx] = 1;
            region.push(cidx);

            queue.push([cx + 1, cy]);
            queue.push([cx - 1, cy]);
            queue.push([cx, cy + 1]);
            queue.push([cx, cy - 1]);
          }

          regions.push({ size: region.length, pixels: region });
        }
      }
    }

    regions.sort((a, b) => b.size - a.size);

    for (let i = 1; i < regions.length; i++) {
      if (regions[i].size < minSize) {
        for (const idx of regions[i].pixels) {
          const pi = idx * 4;
          maskData[pi + 3] = 0;
        }
      }
    }
  }

  function floodFill(
    imageData: ImageData,
    maskData: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    y: number,
    targetColor: [number, number, number],
    tolerance: number
  ) {
    const visited = new Set<number>();
    const queue: [number, number][] = [[x, y]];

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;

      if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

      const key = cy * width + cx;
      if (visited.has(key)) continue;
      visited.add(key);

      const currentColor = getPixel(imageData, cx, cy);
      const distance = colorDistance(currentColor, targetColor);

      if (distance <= tolerance) {
        const i = (cy * width + cx) * 4;
        maskData[i + 3] = 255;

        queue.push([cx + 1, cy]);
        queue.push([cx - 1, cy]);
        queue.push([cx, cy + 1]);
        queue.push([cx, cy - 1]);
      }
    }
  }

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
