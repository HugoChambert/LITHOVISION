# Stone Replacement Tool - Quick Start Guide

Get started with the AI-powered stone replacement tool in 10 minutes.

## What You Get

✅ **Fully serverless architecture** - no servers to manage
✅ **Pre-built React/Vite frontend** ready to use
✅ **Supabase backend** with database and storage
✅ **AI-powered processing** via Azure OpenAI
✅ **Smart area detection** built-in

## Prerequisites

- **Node.js 18+**
- **Supabase account** (already configured)
- **Azure OpenAI account** (required for AI features)

---

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

---

## Step 2: Configure Azure OpenAI (5-10 minutes) ⚠️ REQUIRED ⚠️

Azure OpenAI powers the image editing that replaces stone materials.

### 2.1 Create Azure OpenAI Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Azure OpenAI"
3. Click "Create"
4. Fill in:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Create new or use existing
   - **Region**: Choose available region (e.g., East US)
   - **Name**: Choose a unique name (e.g., `myapp-openai`)
   - **Pricing tier**: Standard S0
5. Click "Review + Create" → "Create"
6. Wait 5-10 minutes for deployment

### 2.2 Deploy DALL-E Model

1. Go to your Azure OpenAI resource
2. Click "Go to Azure OpenAI Studio"
3. In the left menu, click "Deployments"
4. Click "Create new deployment"
5. Select:
   - **Model**: `dall-e-3` (or `dall-e-2` for lower cost)
   - **Deployment name**: `dall-e-3` (remember this name)
6. Click "Create"

### 2.3 Get Your Credentials

1. In Azure Portal, go to your Azure OpenAI resource
2. Click "Keys and Endpoint" in the left menu
3. Copy:
   - **Endpoint**: `https://YOUR-RESOURCE.openai.azure.com`
   - **Key 1**: Your API key

### 2.4 Add to Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to "Edge Functions" → Click the settings/gear icon
4. Add these environment variables:

```
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com
AZURE_OPENAI_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT=dall-e-3
```

5. Click "Save"

**Cost**: ~$0.04-0.08 per image with DALL-E 3

---

## Step 3: Start Development Server (30 seconds)

```bash
npm run dev
```

Visit `http://localhost:5173` and start using the tool!

---

## Step 4: Test the Application

### 4.1 Upload an Image

1. Click "Choose File" or drag-and-drop
2. Upload a photo of a kitchen or bathroom
3. Click "Continue"

### 4.2 Select Area

1. Click on the stone surface you want to replace
2. AI automatically detects and highlights the area
3. Click "Continue to Stone Selection"

### 4.3 Choose Stone Material

1. Browse the stone catalog
2. Click on a material to select it
3. Click "Generate Preview"

### 4.4 View Result

1. Wait 5-10 seconds for AI processing
2. Compare original vs. preview using the slider
3. Download the result if satisfied

---

## Deploying to Production

### Option 1: Netlify

```bash
npm run build
```

1. Go to [Netlify](https://app.netlify.com)
2. Drag the `dist` folder to deploy
3. Done!

### Option 2: Vercel

```bash
npm run build
```

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Done!

---

## Managing Stone Catalog

### Access Admin Panel

Press `Ctrl + Shift + A` (Windows/Linux) or `Cmd + Shift + A` (Mac)

### Add New Stone Material

1. Click "Add New Stone"
2. Fill in:
   - **Name**: e.g., "Calacatta Marble"
   - **Type**: marble, granite, or quartz
   - **Description**: Brief description
   - **Image URL**: Full-size texture image
   - **Thumbnail URL**: (optional) Smaller version
   - **Sort Order**: Display order (lower = earlier)
3. Click "Save"

**Tip**: Use stock photos from [Pexels](https://pexels.com) for stone textures

---

## Troubleshooting

### "Azure OpenAI credentials not configured"

**Solution**: Make sure you added all three environment variables to Supabase Edge Functions:
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_KEY`
- `AZURE_OPENAI_DEPLOYMENT`

### "Failed to generate mask"

**Solution**:
- Ensure you clicked directly on the stone surface
- Try clicking a different area with uniform color
- Check browser console for detailed error messages

### "Processing takes too long"

**Solution**:
- Azure OpenAI typically takes 5-10 seconds
- Check Azure OpenAI service status
- Try with a smaller image

### Edge Function timeout

**Solution**:
- Reduce image size before uploading
- Azure OpenAI has a 60-second timeout built in

---

## API Costs Breakdown

### Azure OpenAI (Required)
- **DALL-E 3**: $0.04-0.08 per image
- **DALL-E 2**: $0.02 per image
- **Free tier**: None, but very affordable

### Supabase (Already Configured)
- **Database**: Free tier (500MB)
- **Storage**: Free tier (1GB)
- **Edge Functions**: 500K invocations/month free

**Example monthly cost** (1,000 users, 10 images each):
- Azure OpenAI: $400-800
- Supabase: $0 (free tier)
- **Total**: ~$400-800/month

---

## Next Steps

### For Development
- [ ] Test with various kitchen/bathroom photos
- [ ] Add more stone materials to catalog
- [ ] Customize colors in `src/index.css`
- [ ] Read `ARCHITECTURE.md` for system design

### For Production
- [ ] Deploy to Netlify or Vercel
- [ ] Set up custom domain
- [ ] Add user authentication (optional)
- [ ] Enable analytics
- [ ] Set up monitoring

---

## Performance Expectations

- **Upload**: < 1 second
- **Area detection**: Instant (built-in algorithm)
- **AI processing**: 5-10 seconds (Azure OpenAI)
- **Total workflow**: ~10-15 seconds

---

## Additional Resources

- **Full Documentation**: `README.md`
- **API Setup Details**: See "Required APIs & Configuration" section in README
- **Azure OpenAI Guide**: `AZURE_OPENAI_SETUP.md`
- **Architecture Details**: `ARCHITECTURE.md`
- **Deployment Guide**: `DEPLOYMENT.md`

---

## Support

Having issues? Check:

1. All environment variables are set in Supabase
2. Azure OpenAI deployment is active
3. Supabase project is running
4. Browser console for errors

---

**Ready to start?** Run `npm run dev` and open `http://localhost:5173`!
