# Next.js Frontend Setup Guide

Complete guide for setting up the production Next.js frontend with Tailwind CSS, react-dropzone, and react-konva.

## Quick Start

### 1. Create Next.js App

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd frontend
```

### 2. Install Dependencies

```bash
npm install react-dropzone react-konva konva axios @supabase/supabase-js
npm install -D @types/node
```

### 3. Configure Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Update next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
  images: {
    domains: ['images.pexels.com', 'localhost'],
  },
}

module.exports = nextConfig
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
├── components/
│   ├── ImageUploader.tsx    # Drag-and-drop upload
│   ├── MaskDrawer.tsx       # Konva canvas mask tool
│   ├── StoneCatalog.tsx     # Material selector
│   ├── ResultPreview.tsx    # Before/after comparison
│   └── ProcessingStatus.tsx # Loading state
├── lib/
│   ├── api.ts              # API client
│   ├── supabase.ts         # Supabase client
│   └── types.ts            # TypeScript types
└── utils/
    └── image-utils.ts      # Image processing utilities
```

## Core Components

### 1. API Client (`lib/api.ts`)

```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export interface UploadResponse {
  image_id: string;
  image_url: string;
  message: string;
}

export interface ProcessingRequest {
  image_id: string;
  mask_data: string;
  stone_material: any;
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress?: number;
  result_url?: string;
  error?: string;
}

export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const uploadMask = async (blob: Blob): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', blob, 'mask.png');

  const response = await api.post('/api/upload-mask', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const processImage = async (
  request: ProcessingRequest
): Promise<{ job_id: string }> => {
  const response = await api.post('/api/process', request);
  return response.data;
};

export const getJobStatus = async (jobId: string): Promise<JobStatus> => {
  const response = await api.get(`/api/job/${jobId}`);
  return response.data;
};

export const getImageUrl = (path: string): string => {
  return `${API_URL}${path}`;
};
```

### 2. Image Uploader (`components/ImageUploader.tsx`)

```typescript
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface ImageUploaderProps {
  imageUrl?: string;
  onImageSelect: (file: File) => void;
}

export default function ImageUploader({
  imageUrl,
  onImageSelect,
}: ImageUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageSelect(acceptedFiles[0]);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!imageUrl ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-colors duration-200
            ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive
                  ? 'Drop your image here'
                  : 'Drag & drop an image, or click to select'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full h-96 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt="Uploaded image"
              fill
              className="object-contain"
            />
          </div>
          <button
            onClick={() => onImageSelect(null as any)}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg
                     hover:bg-gray-50 transition-colors"
          >
            Choose Different Image
          </button>
        </div>
      )}
    </div>
  );
}
```

### 3. Mask Drawer (`components/MaskDrawer.tsx`)

