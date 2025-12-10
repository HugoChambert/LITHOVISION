# Stone Replacement Tool - Quick Start Guide

Get started with the AI-powered stone replacement tool in 5 minutes.

## What You Get

✅ **Production-ready FastAPI backend** with complete ML pipeline
✅ **Pre-built React/Vite frontend** ready to use
✅ **Next.js setup guide** for custom implementation
✅ **Docker containerization** for easy deployment
✅ **Complete ML pipeline**: SAM → MiDaS → SDXL → Color Matching

## Prerequisites

- **Docker** (recommended) OR
- **Python 3.11+** + **Node.js 18+** + **Redis**
- **CUDA GPU** (optional but highly recommended for ML models)

## Option 1: Docker (Fastest - 2 minutes)

### 1. Start Backend

```bash
cd backend
docker-compose up
```

This starts:
- FastAPI server on `http://localhost:8000`
- Redis message broker
- Celery worker for ML processing

**First run**: Downloads ~10GB of ML models (SAM, MiDaS, SDXL)

### 2. Test Backend

```bash
curl http://localhost:8000/health
# Response: {"status": "healthy"}
```

### 3. Use Pre-built Frontend

The React/Vite frontend is already built and ready:

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and start using the tool!

## Option 2: Manual Setup (5 minutes)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download SAM weights
wget -P models/ https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth

# Start Redis (separate terminal)
redis-server

# Start Celery worker (separate terminal)
celery -A app.celery_app worker --loglevel=info

# Start FastAPI (separate terminal)
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
# Use pre-built React frontend
npm install
npm run dev

# OR set up Next.js from scratch
# See next-frontend-setup.md for detailed instructions
```

## First Test Run

### 1. Upload an Image

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@kitchen.jpg"
```

Response:
```json
{
  "image_id": "123e4567-e89b-12d3-a456-426614174000",
  "image_url": "/uploads/123e4567-e89b-12d3-a456-426614174000.jpg",
  "message": "Image uploaded successfully"
}
```

### 2. Upload a Mask

Create a white-on-black mask image, then:

```bash
curl -X POST http://localhost:8000/api/upload-mask \
  -F "file=@mask.png"
```

### 3. Start Processing

```bash
curl -X POST http://localhost:8000/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "image_id": "your-image-id",
    "mask_data": "your-mask-id",
    "stone_material": {
      "id": "stone-1",
      "name": "Carrara Marble",
      "type": "marble",
      "description": "Classic white marble"
    }
  }'
```

Response:
```json
{
  "job_id": "celery-task-id",
  "status": "queued",
  "message": "Processing started"
}
```

### 4. Check Status

```bash
curl http://localhost:8000/api/job/celery-task-id
```

Response:
```json
{
  "job_id": "celery-task-id",
  "status": "processing",
  "progress": 50
}
```

When complete:
```json
{
  "job_id": "celery-task-id",
  "status": "completed",
  "progress": 100,
  "result_url": "/uploads/result-id_result.jpg"
}
```

### 5. Download Result

```bash
curl http://localhost:8000/uploads/result-id_result.jpg -o result.jpg
```

## Using the Web Interface

### Pre-built React UI (Recommended for Testing)

1. Start backend: `docker-compose up` in `backend/`
2. Start frontend: `npm run dev` in project root
3. Visit `http://localhost:5173`
4. Follow the 4-step workflow:
   - Upload kitchen/bathroom photo
   - Draw mask over stone area
   - Choose stone material
   - View and download result

### Next.js UI (Recommended for Production)

See `next-frontend-setup.md` for complete setup instructions.

Key features:
- Server-side rendering
- Optimized performance
- Production-ready
- react-konva mask drawing tool

## Verifying ML Models

### Check if CUDA is Available

```bash
docker exec -it backend-backend-1 python -c "import torch; print(torch.cuda.is_available())"
```

Should print `True` if GPU is available.

### Test Individual Models

```python
# Inside backend container or venv
python

>>> from app.ml.sam_segmentation import sam_segmenter
>>> sam_segmenter.load_model()  # Should load without errors

>>> from app.ml.depth_estimation import depth_estimator
>>> depth_estimator.load_model()  # Should load without errors

>>> from app.ml.sdxl_inpainting import sdxl_inpainter
>>> sdxl_inpainter.load_model()  # Should load (may take a minute)
```

## Common Issues

### Out of Memory
**Problem**: CUDA out of memory error
**Solution**:
- Reduce image size before processing
- Use CPU mode (slower): Remove GPU-specific code
- Close other GPU-intensive applications

### Redis Connection Error
**Problem**: `ConnectionRefusedError: [Errno 111]`
**Solution**:
- Ensure Redis is running: `redis-cli ping`
- Check REDIS_URL in .env

### Slow Processing
**Problem**: Each image takes 5+ minutes
**Solution**:
- Check if using GPU: `nvidia-smi`
- Verify CUDA installation
- Consider reducing SDXL inference steps

### Models Not Downloading
**Problem**: Models fail to download
**Solution**:
- Check internet connection
- Download manually to `backend/models/`
- Verify disk space (~10GB required)

## Project Structure

```
stone-replacement-tool/
├── backend/           # FastAPI + ML Pipeline (NEW)
├── src/               # React/Vite UI (READY)
├── supabase/          # Database & migrations
├── ARCHITECTURE.md    # System design
├── QUICKSTART.md      # This file
└── next-frontend-setup.md  # Next.js guide
```

## Next Steps

### For Development
1. ✅ Test with sample images
2. 📖 Read `ARCHITECTURE.md` for system details
3. 📖 Read `backend/README.md` for API documentation
4. 🔧 Customize ML parameters in `backend/app/ml/`

### For Production
1. 📖 Read `next-frontend-setup.md` for Next.js setup
2. 🚀 Deploy backend to cloud (AWS/GCP/Azure)
3. 🚀 Deploy frontend to Vercel
4. 🔐 Add authentication (Supabase Auth)
5. 📊 Set up monitoring (logs, metrics)

### For Customization
1. **Add more stone types**: Update Supabase database
2. **Adjust ML parameters**: Edit `backend/app/ml/` files
3. **Change UI theme**: Modify Tailwind config
4. **Add features**: Project history, sharing, etc.

## Performance Expectations

### With GPU (RTX 3090)
- Upload: < 1 second
- Mask drawing: Real-time
- Processing: 20-25 seconds
- Download: < 1 second
- **Total**: ~30 seconds

### With CPU
- Processing: 5-10 minutes
- Everything else: Same as GPU

## Support & Documentation

- **Architecture**: `ARCHITECTURE.md`
- **Backend API**: `backend/README.md`
- **Next.js Setup**: `next-frontend-setup.md`
- **Database**: `supabase/migrations/`

## Example Workflow

1. User uploads `kitchen.jpg`
2. User draws mask over countertop
3. User selects "Carrara Marble"
4. Backend pipeline runs:
   - SAM refines mask edges
   - MiDaS generates depth map
   - SDXL generates marble texture
   - Color matching blends result
5. User downloads `result.jpg`
6. User sees realistic preview of new countertop

## License

ISC

---

**Ready to start?** Run `docker-compose up` in the `backend/` directory and open the React UI!
