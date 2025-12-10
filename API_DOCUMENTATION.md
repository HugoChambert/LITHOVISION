# Stone Replacement API Documentation

## Overview

The Stone Replacement API provides endpoints for AI-powered stone material replacement in interior design images. The API supports both real ML models and stubbed placeholder implementations for development and testing.

## Configuration

### Using Stub vs Real Models

Set in `.env` file or environment variables:

```bash
# Use stub models (default, works without ML dependencies)
USE_STUB_MODELS=true

# Use real ML models (requires model downloads and GPU recommended)
USE_STUB_MODELS=false
```

### Real Model Requirements

When `USE_STUB_MODELS=false`, you need:

1. **SAM (Segment Anything)**
   - Download: https://github.com/facebookresearch/segment-anything
   - Model: `sam_vit_h_4b8939.pth` (~2.4GB)
   - Place in: `/app/models/`
   - Install: `pip install segment-anything`

2. **DPT Depth Estimation**
   - Auto-downloads from HuggingFace on first run (~1.3GB)
   - Install: `pip install transformers torch`

3. **SDXL Inpainting**
   - Auto-downloads from HuggingFace on first run (~13GB)
   - Install: `pip install diffusers transformers accelerate`
   - Requires: GPU with 8GB+ VRAM recommended

## API Endpoints

### Base URL
```
http://localhost:8000/api
```

---

### 1. Upload Image

Upload an image for processing.

**Endpoint:** `POST /upload`

**Request:**
- Content-Type: `multipart/form-data`
- Body: File upload (JPG, PNG)

**Response:**
```json
{
  "image_id": "uuid-string",
  "image_url": "/uploads/{image_id}.jpg",
  "message": "Image uploaded successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@kitchen.jpg"
```

---

### 2. Generate Mask

Generate segmentation mask for selected area (currently uses center point).

**Endpoint:** `POST /mask`

**Request:**
```json
{
  "image_id": "uuid-from-upload"
}
```

**Response:**
```json
{
  "mask_id": "uuid-string",
  "mask_url": "/uploads/{mask_id}.png",
  "message": "Mask generated successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/mask \
  -H "Content-Type: application/json" \
  -d '{"image_id": "abc-123"}'
```

**Note:** Real SAM implementation provides precise edge detection. Stub version creates basic morphological masks.

---

### 3. Generate Depth Map

Estimate depth map from image.

**Endpoint:** `POST /depth`

**Request:**
```json
{
  "image_id": "uuid-from-upload"
}
```

**Response:**
```json
{
  "depth_id": "uuid-string",
  "depth_url": "/uploads/{depth_id}_depth.png",
  "message": "Depth map generated successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/depth \
  -H "Content-Type: application/json" \
  -d '{"image_id": "abc-123"}'
```

**Note:** Real DPT model provides ML-based depth estimation. Stub version uses edge detection.

---

### 4. Get Material Presets

Retrieve available stone material presets from database.

**Endpoint:** `GET /materials`

**Query Parameters:**
- `type` (optional): Filter by material type (granite, marble, quartz, etc.)
- `color_family` (optional): Filter by color (white, black, gray, beige, etc.)

**Response:**
```json
{
  "materials": [
    {
      "id": "uuid",
      "name": "Carrara Marble",
      "type": "marble",
      "description": "Classic white Carrara marble with delicate gray veining...",
      "color_family": "white",
      "pattern": "veined",
      "finish": "polished",
      "texture_scale": 1.0,
      "preview_image_url": null,
      "is_active": true,
      "metadata": {
        "origin": "Italy",
        "hardness": "medium"
      }
    }
  ],
  "count": 12
}
```

**Examples:**
```bash
# Get all materials
curl http://localhost:8000/api/materials

# Get only marble
curl http://localhost:8000/api/materials?type=marble

# Get white materials
curl http://localhost:8000/api/materials?color_family=white
```

---

### 5. Get Single Material

Get details for a specific material preset.

**Endpoint:** `GET /materials/{material_id}`

**Response:**
```json
{
  "id": "uuid",
  "name": "Carrara Marble",
  "type": "marble",
  "description": "Classic white Carrara marble...",
  "color_family": "white",
  "pattern": "veined",
  "finish": "polished",
  "texture_scale": 1.0,
  "preview_image_url": null,
  "is_active": true,
  "metadata": {}
}
```

---

### 6. Get Material Types

Get list of available material types.

**Endpoint:** `GET /materials/types/list`

**Response:**
```json
{
  "types": [
    "concrete",
    "granite",
    "marble",
    "quartz",
    "quartzite",
    "soapstone"
  ],
  "count": 6
}
```

---

### 7. Generate Stone Replacement

Start async processing to replace stone material in masked area.

**Endpoint:** `POST /generate`

**Request:**
```json
{
  "image_id": "uuid-from-upload",
  "mask_id": "uuid-from-mask",
  "stone_material": {
    "id": "material-uuid",
    "name": "Carrara Marble",
    "type": "marble",
    "description": "Classic white Carrara marble...",
    "color_family": "white",
    "pattern": "veined",
    "finish": "polished"
  },
  "scale": 1.0,
  "orientation": 0
}
```

