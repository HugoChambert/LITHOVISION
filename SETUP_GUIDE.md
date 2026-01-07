# Complete Setup Guide - AI Stone Replacement Tool

This guide provides **exact step-by-step instructions** to set up and run the AI-powered stone replacement tool in production.

## Overview

This application allows users to:
1. Upload a photo of their kitchen/bathroom
2. Choose from a catalog of stone materials
3. Get AI-generated previews showing how their space would look with the selected stone

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Database + Storage + Edge Functions)
- **AI Processing**: Azure OpenAI (DALL-E) or OpenAI API
- **Automatic Surface Detection**: Custom algorithm in Supabase Edge Functions

---

## Prerequisites

Before starting, ensure you have:

- [Node.js](https://nodejs.org/) v18 or higher installed
- A [Supabase](https://supabase.com/) account (free tier works)
- Either:
  - An [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) account with DALL-E access, OR
  - An [OpenAI](https://platform.openai.com/) account with API access
- Git installed

---

## Part 1: Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in or create an account
4. Click "New Project"
5. Fill in project details:
   - **Name**: `stone-replacement-tool` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for testing
6. Click "Create new project"
7. Wait 2-3 minutes for project provisioning

### Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### Step 3: Run Database Migrations

1. Clone this repository:
```bash
git clone <repository-url>
cd stone-replacement-tool
```

2. Install Supabase CLI:
```bash
npm install -g supabase
```

3. Link to your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```
(Your project ref is the subdomain from your Project URL: `https://YOUR_PROJECT_REF.supabase.co`)

4. Push database migrations:
```bash
supabase db push
```

This creates all necessary tables:
- `stone_materials` - Stone material catalog
- `material_presets` - Pre-configured stone options
- `admin_users` - Admin authentication
- `processing_jobs` - Job tracking
- `user_sessions` - User session management
- `shared_projects` - Project sharing

### Step 4: Set Up Storage Buckets

The migrations automatically create the `stone-images` bucket. Verify it exists:

1. In Supabase dashboard, go to **Storage**
2. You should see a `stone-images` bucket
3. Click on the bucket and verify these folders exist:
   - `uploads/` - Original user images
   - `masks/` - Surface detection masks
   - `results/` - AI-generated results
   - `materials/` - Stone material images

### Step 5: Populate Stone Materials Database

1. In Supabase dashboard, go to **SQL Editor**
2. Run this query to add sample stone materials:

```sql
-- Insert sample stone materials
INSERT INTO material_presets (name, type, description, pattern, color_family, finish, texture_scale, is_active, price)
VALUES
  ('Carrara Marble', 'marble', 'Classic white marble with grey veining', 'veined', 'white', 'polished', 1.0, true, 150.00),
  ('Calacatta Gold', 'marble', 'Luxurious white marble with bold gold veining', 'veined', 'white', 'polished', 1.0, true, 250.00),
  ('Black Galaxy Granite', 'granite', 'Deep black with metallic gold specks', 'speckled', 'black', 'polished', 1.0, true, 180.00),
  ('White Ice Granite', 'granite', 'White background with grey and black crystals', 'speckled', 'white', 'polished', 1.0, true, 120.00),
  ('Absolute Black Granite', 'granite', 'Pure solid black granite', 'solid', 'black', 'polished', 1.0, true, 100.00),
  ('Kashmir White Granite', 'granite', 'White with black and burgundy specks', 'speckled', 'white', 'polished', 1.0, true, 140.00),
  ('Emerald Pearl Granite', 'granite', 'Dark green with metallic flecks', 'speckled', 'green', 'polished', 1.0, true, 160.00),
  ('Pietra Grey Quartz', 'quartz', 'Modern grey with subtle white veining', 'veined', 'grey', 'polished', 1.0, true, 110.00),
  ('Statuario Quartz', 'quartz', 'White with dramatic grey veining', 'veined', 'white', 'polished', 1.0, true, 130.00),
  ('Noir Quartz', 'quartz', 'Solid black quartz', 'solid', 'black', 'polished', 1.0, true, 90.00);
```

---

## Part 2: AI Service Setup (Choose One)

You must configure **either** Azure OpenAI **or** OpenAI API.

### Option A: Azure OpenAI (Recommended for Production)

#### Step 1: Create Azure OpenAI Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Azure OpenAI"
4. Click "Create"
5. Fill in details:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Create new or select existing
   - **Region**: Choose one with DALL-E availability (e.g., East US, Sweden Central)
   - **Name**: `stone-replacement-openai` (or your preferred name)
   - **Pricing tier**: Standard S0
6. Click "Review + Create" → "Create"
7. Wait for deployment (takes 2-3 minutes)

#### Step 2: Deploy DALL-E Model

1. Go to your Azure OpenAI resource
2. Click "Go to Azure OpenAI Studio" or navigate to [oai.azure.com](https://oai.azure.com)
3. Select your resource
4. Go to **Deployments** → **Create new deployment**
5. Configure deployment:
   - **Model**: Select "dall-e-3" (or "dall-e-2" if dall-e-3 unavailable)
   - **Deployment name**: `dall-e-3` (remember this exact name!)
   - **Content filter**: Default
6. Click "Create"
7. Wait for deployment (1-2 minutes)

#### Step 3: Get API Credentials

1. In Azure OpenAI Studio, click on your deployment
2. Click "View Code" or go to resource → "Keys and Endpoint"
3. Copy these values:
   - **Endpoint**: `https://YOUR-RESOURCE-NAME.openai.azure.com`
   - **Key**: Copy Key 1 or Key 2
   - **Deployment Name**: The name you used (e.g., `dall-e-3`)

#### Step 4: Configure Supabase Edge Functions

1. In Supabase dashboard, go to **Edge Functions** → **Manage secrets**
2. Add these environment variables:

```
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE-NAME.openai.azure.com
AZURE_OPENAI_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT=dall-e-3
```

### Option B: OpenAI API (Alternative)

#### Step 1: Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create account
3. Go to **API Keys**
4. Click "Create new secret key"
5. Name it "Stone Replacement Tool"
6. Copy the key (starts with `sk-`)

#### Step 2: Modify Edge Function

Edit `supabase/functions/process-ai-image/index.ts`:

```typescript
// Replace Azure OpenAI code (lines 42-48) with:
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

if (!openaiApiKey) {
  throw new Error("OpenAI API key not configured");
}

// Replace Azure API call (lines 91-106) with:
const apiUrl = "https://api.openai.com/v1/images/edits";

const response = await fetch(apiUrl, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${openaiApiKey}`,
  },
  body: formData,
});
```

#### Step 3: Configure Environment Variable

In Supabase dashboard, go to **Edge Functions** → **Manage secrets**:

```
OPENAI_API_KEY=sk-your-api-key-here
```

---

## Part 3: Deploy Edge Functions

Edge functions handle automatic surface detection and AI image processing.

### Step 1: Deploy All Edge Functions

```bash
cd stone-replacement-tool

# Deploy mask generation function (automatic surface detection)
supabase functions deploy generate-mask

# Deploy AI image processing function
supabase functions deploy process-ai-image
```

### Step 2: Verify Deployment

1. In Supabase dashboard, go to **Edge Functions**
2. You should see:
   - ✅ `generate-mask`
   - ✅ `process-ai-image`
3. Both should show "Status: Active"

---

## Part 4: Frontend Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

1. Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual Supabase credentials from Part 1, Step 2.

### Step 3: Build Frontend

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Step 4: Test Locally

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Part 5: Create Admin User

Admin users can manage the stone catalog.

### Step 1: Create Admin Account

1. In Supabase dashboard, go to **SQL Editor**
2. Run this query (replace with your desired username/email):

```sql
-- Create admin user
INSERT INTO admin_users (username, email, password_hash, is_active, can_manage_users, can_manage_materials)
VALUES (
  'admin',
  'admin@example.com',
  crypt('YourSecurePassword123!', gen_salt('bf')),
  true,
  true,
  true
);
```

### Step 2: Access Admin Panel

1. In the app, press **Ctrl + Shift + A**
2. Login with your credentials
3. You can now manage stone materials and view all processing jobs

---

## Part 6: Production Deployment

### Option A: Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow prompts and deploy

### Option B: Deploy to Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build and deploy:
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Option C: Deploy to Any Static Host

After running `npm run build`, upload the contents of the `dist/` folder to:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- GitHub Pages
- Any static hosting service

---

## How It Works - Complete Workflow

### User Flow:

1. **Upload Photo**
   - User uploads kitchen/bathroom image
   - Image stored in Supabase Storage (`uploads/` folder)
   - Automatic surface detection triggered

2. **Automatic Surface Detection**
   - Edge function `generate-mask` analyzes image
   - Detects horizontal surfaces (countertops, tables, vanities)
   - Uses color consistency, horizontal patterns, and brightness analysis
   - Generates mask and stores in `masks/` folder

3. **Choose Stone**
   - User browses stone material catalog
   - Can select multiple stones to compare
   - Stones loaded from `material_presets` table

4. **AI Processing**
   - For each selected stone:
     - Edge function `process-ai-image` called
     - Azure OpenAI/OpenAI receives:
       - Original image
       - Surface mask
       - Stone specifications (type, color, pattern, finish)
     - AI generates edited image with stone applied
     - Result stored in `results/` folder
   - Results displayed in preview panel

5. **Preview & Save**
   - User views before/after comparison
   - Can zoom, share, or save to gallery
   - Projects saved to database if user is signed in

### Technical Flow:

```
Upload → Storage → Auto-detect → Generate Mask → Choose Stone →
AI Process → Store Result → Display Preview
```

---

## API Endpoints Used

### Edge Functions:

1. **`/functions/v1/generate-mask`**
   - Method: POST
   - Body: `{ image_id: string, auto_detect: true }`
   - Returns: `{ mask_id: string, mask_url: string }`

2. **`/functions/v1/process-ai-image`**
   - Method: POST
   - Body: `{ originalImageUrl, maskImageUrl, selectedStone, adjustments }`
   - Returns: `{ success: boolean, resultImageBase64: string }`

### Supabase Storage:

- Bucket: `stone-images`
- Public URL: `https://PROJECT_REF.supabase.co/storage/v1/object/public/stone-images/`

### Database Tables:

- `material_presets` - Stone catalog
- `processing_jobs` - Job tracking
- `admin_users` - Admin authentication
- `user_sessions` - Session management

---

## Environment Variables Reference

### Frontend (.env):
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Edge Functions (Supabase Dashboard):

**For Azure OpenAI:**
```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=dall-e-3
```

**OR for OpenAI API:**
```env
OPENAI_API_KEY=sk-your-api-key
```

---

## Testing the Application

### Test 1: Upload and Auto-Detection

1. Open the app
2. Click "Upload Photo"
3. Upload a kitchen/bathroom image with visible countertop
4. System should automatically detect the surface
5. You'll be taken directly to stone selection

### Test 2: Stone Replacement

1. Select 2-3 different stones from catalog
2. Click "Generate Previews"
3. Wait for AI processing (15-30 seconds per stone)
4. View results in before/after slider

### Test 3: Admin Panel

1. Press Ctrl + Shift + A
2. Login with admin credentials
3. Add/edit stone materials
4. View processing jobs

---

## Troubleshooting

### Issue: "Failed to auto-detect surface"

**Solution:**
- Ensure image has clear, visible countertop/surface
- Try images with good lighting
- Surface should be in center-lower portion of image

### Issue: "Azure OpenAI credentials not configured"

**Solution:**
- Check environment variables in Supabase Edge Functions
- Verify variable names are exact (case-sensitive)
- Redeploy edge functions after updating variables

### Issue: "Processing job failed"

**Solution:**
- Check AI service quota/billing
- Verify API keys are valid
- Check Supabase Edge Function logs
- Ensure images are under 4MB

### Issue: Build errors with TypeScript

**Solution:**
```bash
npm install
npm run build
```

### Issue: CORS errors

**Solution:**
- All edge functions have CORS headers configured
- Check that `VITE_SUPABASE_URL` is correct in `.env`
- Clear browser cache and reload

---

## Production Checklist

Before going live, ensure:

- ✅ All database migrations applied
- ✅ Storage buckets created and configured
- ✅ Edge functions deployed and active
- ✅ AI service (Azure OpenAI or OpenAI) configured
- ✅ Environment variables set correctly
- ✅ Admin user created
- ✅ Sample stone materials added to database
- ✅ Frontend built and deployed
- ✅ SSL certificate configured (handled by hosting provider)
- ✅ Error logging and monitoring set up
- ✅ Backup strategy in place for database
- ✅ Rate limiting configured (if needed)
- ✅ Terms of service and privacy policy added

---

## Monitoring and Logs

### View Edge Function Logs:

1. Supabase Dashboard → Edge Functions
2. Click on function name
3. View "Logs" tab
4. Filter by error, info, etc.

### Monitor Database Usage:

1. Supabase Dashboard → Database
2. View usage statistics
3. Monitor query performance

### Track Processing Jobs:

Query the database:
```sql
SELECT * FROM processing_jobs
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

---

## Cost Estimates

### Supabase (Free Tier):
- Database: 500 MB
- Storage: 1 GB
- Edge Function Invocations: 500K/month
- Sufficient for 1,000-5,000 users/month

### Azure OpenAI:
- DALL-E 3: ~$0.04 per image
- 1,000 images = ~$40/month
- 10,000 images = ~$400/month

### OpenAI API:
- DALL-E 3: ~$0.04 per image
- DALL-E 2: ~$0.02 per image
- Similar pricing to Azure

### Hosting (Static):
- Vercel/Netlify: Free tier available
- AWS/GCP: ~$5-20/month
- CloudFlare Pages: Free

**Estimated total:** $50-500/month depending on usage

---

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Admin Access**: Change default admin password immediately
3. **API Keys**: Rotate keys periodically
4. **RLS Policies**: All database tables have Row Level Security enabled
5. **File Upload**: Size limits enforced (4MB max)
6. **Rate Limiting**: Consider adding rate limits for production
7. **HTTPS**: Always use HTTPS in production
8. **CORS**: Configured for security while allowing necessary access

---

## Support and Resources

- **Supabase Docs**: https://supabase.com/docs
- **Azure OpenAI Docs**: https://learn.microsoft.com/azure/ai-services/openai/
- **OpenAI API Docs**: https://platform.openai.com/docs
- **React Docs**: https://react.dev
- **Vite Docs**: https://vite.dev

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy edge functions
supabase functions deploy generate-mask
supabase functions deploy process-ai-image

# Push database migrations
supabase db push

# View database locally
supabase db reset

# Check Supabase status
supabase status
```

---

## License

This project is provided as-is for use with proper AI service credentials.
