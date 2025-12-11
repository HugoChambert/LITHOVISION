# Stone Replacement Tool

A production-ready web application for visualizing stone material replacements in kitchen and bathroom photos. Upload a photo, select the area to replace, and choose from a catalog of stone materials.

## ✨ Production Ready

This application is **fully serverless** and ready to deploy to Netlify, Vercel, or any static hosting platform. No GPU servers, Docker, or complex infrastructure required.

## ⚡ Quick Setup Summary

**What you need:**
- ✅ Supabase (already configured)
- ⚠️ **Azure OpenAI** - Required for AI image editing ([Get started →](#2-azure-openai-required-for-ai-processing-️))
- 🔧 Replicate API - Optional, improves detection ([Get started →](#3-replicate-api-optional-for-enhanced-detection-))

**Setup time:** ~10 minutes for Azure OpenAI, 2 minutes for Replicate (optional)

## Features

### Core Functionality
- **Photo Upload**: Drag-and-drop or click-to-upload with Supabase Storage
- **Interactive Area Selection**: Canvas-based drawing tool with brush/eraser modes
- **Stone Material Catalog**: Filterable gallery of granite, marble, and quartz materials
- **Job Tracking**: Database-backed processing status tracking
- **Preview & Comparison**: Side-by-side comparison view with download capability

### Admin Features
- **Catalog Management**: Add, edit, and delete stone materials
- **Secure Access**: Admin authentication with session management
- **Material Properties**: Configure texture scale, sort order, and visibility

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Styling**: Custom CSS with design system
- **AI Integration**: Azure OpenAI (Microsoft Copilot Designer) for image editing
- **Responsive Design**: Mobile, tablet, and desktop optimized

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (already configured)
- **Azure OpenAI account** (required for AI features)
- Replicate account (optional, for enhanced detection)

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Configure APIs** ⚠️ IMPORTANT

   Before the app will work, you need to set up Azure OpenAI:

   a. Create Azure OpenAI resource at [portal.azure.com](https://portal.azure.com)
   b. Deploy a DALL-E model
   c. Add credentials to Supabase:
      - Go to Supabase Dashboard → Edge Functions → Settings
      - Add environment variables:
        ```
        AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com
        AZURE_OPENAI_KEY=your-api-key
        AZURE_OPENAI_DEPLOYMENT=dall-e-3
        ```

   **Optional**: Add Replicate API for better detection:
   ```
   REPLICATE_API_TOKEN=r8_your_token
   ```

   📖 See [Required APIs & Configuration](#required-apis--configuration) section below for detailed steps.

3. **Start development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
```

### Admin Access
Press `Ctrl + Shift + A` to access the admin panel and manage the stone catalog.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Quick Deploy:**
- [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)
- [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

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

## Required APIs & Configuration

This application requires external APIs to function. Here's what you need to set up:

### 1. Supabase (Already Configured) ✅

Your Supabase project is already configured in the `.env` file:
- Database for stone catalog and project tracking
- Storage for images and masks
- Edge Functions for serverless processing

**No action needed** - this is ready to use.

---

### 2. Azure OpenAI (REQUIRED for AI Processing) ⚠️

**Status**: Required for stone replacement functionality

Azure OpenAI powers the intelligent image editing that replaces stone materials while preserving lighting and perspective.

#### Setup Instructions:

1. **Create Azure OpenAI Resource**
   - Go to [Azure Portal](https://portal.azure.com)
   - Create a new "Azure OpenAI" resource
   - Wait for deployment (5-10 minutes)

2. **Deploy DALL-E Model**
   - Navigate to Azure OpenAI Studio
   - Go to "Deployments" → "Create new deployment"
   - Select model: `dall-e-3` or `dall-e-2`
   - Name your deployment (e.g., `dall-e-3`)

3. **Get Your Credentials**
   - Go to your Azure OpenAI resource
   - Click "Keys and Endpoint"
   - Copy:
     - Endpoint URL (e.g., `https://YOUR-RESOURCE.openai.azure.com`)
     - API Key (Key 1)

4. **Configure Supabase Edge Functions**

   Add these environment variables to your Supabase project:

   ```bash
   # Go to: Supabase Dashboard → Edge Functions → Settings
   AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com
   AZURE_OPENAI_KEY=your-api-key-here
   AZURE_OPENAI_DEPLOYMENT=dall-e-3
   ```

#### Cost Estimate:
- DALL-E 3: ~$0.04-0.08 per image generation
- DALL-E 2: ~$0.02 per image generation

📖 **Detailed Guide**: See [AZURE_OPENAI_SETUP.md](./AZURE_OPENAI_SETUP.md)

---

### 3. Replicate API (OPTIONAL for Enhanced Detection) 🔧

**Status**: Optional enhancement - improves area detection quality

Replicate provides SAM (Segment Anything Model) for AI-powered area detection. Without this, the system uses a smart fallback algorithm.

#### Setup Instructions:

1. **Create Replicate Account**
   - Go to [replicate.com](https://replicate.com)
   - Sign up for free account

2. **Get API Token**
   - Go to Account Settings → API Tokens
   - Create a new token
   - Copy the token (starts with `r8_`)

3. **Add to Supabase Edge Functions**

   ```bash
   # Go to: Supabase Dashboard → Edge Functions → Settings
   REPLICATE_API_TOKEN=r8_your_token_here
   ```

#### Cost Estimate:
- SAM Model: ~$0.0005-0.001 per detection
- Free tier: $10 credit (≈10,000 detections)

#### Benefits:
- **With Replicate**: Professional-grade object segmentation, handles complex textures
- **Without Replicate**: Smart algorithm with adaptive tolerance (works well for most cases)

---

### API Configuration Checklist

Before deploying to production, ensure you have:

- [x] **Supabase** - Pre-configured in `.env`
- [ ] **Azure OpenAI** - Required for AI image editing
  - [ ] Resource created
  - [ ] DALL-E model deployed
  - [ ] Credentials added to Supabase Edge Functions
- [ ] **Replicate** (Optional) - Enhanced area detection
  - [ ] Account created
  - [ ] API token generated
  - [ ] Token added to Supabase Edge Functions

---

### Alternative AI Services

While Azure OpenAI is the default, you can modify the edge functions to use:

1. **OpenAI API** (Direct)
   - Endpoint: `api.openai.com`
   - Models: DALL-E 2/3
   - Pricing: Similar to Azure

2. **Stability AI**
   - For Stable Diffusion inpainting
   - Lower cost alternative
   - Requires code modifications

3. **Self-Hosted ML** (For high volume)
   - Deploy `/backend` directory to GPU server
   - Full SAM + MiDaS + SDXL pipeline
   - See `backend/README.md` for details

---

## How It Works

### AI Processing Pipeline

1. **User clicks on surface** → `generate-mask` edge function
   - If Replicate configured: SAM detects entire surface
   - If not: Smart algorithm with adaptive tolerance

2. **User selects stone material** → `process-ai-image` edge function
   - Azure OpenAI DALL-E replaces the masked area
   - Preserves lighting, shadows, and perspective
   - Returns processed image

3. **Results displayed** → User can compare and download

## Responsive Design

The application is fully responsive and optimized for all screen sizes:

- **Desktop** (1024px+): Full multi-column layouts with side panels
- **Tablet** (768px-1024px): Adjusted layouts with stacked sections
- **Mobile** (640px-768px): Single-column layouts, full-width buttons
- **Small Mobile** (480px-640px): Compact UI, optimized touch targets

All components adapt seamlessly across devices with proper spacing, typography, and interactive elements.

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
