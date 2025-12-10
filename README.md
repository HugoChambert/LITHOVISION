# Stone Replacement Tool

An AI-powered web application for visualizing stone material replacements in kitchen and bathroom photos. Upload a photo, select the area to replace, choose from a catalog of stone materials, and generate a realistic preview using a sophisticated ML pipeline.

## Features

### Core Functionality
- **Photo Upload**: Drag-and-drop or click-to-upload interface with image preview
- **Interactive Area Selection**: Canvas-based drawing tool with brush/eraser modes for precise selection
- **Stone Material Catalog**: Filterable gallery of granite, marble, and quartz materials
- **AI Processing Pipeline**: Multi-step ML pipeline (SAM → Depth → SDXL → Color Matching)
- **Preview & Comparison**: Side-by-side comparison view with download capability

### Admin Features
- **Catalog Management**: Add, edit, and delete stone materials
- **Easy Updates**: Simple interface for updating the stone catalog without code changes
- **Material Properties**: Configure texture scale, sort order, and visibility

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Database**: Supabase (PostgreSQL)
- **Backend**: Supabase Edge Functions (Deno)
- **Styling**: Custom CSS with design system
- **AI Pipeline**: SAM, MiDaS, SDXL (integration ready)

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Header.tsx              # App header
│   │   ├── ImageUpload.tsx         # Photo upload interface
│   │   ├── AreaSelector.tsx        # Canvas-based selection tool
│   │   ├── StoneCatalog.tsx        # Material catalog display
│   │   ├── PreviewPanel.tsx        # Results preview
│   │   └── AdminPanel.tsx          # Catalog management
│   ├── lib/
│   │   └── supabase.ts             # Supabase client & types
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # App entry point
│   └── index.css                   # Global styles
├── supabase/
│   └── functions/
│       └── process-stone-replacement/
│           └── index.ts            # ML pipeline edge function
└── .env                            # Environment variables
```

## Database Schema

### stone_materials
Stores the catalog of available stone materials:
- `id` (uuid): Unique identifier
- `name` (text): Display name
- `type` (text): granite | marble | quartz
- `description` (text): Material description
- `image_url` (text): Full-size texture image
- `thumbnail_url` (text): Thumbnail for gallery
- `texture_scale` (numeric): Scale factor for ML pipeline
- `metadata` (jsonb): Additional properties
- `is_active` (boolean): Visibility toggle
- `sort_order` (integer): Display order

### user_projects
Stores user's stone replacement projects:
- `id` (uuid): Project identifier
- `user_id` (uuid): User reference
- `name` (text): Project name
- `original_image_url` (text): Uploaded photo
- `mask_data` (text): Selection mask
- `selected_stone_id` (uuid): Chosen material
- `result_image_url` (text): Generated preview
- `processing_status` (text): pending | processing | completed | failed

## ML Pipeline

The edge function orchestrates a four-step ML pipeline:

### 1. SAM Segmentation
- Refines the user-drawn mask using Segment Anything Model
- Ensures precise edge detection and area selection
- **Integration Point**: `samSegmentation()` function

### 2. Depth Estimation
- Generates depth map using MiDaS or similar model
- Provides 3D understanding for realistic texture application
- **Integration Point**: `depthEstimation()` function

### 3. SDXL Inpainting
- Applies stone texture to selected area using Stable Diffusion XL
- Uses depth map for perspective-correct texture mapping
- Respects texture scale from material properties
- **Integration Point**: `sdxlInpainting()` function

### 4. Color Matching
- Adjusts colors for seamless blending with original image
- Matches lighting and ambient conditions
- **Integration Point**: `colorMatching()` function

## Integrating Real ML APIs

The ML pipeline functions are currently placeholders. To integrate real ML models:

### Option 1: Replicate API

```typescript
// In supabase/functions/process-stone-replacement/index.ts

async function samSegmentation(imageUrl: string, maskData: string): Promise<string> {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${Deno.env.get('REPLICATE_API_TOKEN')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'sam-model-version-id',
      input: {
        image: imageUrl,
        mask: maskData,
      },
    }),
  });

  const result = await response.json();
  return result.output;
}
```

### Option 2: Hugging Face API

```typescript
async function depthEstimation(imageUrl: string): Promise<string> {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/Intel/dpt-large',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('HF_API_TOKEN')}`,
      },
      body: imageUrl,
    }
  );

  const blob = await response.blob();
  return blob;
}
```

### Option 3: Custom Hosted Models

Deploy your own models using:
- Modal.com
- RunPod
- AWS SageMaker
- Google Cloud AI Platform

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are pre-configured in `.env`

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Usage

### For End Users

1. **Upload Photo**: Click or drag-and-drop a photo of your kitchen/bathroom
2. **Select Area**: Use the brush tool to paint over the stone surface to replace
3. **Choose Stone**: Browse and select from the material catalog
4. **View Preview**: Compare original vs. preview and download the result

### For Administrators

1. Click the **Admin** button in the top-right corner
2. Add new materials by providing:
   - Name, type, and description
   - Image URL (use stock photos from Pexels)
   - Optional thumbnail URL
   - Texture scale and sort order
3. Edit existing materials by clicking **Edit**
4. Delete materials that are no longer needed

## Adding Stone Materials

To add new stone materials to the catalog:

### Via Admin UI
1. Click **Admin** in the top-right
2. Click **Add New Stone**
3. Fill in the form and submit

### Via Database
```sql
INSERT INTO stone_materials (name, type, description, image_url, thumbnail_url, sort_order)
VALUES (
  'Calacatta Marble',
  'marble',
  'Luxurious white marble with bold gold veining',
  'https://images.pexels.com/photos/xxx/pexels-photo-xxx.jpeg',
  'https://images.pexels.com/photos/xxx/pexels-photo-xxx.jpeg?w=200',
  10
);
```

## Customization

### Changing Colors
Edit CSS custom properties in `src/index.css`:

```css
:root {
  --color-primary: #0366d6;      /* Primary blue */
  --color-success: #28a745;      /* Success green */
  --color-error: #d73a49;        /* Error red */
  /* ... */
}
```

### Adjusting Workflow Steps
Modify the workflow in `src/App.tsx`:

```typescript
type Step = 'upload' | 'select' | 'choose-stone' | 'preview';
```

## Security

- Row Level Security (RLS) enabled on all tables
- Public read access to active stone materials
- Admin-only write access (requires role in user metadata)
- User projects are isolated by user_id
- Edge functions verify JWT tokens

## Performance

- Optimized image loading with thumbnails
- Lazy loading for catalog images
- Canvas-based selection for smooth interaction
- Edge functions for serverless ML processing

## Future Enhancements

- [ ] Multiple selection areas
- [ ] Undo/redo for area selection
- [ ] Real-time collaboration
- [ ] Save projects to user account
- [ ] Mobile app version
- [ ] Augmented reality preview
- [ ] Video support
- [ ] Batch processing

## License

ISC

## Support

For issues and questions, please check the documentation or contact support.
