# Model Setup Guide

## Quick Start with Stub Models (Default)

The application works out-of-the-box with stub models that don't require ML dependencies or GPU.

```bash
# Already configured by default
USE_STUB_MODELS=true
```

Stub models provide:
- ✅ Working API routes
- ✅ Functional user interface
- ✅ Basic image processing
- ✅ Procedural texture generation
- ✅ Fast response times
- ✅ No GPU required
- ✅ No large downloads

## Transitioning to Real ML Models

### Prerequisites

1. **Hardware**
   - GPU with 8GB+ VRAM (recommended for SDXL)
   - 16GB+ system RAM
   - 20GB+ free disk space

2. **Software**
   - Python 3.9+
   - CUDA 11.8+ (for GPU acceleration)

### Installation Steps

#### Step 1: Install ML Dependencies

```bash
cd backend

# Core ML libraries
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# SAM (Segment Anything)
pip install segment-anything

# Depth estimation
pip install transformers

# SDXL inpainting
pip install diffusers accelerate safetensors

# Image processing
pip install opencv-python pillow
```

#### Step 2: Download SAM Model

```bash
# Create models directory
mkdir -p /app/models

# Download SAM checkpoint (2.4GB)
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth \
  -O /app/models/sam_vit_h_4b8939.pth
```

Or manually download from: https://github.com/facebookresearch/segment-anything#model-checkpoints

#### Step 3: Configure Environment

Update `.env` file:

```bash
# Switch to real models
USE_STUB_MODELS=false

# SAM configuration (already set in config.py)
SAM_CHECKPOINT=/app/models/sam_vit_h_4b8939.pth
SAM_MODEL_TYPE=vit_h
```

#### Step 4: Restart Services

```bash
# If using Docker
docker-compose restart

# If running locally
# Restart FastAPI server and Celery workers
```

### Model Details

#### 1. SAM (Segment Anything Model)

**Purpose:** Precise mask refinement and edge detection

**File locations:**
- Real: `backend/app/ml/sam_segmentation.py`
- Stub: `backend/app/ml/sam_segmentation_stub.py`

**Model size:** ~2.4GB

**First run:** Loads model into memory (~30 seconds)

**Inference:** ~2-5 seconds per image (GPU)

**Insert real model code at:**
```python
# backend/app/ml/sam_segmentation.py lines 18-25
from segment_anything import sam_model_registry, SamPredictor

sam = sam_model_registry["vit_h"](checkpoint=SAM_CHECKPOINT)
sam.to(device="cuda")
predictor = SamPredictor(sam)
```

#### 2. DPT Depth Estimation

**Purpose:** ML-based depth map generation

**File locations:**
- Real: `backend/app/ml/depth_estimation.py`
- Stub: `backend/app/ml/depth_estimation_stub.py`

**Model size:** ~1.3GB (auto-downloads from HuggingFace)

**First run:** Downloads model automatically (~5 minutes)

**Inference:** ~3-6 seconds per image (GPU)

**Insert real model code at:**
```python
# backend/app/ml/depth_estimation.py lines 22-24
from transformers import DPTImageProcessor, DPTForDepthEstimation

processor = DPTImageProcessor.from_pretrained("Intel/dpt-large")
model = DPTForDepthEstimation.from_pretrained("Intel/dpt-large")
```

#### 3. SDXL Inpainting

**Purpose:** Photorealistic stone texture generation

**File locations:**
- Real: `backend/app/ml/sdxl_inpainting.py`
- Stub: `backend/app/ml/sdxl_inpainting_stub.py`

**Model size:** ~13GB (auto-downloads from HuggingFace)

**First run:** Downloads model automatically (~30 minutes)

**Inference:** ~15-30 seconds per image (GPU with 8GB VRAM)

**Insert real model code at:**
```python
# backend/app/ml/sdxl_inpainting.py lines 22-27
from diffusers import StableDiffusionXLInpaintPipeline

pipe = StableDiffusionXLInpaintPipeline.from_pretrained(
    "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
    torch_dtype=torch.float16
)
pipe.to("cuda")
```

### Verification

Test that models are loaded correctly:

```python
# In Python shell
from app.config import USE_STUB_MODELS
from app.ml.sam_segmentation import sam_segmenter
from app.ml.depth_estimation import depth_estimator
from app.ml.sdxl_inpainting import sdxl_inpainter

print(f"Using stubs: {USE_STUB_MODELS}")

# These should load without errors
sam_segmenter.load_model()
depth_estimator.load_model()
sdxl_inpainter.load_model()
```

## Performance Comparison

| Feature | Stub Models | Real Models |
|---------|------------|-------------|
| Setup time | Instant | 30-60 mins |
| Disk space | Minimal | ~20GB |
| GPU required | No | Yes (recommended) |
| Mask quality | Basic | Precise |
| Depth quality | Synthetic | ML-accurate |
| Texture quality | Procedural | Photorealistic |
| Speed | Fast (1-2s) | Moderate (20-40s) |
| Use case | Dev/Testing | Production |

## Troubleshooting

### Out of Memory Errors

**Problem:** GPU runs out of VRAM

**Solutions:**
1. Use smaller batch sizes
2. Enable model CPU offloading: `pipe.enable_model_cpu_offload()`
3. Enable VAE slicing: `pipe.enable_vae_slicing()`
4. Use FP16 precision: `torch_dtype=torch.float16`

### Slow Model Loading

**Problem:** Models take too long to load

**Solutions:**
1. Keep models in memory (singleton pattern - already implemented)
2. Use SSD for model storage
3. Pre-load models at startup

### Model Download Fails

**Problem:** HuggingFace downloads timeout

**Solutions:**
1. Check internet connection
2. Manually download and place in cache:
   - HF cache: `~/.cache/huggingface/hub/`
3. Use mirror or offline mode

### CUDA Errors

**Problem:** CUDA out of memory or not available

**Solutions:**
1. Verify CUDA installation: `torch.cuda.is_available()`
2. Check GPU memory: `nvidia-smi`
3. Fall back to CPU (slower): `device="cpu"`

## Development Workflow

Recommended approach:

1. **Initial Development**
   - Use `USE_STUB_MODELS=true`
   - Rapid iteration without GPU
   - Test API integration

2. **Integration Testing**
   - Switch to `USE_STUB_MODELS=false`
   - Verify real model pipeline
   - Test with sample images

3. **Production Deployment**
   - Use `USE_STUB_MODELS=false`
   - GPU-enabled infrastructure
   - Monitor performance and costs

## Cost Considerations

### Stub Models
- Infrastructure: Minimal (standard CPU server)
- No GPU costs
- Fast response times
- Lower quality output

### Real Models
- Infrastructure: GPU instance required
- Cloud GPU: $0.50-2.00/hour
- ~30-40s per image
- Production-quality output

## Next Steps

1. Review `API_DOCUMENTATION.md` for complete API reference
2. Test with stub models first
3. When ready, follow installation steps above
4. Monitor performance and adjust as needed

## Code Comments

All stub files contain detailed comments showing:
- ✅ Where to insert real model code
- ✅ What dependencies are needed
- ✅ Example code snippets
- ✅ Expected behavior

Look for `TODO:` and `REAL IMPLEMENTATION:` comments in:
- `backend/app/ml/sam_segmentation_stub.py`
- `backend/app/ml/depth_estimation_stub.py`
- `backend/app/ml/sdxl_inpainting_stub.py`