```typescript
'use client';

import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import Konva from 'konva';

interface MaskDrawerProps {
  imageUrl: string;
  onMaskComplete: (maskBlob: Blob) => void;
  onBack: () => void;
}

export default function MaskDrawer({
  imageUrl,
  onMaskComplete,
  onBack,
}: MaskDrawerProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');
  const [brushSize, setBrushSize] = useState(30);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [imageUrl]);

  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { mode, points: [pos.x, pos.y], brushSize }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    setLines([...lines.slice(0, -1), lastLine]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setLines([]);
  };

  const handleExport = async () => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const dataURL = stage.toDataURL({ pixelRatio: 2 });

    const response = await fetch(dataURL);
    const blob = await response.blob();

    onMaskComplete(blob);
  };

  if (!image) {
    return <div className="text-center py-12">Loading image...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Draw Mask</h2>
        <div className="space-x-2">
          <button
            onClick={() => setMode('draw')}
            className={`px-4 py-2 rounded-lg ${
              mode === 'draw'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Draw
          </button>
          <button
            onClick={() => setMode('erase')}
            className={`px-4 py-2 rounded-lg ${
              mode === 'erase'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Erase
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            <Stage
              ref={stageRef}
              width={800}
              height={600}
              onMouseDown={handleMouseDown}
              onMousemove={handleMouseMove}
              onMouseup={handleMouseUp}
            >
              <Layer ref={layerRef}>
                <KonvaImage image={image} width={800} height={600} />
                {lines.map((line, i) => (
                  <Line
                    key={i}
                    points={line.points}
                    stroke={line.mode === 'draw' ? 'rgba(59, 130, 246, 0.5)' : 'white'}
                    strokeWidth={line.brushSize}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      line.mode === 'erase' ? 'destination-out' : 'source-over'
                    }
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>

        <div className="w-64 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Brush Size: {brushSize}px
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={handleClear}
            className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Clear Mask
          </button>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleExport}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue to Stone Selection
        </button>
      </div>
    </div>
  );
}
```

### 4. Main Page (`app/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import MaskDrawer from '@/components/MaskDrawer';
import StoneCatalog from '@/components/StoneCatalog';
import ResultPreview from '@/components/ResultPreview';
import { uploadImage, uploadMask, processImage, getJobStatus } from '@/lib/api';

type Step = 'upload' | 'mask' | 'select' | 'preview';

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageId, setImageId] = useState<string>('');
  const [maskId, setMaskId] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageSelect = async (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));

    const response = await uploadImage(file);
    setImageId(response.image_id);
    setStep('mask');
  };

  const handleMaskComplete = async (maskBlob: Blob) => {
    const response = await uploadMask(maskBlob);
    setMaskId(response.image_id);
    setStep('select');
  };

  const handleStoneSelect = async (stone: any) => {
    setProcessing(true);
    setStep('preview');

    const response = await processImage({
      image_id: imageId,
      mask_data: maskId,
      stone_material: stone,
    });

    setJobId(response.job_id);

    const interval = setInterval(async () => {
      const status = await getJobStatus(response.job_id);

      setProgress(status.progress || 0);

      if (status.status === 'completed') {
        setResultUrl(status.result_url!);
        setProcessing(false);
        clearInterval(interval);
      } else if (status.status === 'failed') {
        alert('Processing failed: ' + status.error);
        setProcessing(false);
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Stone Replacement Tool
        </h1>

        {step === 'upload' && (
          <ImageUploader
            imageUrl={imageUrl}
            onImageSelect={handleImageSelect}
          />
        )}

        {step === 'mask' && imageUrl && (
          <MaskDrawer
            imageUrl={imageUrl}
            onMaskComplete={handleMaskComplete}
            onBack={() => setStep('upload')}
          />
        )}

        {step === 'select' && (
          <StoneCatalog
            onStoneSelect={handleStoneSelect}
            onBack={() => setStep('mask')}
          />
        )}

        {step === 'preview' && (
          <ResultPreview
            originalUrl={imageUrl}
            resultUrl={resultUrl}
            processing={processing}
            progress={progress}
            onReset={() => {
              setStep('upload');
              setImageUrl('');
              setResultUrl('');
            }}
          />
        )}
      </div>
    </main>
  );
}
```

## Running the Application

### 1. Start Backend

```bash
cd backend
docker-compose up
```

Backend will be available at `http://localhost:8000`

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Production Build

```bash
cd frontend
npm run build
npm start
```

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Docker
```bash
docker build -t stone-replacement-frontend .
docker run -p 3000:3000 stone-replacement-frontend
```

## Environment Variables for Production

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Additional Features to Implement

1. **User Authentication** - Add Supabase Auth
2. **Project Saving** - Store projects in database
3. **History** - View past projects
4. **Sharing** - Share results with others
5. **Advanced Editing** - Undo/redo, layers
6. **Mobile Support** - Touch-optimized drawing
7. **Batch Processing** - Multiple images at once

## Troubleshooting

### CORS Issues
Ensure backend CORS is configured:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Image Loading Issues
Check next.config.js image domains configuration

### API Connection Errors
Verify NEXT_PUBLIC_API_URL in .env.local

## License

ISC