**Response:**
```json
{
  "task_id": "celery-task-id",
  "status": "queued",
  "message": "Generation started"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "image_id": "abc-123",
    "mask_id": "def-456",
    "stone_material": {
      "name": "Carrara Marble",
      "type": "marble",
      "description": "Classic white Carrara marble with gray veining"
    },
    "scale": 1.2,
    "orientation": 45
  }'
```

**Processing Pipeline:**

1. **Mask Refinement (SAM)**
   - Real: Uses SAM for precise edge detection
   - Stub: Basic morphological operations

2. **Depth Estimation (DPT)**
   - Real: ML-based depth prediction
   - Stub: Edge-based synthetic depth

3. **Texture Generation (SDXL)**
   - Real: AI-generated photorealistic stone texture
   - Stub: Procedural texture based on material properties

4. **Post-Processing**
   - Color histogram preservation
   - Brightness matching in LAB color space
   - Multi-scale edge blending
   - Detail enhancement

---

### 8. Check Task Status

Poll for async task completion status.

**Endpoint:** `GET /status/{task_id}`

**Response (Processing):**
```json
{
  "task_id": "celery-task-id",
  "status": "processing",
  "progress": 50,
  "current_step": "Generating stone texture with SDXL"
}
```

**Response (Complete):**
```json
{
  "task_id": "celery-task-id",
  "status": "completed",
  "progress": 100,
  "result_url": "/uploads/result-uuid_result.jpg"
}
```

**Response (Failed):**
```json
{
  "task_id": "celery-task-id",
  "status": "failed",
  "error": "Error message"
}
```

**Example:**
```bash
curl http://localhost:8000/api/status/celery-task-id
```

---

### 9. Get Result Image

Download the final processed image.

**Endpoint:** `GET /result/{task_id}`

**Response:** Image file (JPEG)

**Example:**
```bash
curl http://localhost:8000/api/result/celery-task-id \
  --output result.jpg
```

---

### 10. Get Uploaded File

Retrieve any uploaded file (images, masks, depth maps).

**Endpoint:** `GET /uploads/{filename}`

**Response:** File content

**Example:**
```bash
curl http://localhost:8000/api/uploads/abc-123.jpg \
  --output original.jpg
```

---

## Complete Workflow Example

```bash
# 1. Upload image
UPLOAD_RESPONSE=$(curl -X POST http://localhost:8000/api/upload \
  -F "file=@kitchen.jpg")
IMAGE_ID=$(echo $UPLOAD_RESPONSE | jq -r '.image_id')

# 2. Generate mask
MASK_RESPONSE=$(curl -X POST http://localhost:8000/api/mask \
  -H "Content-Type: application/json" \
  -d "{\"image_id\": \"$IMAGE_ID\"}")
MASK_ID=$(echo $MASK_RESPONSE | jq -r '.mask_id')

# 3. Get material presets
MATERIALS=$(curl http://localhost:8000/api/materials?type=marble)

# 4. Start generation
GENERATE_RESPONSE=$(curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"image_id\": \"$IMAGE_ID\",
    \"mask_id\": \"$MASK_ID\",
    \"stone_material\": {
      \"name\": \"Carrara Marble\",
      \"type\": \"marble\",
      \"description\": \"Classic white Carrara marble with gray veining\",
      \"color_family\": \"white\",
      \"pattern\": \"veined\"
    },
    \"scale\": 1.0,
    \"orientation\": 0
  }")
TASK_ID=$(echo $GENERATE_RESPONSE | jq -r '.task_id')

# 5. Poll status
while true; do
  STATUS=$(curl http://localhost:8000/api/status/$TASK_ID)
  STATE=$(echo $STATUS | jq -r '.status')
  if [ "$STATE" = "completed" ]; then
    break
  fi
  sleep 2
done

# 6. Download result
curl http://localhost:8000/api/result/$TASK_ID --output result.jpg
```

---

## Error Responses

All endpoints return standard HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "detail": "Error message description"
}
```

---

## Model Implementation Notes

### When to Use Stub Models

✅ **Use Stubs When:**
- Developing/testing API integration
- No GPU available
- Rapid prototyping
- CI/CD pipelines
- Cost-sensitive environments

### When to Use Real Models

✅ **Use Real Models When:**
- Production deployment
- Need photorealistic results
- Have GPU resources
- Final quality matters

### Switching Between Modes

No code changes needed - just set environment variable:

```bash
# Development
export USE_STUB_MODELS=true

# Production
export USE_STUB_MODELS=false
```

All API routes work identically in both modes.

---

## Material Preset Structure

Material presets in the database include:

- **name**: Display name
- **type**: Material category (granite, marble, quartz, etc.)
- **description**: Detailed description for SDXL prompt generation
- **color_family**: Primary color (white, black, gray, beige, brown, green, blue, red)
- **pattern**: Pattern type (veined, speckled, solid, crystalline, textured)
- **finish**: Surface finish (polished, honed, leathered)
- **texture_scale**: Default scale multiplier
- **preview_image_url**: Optional preview image
- **metadata**: Additional properties (origin, hardness, use cases, etc.)

These presets are used to generate optimal prompts for SDXL and guide procedural texture generation in stub mode.
