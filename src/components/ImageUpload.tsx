import { useState, useRef } from 'react';
import { validateImage, optimizeImage, formatFileSize } from '../lib/fileUtils';
import './ImageUpload.css';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string, file: File) => void;
}

function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setUploadProgress(10);

    try {
      const validation = await validateImage(file);
      setUploadProgress(30);

      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setIsProcessing(false);
        return;
      }

      setUploadProgress(50);
      const optimizedBlob = await optimizeImage(file);
      setUploadProgress(70);

      const optimizedFile = new File([optimizedBlob], file.name, {
        type: file.type,
      });

      setCurrentFile(optimizedFile);
      setUploadProgress(90);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        setUploadProgress(100);
        setIsProcessing(false);
      };
      reader.readAsDataURL(optimizedFile);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleContinue = () => {
    if (previewUrl && currentFile) {
      onImageUpload(previewUrl, currentFile);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setCurrentFile(null);
    setError(null);
    setIsProcessing(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload">
      <h2 className="section-title">Upload Your Kitchen or Bathroom Photo</h2>
      <p className="section-description">
        Upload a clear photo showing your countertop. For best results, ensure the countertop is well-lit, clearly visible, and photographed from a straight-on angle.
      </p>

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      {!previewUrl && !isProcessing ? (
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="upload-text">
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p className="upload-hint">PNG, JPG, WEBP up to 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      ) : isProcessing ? (
        <div className="processing-upload">
          <div className="processing-spinner"></div>
          <p>Processing your image...</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p className="progress-text">{uploadProgress}%</p>
        </div>
      ) : (
        <div className="preview-container">
          <img src={previewUrl!} alt="Preview" className="preview-image" />
          {currentFile && (
            <div className="file-info">
              <span className="file-name">{currentFile.name}</span>
              <span className="file-size">{formatFileSize(currentFile.size)}</span>
            </div>
          )}
          <div className="preview-actions">
            <button className="btn btn-secondary" onClick={handleReset}>
              Choose Different Image
            </button>
            <button className="btn btn-primary" onClick={handleContinue}>
              Continue to Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
