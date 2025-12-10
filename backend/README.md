# Stone Replacement Backend

FastAPI backend with ML pipeline for AI-powered stone material replacement.

## Architecture

```
backend/
├── app/
│   ├── api/
│   │   ├── routes.py        # FastAPI endpoints
│   │   └── tasks.py         # Celery async tasks
│   ├── ml/
│   │   ├── sam_segmentation.py   # SAM model
│   │   ├── depth_estimation.py   # MiDaS depth
│   │   ├── sdxl_inpainting.py    # SDXL inpainting
│   │   └── color_matching.py     # Color adjustment
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── config.py            # Configuration
│   ├── celery_app.py        # Celery setup
│   └── main.py              # FastAPI app
├── uploads/                 # Uploaded files
├── models/                  # ML model weights
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## ML Pipeline

### 1. SAM Segmentation
- **Model**: Segment Anything Model (SAM) vit_h
- **Purpose**: Refines user-drawn masks with precise edge detection
- **Input**: Original image + rough mask
- **Output**: Refined binary mask

### 2. Depth Estimation
- **Model**: Intel DPT-Large (MiDaS)
- **Purpose**: Generates depth map for perspective-aware texture application
- **Input**: Original image
- **Output**: Grayscale depth map

### 3. SDXL Inpainting
- **Model**: Stable Diffusion XL Inpainting
- **Purpose**: Generates realistic stone texture in masked area
- **Input**: Image + refined mask + depth map + stone material description
- **Output**: Inpainted image with new stone texture

### 4. Color Matching
- **Algorithm**: Custom color transfer and blending
- **Purpose**: Matches colors and lighting between original and generated regions
- **Input**: Original image + inpainted image + mask
- **Output**: Final blended result

## Setup

### Option 1: Docker (Recommended)

1. Build and start services:
```bash
cd backend
docker-compose up --build
```

This starts:
- FastAPI backend on `http://localhost:8000`
- Redis on `localhost:6379`
- Celery worker for ML processing

### Option 2: Local Development

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Download SAM weights:
```bash
wget -P models/ https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth
```

4. Start Redis:
```bash
# Install and start Redis
# macOS: brew install redis && brew services start redis
# Ubuntu: sudo apt install redis-server && sudo systemctl start redis
# Windows: Download from https://redis.io/download
```

5. Start Celery worker:
```bash
celery -A app.celery_app worker --loglevel=info
```

6. Start FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### POST /api/upload
Upload original image

**Request**: multipart/form-data with file
**Response**:
```json
{
  "image_id": "uuid",
  "image_url": "/uploads/uuid.jpg",
  "message": "Image uploaded successfully"
}
```

### POST /api/upload-mask
Upload mask image

**Request**: multipart/form-data with file
**Response**:
```json
{
  "image_id": "uuid",
  "image_url": "/uploads/uuid.png",
  "message": "Mask uploaded successfully"
}
```

### POST /api/process
Start stone replacement processing

**Request**:
```json
{
  "image_id": "uuid",
  "mask_data": "mask_uuid",
  "stone_material": {
    "id": "stone_uuid",
    "name": "Carrara Marble",
    "type": "marble",
    "description": "Classic white marble with gray veining"
  }
}
```

**Response**:
```json
{
  "job_id": "celery_task_id",
  "status": "queued",
  "message": "Processing started"
}
```

### GET /api/job/{job_id}
Get job status and result

**Response**:
```json
{
  "job_id": "celery_task_id",
  "status": "completed",
  "progress": 100,
  "result_url": "/uploads/result_uuid.jpg"
}
```

**Status values**: `pending`, `processing`, `completed`, `failed`

### GET /api/uploads/{filename}
Retrieve uploaded/generated files

## Environment Variables

Create `.env` file:
```env
REDIS_URL=redis://localhost:6379/0
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## Model Requirements

### GPU Requirements
- CUDA-capable GPU with 8GB+ VRAM (recommended)
- Works on CPU but much slower (10-20x)

### Model Sizes
- SAM vit_h: ~2.4GB
- DPT-Large: ~1.3GB
- SDXL Inpainting: ~6.9GB

**Total**: ~10GB disk space for models

## Performance

### Processing Time (NVIDIA RTX 3090)
- SAM segmentation: 2-3 seconds
- Depth estimation: 1-2 seconds
- SDXL inpainting: 15-20 seconds
- Color matching: < 1 second

**Total**: ~20-25 seconds per image

### Processing Time (CPU)
- Total: 5-10 minutes per image

## Celery Tasks

Tasks are processed asynchronously:

1. Task queued → `status: pending`
2. Processing starts → `status: processing` with progress updates
3. Completion → `status: completed` with `result_url`
4. Error → `status: failed` with error message

Progress updates:
- 0%: Queued
- 10%: SAM refinement
- 30%: Depth estimation
- 50%: SDXL inpainting
- 85%: Color matching
- 100%: Complete

## Troubleshooting

### Out of Memory Error
- Reduce SDXL inference steps in `sdxl_inpainting.py`
- Enable CPU offloading (already enabled by default)
- Use smaller models (SAM vit_b instead of vit_h)

### Slow Processing
- Ensure CUDA is properly installed
- Check GPU utilization with `nvidia-smi`
- Consider using smaller image sizes

### Connection Refused
- Verify Redis is running: `redis-cli ping`
- Check FastAPI logs for errors
- Ensure ports 8000 and 6379 are available

## Development

### Adding New ML Models

1. Create model wrapper in `app/ml/`
2. Add to pipeline in `app/api/tasks.py`
3. Update progress tracking
4. Test with sample images

### Testing

```bash
# Test API endpoints
curl -X POST http://localhost:8000/api/upload \
  -F "file=@test_image.jpg"

# Monitor Celery tasks
celery -A app.celery_app events

# Check Redis
redis-cli monitor
```

## Production Deployment

### Scaling

- Run multiple Celery workers for parallel processing
- Use Redis Cluster for high availability
- Deploy FastAPI with Gunicorn + Uvicorn workers
- Use cloud storage (S3) instead of local uploads
- Implement rate limiting and authentication

### Optimization

- Cache model weights in memory
- Batch process multiple images
- Use model quantization for smaller memory footprint
- Implement result caching for identical requests

## License

ISC
