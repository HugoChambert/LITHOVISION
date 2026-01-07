# API Reference - AI Stone Replacement Tool

Complete reference for all APIs, edge functions, and integrations used in the application.

---

## Table of Contents

1. [Supabase Edge Functions](#supabase-edge-functions)
2. [Frontend API Client](#frontend-api-client)
3. [Database Schema](#database-schema)
4. [Storage Buckets](#storage-buckets)
5. [External APIs](#external-apis)
6. [Error Handling](#error-handling)

---

## Supabase Edge Functions

### 1. Generate Mask

**Endpoint**: `POST /functions/v1/generate-mask`

Automatically detects horizontal surfaces (countertops, tables, vanities) in uploaded images.

#### Request

```typescript
{
  image_id: string;        // Storage path to uploaded image
  auto_detect?: boolean;   // Set to true for automatic detection
  click_x?: number;        // Optional: Manual click X coordinate
  click_y?: number;        // Optional: Manual click Y coordinate
}
```

#### Response

```typescript
{
  mask_id: string;      // Storage path to generated mask
  mask_url: string;     // Public URL of mask image
  message: string;      // Success message
}
```

#### Example

```javascript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/generate-mask`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_id: 'uploads/image_123.jpg',
      auto_detect: true
    })
  }
);

const data = await response.json();
// { mask_id: "masks/mask_456.png", mask_url: "https://...", message: "..." }
```

#### Algorithm Details

The automatic detection algorithm:
1. Searches center-lower 60% of image (where countertops typically appear)
2. Evaluates each point based on:
   - **Uniformity Score**: Color consistency in horizontal direction
   - **Horizontal Bias**: More consistent horizontally than vertically
   - **Brightness Score**: Typical countertop brightness range (50-220)
3. Selects best candidate point
4. Performs adaptive flood-fill from that point
5. Applies morphological operations to clean mask
6. Removes small disconnected regions
7. Smooths edges for seamless blending

---

### 2. Process AI Image

**Endpoint**: `POST /functions/v1/process-ai-image`

Processes image with AI to replace masked surface with selected stone material.

#### Request

```typescript
{
  originalImageUrl: string;     // Public URL of original image
  maskImageUrl: string;         // Public URL of mask image
  selectedStone: {
    name: string;               // Stone name (e.g., "Carrara Marble")
    type: string;               // Type: "granite" | "marble" | "quartz"
    description: string;        // Material description
    pattern: string;            // Pattern: "veined" | "speckled" | "solid"
    color_family?: string;      // Color family: "white" | "black" | "grey" | etc.
    finish?: string;            // Finish: "polished" | "honed" | "leathered"
    texture_scale?: number;     // Scale factor (default: 1.0)
  };
  adjustments: {
    brightness: number;         // Brightness adjustment (default: 1.0)
    contrast: number;           // Contrast adjustment (default: 1.0)
    scale: number;              // Texture scale (default: 1.0)
  };
}
```

#### Response

```typescript
{
  success: boolean;                // Processing success status
  resultImageBase64: string;       // Base64-encoded result image
  message: string;                 // Status message
  appliedStone?: {                 // Applied stone details
    name: string;
    type: string;
    pattern: string;
  };
  error?: string;                  // Error message if failed
}
```

#### Example

```javascript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/process-ai-image`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SESSION_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      originalImageUrl: 'https://...supabase.co/storage/.../image.jpg',
      maskImageUrl: 'https://...supabase.co/storage/.../mask.png',
      selectedStone: {
        name: 'Carrara Marble',
        type: 'marble',
        description: 'Classic white marble',
        pattern: 'veined',
        color_family: 'white',
        finish: 'polished',
        texture_scale: 1.0
      },
      adjustments: {
        brightness: 1.0,
        contrast: 1.0,
        scale: 1.0
      }
    })
  }
);

const data = await response.json();
// { success: true, resultImageBase64: "iVBORw0KGgo...", ... }
```

#### AI Processing Details

The edge function:
1. Receives original image, mask, and stone specifications
2. Constructs detailed prompt for Azure OpenAI with:
   - Exact stone material name and type
   - Color family and pattern specifications
   - Finish type (polished, honed, etc.)
   - Lighting preservation instructions
   - Perspective and shadow requirements
3. Calls Azure OpenAI DALL-E image editing API
4. Returns base64-encoded result
5. Frontend uploads result to storage

---

## Frontend API Client

Location: `src/lib/api.ts`

### Upload Image

```typescript
async function uploadImage(
  file: File | Blob,
  filename?: string
): Promise<UploadResponse>
```

Uploads an image file to Supabase Storage.

**Returns:**
```typescript
{
  image_id: string;     // Storage path
  image_url: string;    // Public URL
  message: string;      // Success message
}
```

### Generate Auto Mask

```typescript
async function generateAutoMask(
  imageId: string
): Promise<MaskResponse>
```

Automatically detects and masks countertop surface.

**Returns:**
```typescript
{
  mask_id: string;      // Storage path to mask
  mask_url: string;     // Public URL of mask
  message: string;      // Success message
}
```

### Generate Stone Replacement

```typescript
async function generateStoneReplacement(
  imageId: string,
  maskId: string,
  stoneMaterial: StoneMaterial
): Promise<{ task_id: string }>
```

Creates a processing job and triggers AI generation.

**Returns:**
```typescript
{
  task_id: string;      // Job ID for status tracking
}
```

### Get Task Status

```typescript
async function getTaskStatus(
  taskId: string
): Promise<TaskStatus>
```

Polls job status.

**Returns:**
```typescript
{
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;      // 0-100
  result_url?: string;    // Result image URL (if completed)
  error?: string;         // Error message (if failed)
}
```

### Get Image URL

```typescript
function getImageUrl(path: string): string
```

Converts storage path to public URL.

---

## Database Schema

### material_presets

Stone material catalog.

```sql
CREATE TABLE material_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('granite', 'marble', 'quartz')),
  description TEXT,
  pattern TEXT CHECK (pattern IN ('veined', 'speckled', 'solid', 'mixed')),
  color_family TEXT,
  finish TEXT DEFAULT 'polished',
  texture_scale NUMERIC DEFAULT 1.0,
  image_url TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  price NUMERIC(10,2),
  stock_quantity INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Anyone can read active materials
- Only admins can insert/update/delete

### processing_jobs

Tracks AI processing jobs.

```sql
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  image_id TEXT NOT NULL,
  mask_id TEXT NOT NULL,
  stone_material JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  result_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Users can read own jobs
- System can create/update jobs

### admin_users

Admin authentication.

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_materials BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Admins can read own data
- No public access

### user_sessions

Session tracking for anonymous users.

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  data JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### shared_projects

Project sharing.

```sql
CREATE TABLE shared_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  project_data JSONB NOT NULL,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Storage Buckets

### stone-images

Public bucket for all images.

**Folder Structure:**
```
stone-images/
├── uploads/          # User-uploaded original images
├── masks/            # Generated surface masks
├── results/          # AI-processed result images
└── materials/        # Stone material reference images
```

**Policies:**
- Anyone can read
- Authenticated users can upload
- Files auto-delete after 7 days (configurable)

**File Naming Convention:**
```
uploads/image_{timestamp}_{random}.jpg
masks/mask_{timestamp}_{random}.png
results/result_{timestamp}_{random}.png
```

---

## External APIs

### Azure OpenAI

**Base URL**: `https://{resource-name}.openai.azure.com`

**Endpoint**: `/openai/deployments/{deployment-name}/images/edits`

**API Version**: `2024-02-01`

**Authentication**: API Key in `api-key` header

**Request Format**: `multipart/form-data`
- `image`: Original image file (PNG)
- `mask`: Mask image file (PNG)
- `prompt`: Text prompt with stone specifications
- `n`: Number of images (always 1)
- `size`: Image size (1024x1024)

**Response Format**:
```json
{
  "data": [
    {
      "url": "https://...download-url..."
    }
  ]
}
```

**Rate Limits**:
- Standard: 60 requests/minute
- Varies by region and subscription

**Error Codes**:
- `400`: Invalid request
- `401`: Invalid API key
- `404`: Deployment not found
- `429`: Rate limit exceeded
- `500`: Server error

---

## Error Handling

### Client-Side Errors

All API functions throw descriptive errors:

```typescript
try {
  const mask = await generateAutoMask(imageId);
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    // Display to user via toast notification
  }
}
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to upload image" | File too large or network issue | Check file size (<4MB), retry |
| "Failed to auto-detect surface" | No clear countertop in image | Use different angle/lighting |
| "Azure OpenAI credentials not configured" | Missing env variables | Configure edge function secrets |
| "Azure OpenAI API error: 404" | Wrong deployment name | Verify deployment exists |
| "Processing job failed" | AI processing error | Check logs, retry with different stone |

### Error Response Format

Edge functions return consistent error format:

```json
{
  "error": "Descriptive error message",
  "success": false
}
```

HTTP Status Codes:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized
- `404`: Resource not found
- `500`: Server error

---

## Rate Limiting

### Current Limits

- **Supabase Storage**: 50 MB/s upload
- **Edge Functions**: 50 requests/second
- **Azure OpenAI**: 60 requests/minute (varies by tier)

### Recommended Client-Side Throttling

```typescript
// Debounce rapid requests
const debouncedProcess = debounce(processImage, 500);

// Queue multiple stones sequentially
for (const stone of stones) {
  await processStone(stone);
  await delay(1000); // 1 second between requests
}
```

---

## WebSocket Subscriptions (Future)

For real-time job status updates:

```typescript
const channel = supabase
  .channel('processing-jobs')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'processing_jobs',
      filter: `id=eq.${jobId}`
    },
    (payload) => {
      console.log('Job updated:', payload.new);
      updateUI(payload.new.status, payload.new.progress);
    }
  )
  .subscribe();
