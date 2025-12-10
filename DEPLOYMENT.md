# Production Deployment Guide

This application is now production-ready and can be deployed to any static hosting platform.

## What Changed

The application has been updated from a heavy ML-backend architecture to a serverless, production-ready architecture:

- **Before**: Required Python FastAPI backend with GPU, Redis, Celery, and 10GB+ of ML models
- **After**: Fully serverless using Supabase Storage, Database, and simulated processing

### Current Architecture

```
Frontend (React + Vite)
    ↓
Supabase Storage (Image uploads)
    ↓
Supabase Database (Processing jobs tracking)
    ↓
Simulated AI Processing (placeholder for real AI integration)
```

## Deployment Options

### Option 1: Netlify (Recommended)

1. Connect your repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Option 2: Vercel

1. Connect your repository to Vercel
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Framework: Vite
3. Add environment variables in Vercel dashboard
4. Deploy

### Option 3: Other Static Hosts

Works with any static hosting: GitHub Pages, Cloudflare Pages, AWS S3 + CloudFront, etc.

## Environment Variables

Required environment variables (already in `.env` for development):

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Supabase Setup (Already Complete)

The following are already set up:

1. ✅ Storage bucket: `stone-images`
2. ✅ Tables:
   - `stone_materials` - Stone catalog
   - `material_presets` - Material presets
   - `admin_users` - Admin authentication
   - `processing_jobs` - Job tracking
3. ✅ Row Level Security (RLS) policies
4. ✅ Storage policies for public upload/read

## Adding Real AI Processing

The current implementation uses simulated processing. To add real AI:

### Option A: External AI APIs

Integrate with services like:
- **Replicate.com** - Pay-per-inference for ML models
- **Stability AI** - SDXL API
- **RunPod** - GPU serverless

Example integration with Replicate:

```typescript
export async function generateStoneReplacement(
  imageId: string,
  maskId: string,
  stoneMaterial: any
): Promise<{ task_id: string }> {
  const { data, error } = await supabase
    .from('processing_jobs')
    .insert({
      image_id: imageId,
      mask_id: maskId,
      stone_material: stoneMaterial,
      status: 'pending',
      progress: 0
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create job: ${error.message}`);

  // Call Replicate API
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: 'sdxl-model-id',
      input: {
        image: imageId,
        mask: maskId,
        prompt: stoneMaterial.description
      }
    })
  });

  // Poll Replicate for results and update processing_jobs

  return { task_id: data.id };
}
```

### Option B: Keep Heavy Backend

If you need the full ML pipeline (SAM, MiDaS, SDXL):

1. Deploy the `/backend` directory to a GPU-enabled server
2. Use services like:
   - AWS EC2 (p3.2xlarge with GPU)
   - Google Cloud Platform (GPU instances)
   - Lambda Labs
   - Vast.ai
3. Update API endpoint in `src/lib/api.ts` to point to your backend
4. Implement proper authentication and rate limiting

## Admin Panel

Access the admin panel with `Ctrl + Shift + A` and authenticate with admin credentials stored in `admin_users` table.

## Performance

Current build size:
- HTML: 0.45 kB (gzip: 0.31 kB)
- CSS: 23.21 kB (gzip: 4.43 kB)
- JS: 412.41 kB (gzip: 118.48 kB)

Total bundle: ~436 kB (gzip: ~123 kB)

## Cost Estimation

### Serverless (Current Setup)
- **Supabase Free Tier**: $0/month (500MB storage, 2GB bandwidth)
- **Supabase Pro** (if needed): $25/month (8GB storage, 250GB bandwidth)
- **Netlify/Vercel**: Free tier sufficient for most use cases
- **Total**: $0-25/month

### With External AI APIs
- **Replicate SDXL**: ~$0.01-0.05 per image
- Good for: Low to medium volume (< 10,000 images/month)
- Total: $25-525/month (depending on volume)

### With Self-Hosted ML Backend
- **GPU Server** (AWS p3.2xlarge): ~$900-1200/month
- Good for: High volume (> 50,000 images/month)
- Requires DevOps expertise

## Monitoring

### Frontend
- Use Netlify/Vercel built-in analytics
- Add error tracking: Sentry, LogRocket, etc.

### Backend (Supabase)
- Monitor database usage in Supabase dashboard
- Set up usage alerts
- Track storage growth

## Security Checklist

- ✅ RLS policies enabled on all tables
- ✅ Storage bucket policies configured
- ✅ Environment variables properly configured
- ✅ Admin authentication implemented
- ⚠️ Add rate limiting (when using real AI)
- ⚠️ Add input validation (when using real AI)
- ⚠️ Implement CORS properly (when using external APIs)

## Scaling Considerations

When you're ready to scale:

1. **Image optimization**: Add image compression before upload
2. **CDN**: Use Cloudflare or similar for static assets
3. **Caching**: Implement result caching for identical requests
4. **Queue system**: Add proper job queue for AI processing
5. **Database**: Upgrade Supabase plan or migrate to dedicated DB

## Troubleshooting

### Build Errors
```bash
npm run build
```
If errors occur, check TypeScript types and import paths.

### Upload Failures
- Verify Supabase credentials in environment variables
- Check storage bucket policies in Supabase dashboard
- Ensure bucket name is correct (`stone-images`)

### Database Errors
- Check RLS policies
- Verify table schema matches code
- Review Supabase logs

## Next Steps

1. Deploy to your preferred platform
2. Test the full workflow end-to-end
3. Integrate real AI processing (Replicate, Stability AI, or self-hosted)
4. Add analytics and monitoring
5. Implement user authentication (optional)
6. Add payment processing if needed (Stripe)

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review Vite documentation: https://vitejs.dev
3. Check deployment platform docs (Netlify/Vercel)
