import { useState, useRef, useEffect } from 'react';
import './ImageZoom.css';

interface ImageZoomProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

function ImageZoom({ imageUrl, alt, onClose }: ImageZoomProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale(s => Math.min(s + 0.25, 5));
      } else if (e.key === '-') {
        setScale(s => Math.max(s - 0.25, 0.5));
      } else if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(s => Math.max(0.5, Math.min(5, s + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="image-zoom-overlay" onClick={onClose}>
      <div className="zoom-controls">
        <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(0.5, s - 0.25)); }} title="Zoom Out (-)">
          −
        </button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(5, s + 0.25)); }} title="Zoom In (+)">
          +
        </button>
        <button onClick={(e) => { e.stopPropagation(); setScale(1); setPosition({ x: 0, y: 0 }); }} title="Reset (0)">
          Reset
        </button>
        <button onClick={onClose} className="close-zoom" title="Close (Esc)">
          ✕
        </button>
      </div>
      <div
        ref={containerRef}
        className="zoom-container"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="zoom-image"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          draggable={false}
        />
      </div>
      <div className="zoom-hints">
        Scroll to zoom • Drag to pan • ESC to close
      </div>
    </div>
  );
}

export default ImageZoom;