```

---

## Testing APIs

### Test Edge Functions Locally

```bash
# Start Supabase locally
supabase start

# Serve edge function
supabase functions serve generate-mask

# Test with curl
curl -X POST \
  http://localhost:54321/functions/v1/generate-mask \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"image_id":"test.jpg","auto_detect":true}'
```

### Test with Postman

Import collection: `api-tests/Stone-Replacement.postman_collection.json`

Variables needed:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `TEST_IMAGE_ID`

---

## Security Considerations

### Authentication

- Edge functions verify JWT tokens
- Row Level Security enforces data isolation
- Admin endpoints require elevated permissions

### Data Sanitization

All user inputs are validated:
- File types checked before upload
- SQL injection prevented by Supabase client
- XSS prevented by React's JSX escaping

### API Keys

**Never expose:**
- `SUPABASE_SERVICE_ROLE_KEY` (backend only)
- `AZURE_OPENAI_KEY` (edge functions only)

**Safe to expose:**
- `VITE_SUPABASE_URL` (frontend)
- `VITE_SUPABASE_ANON_KEY` (frontend, rate-limited)

---

## Performance Optimization

### Caching Strategy

```typescript
// Cache stone materials in memory
const materialsCache = new Map();

async function getMaterials() {
  if (materialsCache.has('all')) {
    return materialsCache.get('all');
  }

  const materials = await fetchMaterials();
  materialsCache.set('all', materials);
  return materials;
}
```

### Image Optimization

- Use thumbnails for catalog display
- Compress uploads client-side before upload
- Lazy load preview images
- Implement progressive image loading

---

## Monitoring

### Log Important Events

```typescript
// In edge functions
console.log('Processing started:', {
  jobId,
  stoneName: selectedStone.name,
  timestamp: new Date().toISOString()
});
```

### Track Metrics

- Average processing time per stone
- Success/failure rates
- Most popular stone materials
- User session duration

---

## API Versioning

Current version: `v1`

Future versions will be namespaced:
- `/functions/v1/generate-mask`
- `/functions/v2/generate-mask` (when available)

Breaking changes will bump major version.

---

## Support

For API issues:
1. Check edge function logs in Supabase dashboard
2. Verify environment variables are set
3. Test with Postman/curl
4. Review error messages for specific guidance

For feature requests or bug reports, please open an issue on the repository.
