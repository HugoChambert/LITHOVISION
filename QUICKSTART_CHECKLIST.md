# Quick Start Checklist

Use this checklist to get your AI Stone Replacement Tool running in production.

## Before You Begin

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Text editor ready

---

## Part 1: Supabase Setup (5 minutes)

### Create Project
- [ ] Go to [supabase.com](https://supabase.com) and sign up/login
- [ ] Click "New Project"
- [ ] Name: `stone-replacement-tool`
- [ ] Set strong database password (save it!)
- [ ] Choose region closest to users
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for provisioning

### Get Credentials
- [ ] Go to Settings → API
- [ ] Copy **Project URL**: `https://xxxxx.supabase.co`
- [ ] Copy **anon public** key
- [ ] Save both in a text file

### Run Migrations
```bash
# Clone project
git clone <repo-url>
cd stone-replacement-tool

# Link to Supabase
supabase link --project-ref xxxxx

# Push migrations
supabase db push
```

- [ ] Migrations completed successfully

### Add Sample Data
- [ ] Go to Supabase dashboard → SQL Editor
- [ ] Copy sample materials SQL from SETUP_GUIDE.md
- [ ] Run query
- [ ] Verify 10 materials inserted

---

## Part 2: AI Service Setup (10 minutes)

### Option A: Azure OpenAI (Recommended)

#### Create Resource
- [ ] Go to [portal.azure.com](https://portal.azure.com)
- [ ] Search "Azure OpenAI"
- [ ] Click Create
- [ ] Fill form:
  - Resource group: Create new or use existing
  - Region: East US or Sweden Central
  - Name: `stone-replacement-openai`
- [ ] Click "Review + Create" → "Create"
- [ ] Wait 2-3 minutes

#### Deploy Model
- [ ] Go to [oai.azure.com](https://oai.azure.com)
- [ ] Select your resource
- [ ] Go to Deployments → Create new deployment
- [ ] Select model: `dall-e-3`
- [ ] Deployment name: `dall-e-3`
- [ ] Click Create
- [ ] Wait 1-2 minutes

#### Get Credentials
- [ ] Go to Keys and Endpoint
- [ ] Copy Endpoint: `https://xxx.openai.azure.com`
- [ ] Copy Key 1
- [ ] Copy Deployment name: `dall-e-3`

#### Configure Supabase
- [ ] Supabase dashboard → Edge Functions → Manage secrets
- [ ] Add:
  ```
  AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
  AZURE_OPENAI_KEY=your-key-here
  AZURE_OPENAI_DEPLOYMENT=dall-e-3
  ```
- [ ] Click Save

### Option B: OpenAI API (Alternative)

- [ ] Go to [platform.openai.com](https://platform.openai.com)
- [ ] Create API key
- [ ] Copy key (starts with `sk-`)
- [ ] Supabase → Edge Functions → Manage secrets
- [ ] Add: `OPENAI_API_KEY=sk-xxx`
- [ ] Modify edge function to use OpenAI API (see SETUP_GUIDE.md)

---

## Part 3: Deploy Edge Functions (2 minutes)

```bash
# Deploy mask generation
supabase functions deploy generate-mask

# Deploy AI processing
supabase functions deploy process-ai-image
```

- [ ] Both functions deployed successfully
- [ ] Verify in Supabase dashboard → Edge Functions
- [ ] Both show "Status: Active"

---

## Part 4: Frontend Setup (3 minutes)

### Configure Environment
- [ ] Create `.env` file in project root
- [ ] Add:
  ```
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```
- [ ] Replace with your actual values

### Install and Build
```bash
npm install
npm run build
```

- [ ] Dependencies installed
- [ ] Build completed successfully
- [ ] `dist/` folder created

### Test Locally
```bash
npm run dev
```

- [ ] Server started at http://localhost:5173
- [ ] Page loads without errors
- [ ] Upload button visible

---

## Part 5: Create Admin User (2 minutes)

- [ ] Supabase dashboard → SQL Editor
- [ ] Run this query (change password!):
  ```sql
  INSERT INTO admin_users (username, email, password_hash, is_active, can_manage_users, can_manage_materials)
  VALUES (
    'admin',
    'admin@yourdomain.com',
    crypt('ChangeThisPassword123!', gen_salt('bf')),
    true,
    true,
    true
  );
  ```
- [ ] Query executed successfully
- [ ] Test admin access: Press Ctrl+Shift+A in app
- [ ] Login works with your credentials

---

## Part 6: Deploy to Production (5 minutes)

### Option 1: Vercel
```bash
npm install -g vercel
vercel
```
- [ ] Follow prompts
- [ ] Deployment successful
- [ ] Site URL received

### Option 2: Netlify
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```
- [ ] Deployment successful
- [ ] Site URL received

### Option 3: Other Hosts
- [ ] Upload contents of `dist/` folder to your hosting
- [ ] Configure for SPA routing
- [ ] Enable HTTPS

---

## Part 7: Verify Everything Works

### Test Upload
- [ ] Open your deployed site
- [ ] Click "Upload Photo"
- [ ] Upload a kitchen/bathroom image
- [ ] Surface automatically detected
- [ ] Proceeds to stone selection

### Test AI Processing
- [ ] Select 2-3 different stones
- [ ] Click "Generate Previews"
- [ ] Processing starts (shows progress)
- [ ] Results appear after 15-30 seconds each
- [ ] Before/after slider works
- [ ] Images look realistic

### Test Admin Panel
- [ ] Press Ctrl+Shift+A
- [ ] Login with admin credentials
- [ ] Can view stone catalog
- [ ] Can add new material
- [ ] Can edit existing material
- [ ] Can view processing jobs

---

## Production Checklist

Before going live:

### Security
- [ ] Changed default admin password
- [ ] Environment variables are secure
- [ ] HTTPS enabled
- [ ] CORS configured correctly

### Performance
- [ ] Images compressed
- [ ] Build optimized
- [ ] CDN configured (if applicable)
- [ ] Lazy loading enabled

### Monitoring
- [ ] Error tracking set up
- [ ] Usage analytics configured
- [ ] Database backups enabled
- [ ] Edge function logs accessible

### Legal
- [ ] Terms of service added
- [ ] Privacy policy added
- [ ] Cookie notice (if applicable)
- [ ] Image usage rights clarified

---

## Troubleshooting

### "Failed to auto-detect surface"
- Use clear, well-lit photos
- Ensure countertop is visible
- Try different angle

### "Azure OpenAI credentials not configured"
- Check environment variables in Supabase
- Verify exact spelling
- Redeploy edge functions

### "Processing job failed"
- Check Azure OpenAI quota
- Verify API key is valid
- Check edge function logs

### Build errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Time Estimate Summary

| Task | Time |
|------|------|
| Supabase Setup | 5 min |
| AI Service Setup | 10 min |
| Deploy Edge Functions | 2 min |
| Frontend Setup | 3 min |
| Admin User | 2 min |
| Deploy to Production | 5 min |
| Testing | 5 min |
| **Total** | **~30 min** |

---

## Success Criteria

You're ready for production when:

- ✅ Site is accessible via HTTPS
- ✅ Users can upload images successfully
- ✅ Surface detection works automatically
- ✅ Stone materials load correctly
- ✅ AI processing generates realistic results
- ✅ Admin panel is accessible and functional
- ✅ No console errors in browser
- ✅ Edge function logs show no errors

---

## Next Steps

After going live:

1. **Monitor usage**: Check Supabase dashboard daily
2. **Add more materials**: Expand stone catalog
3. **Collect feedback**: Add feedback form
4. **Optimize**: Monitor processing times
5. **Scale**: Upgrade plans as needed

---

## Support Resources

- **SETUP_GUIDE.md**: Detailed instructions
- **API_REFERENCE.md**: Complete API docs
- **AZURE_OPENAI_SETUP.md**: AI setup details
- **Supabase Docs**: https://supabase.com/docs
- **Azure OpenAI Docs**: https://learn.microsoft.com/azure/ai-services/openai/

---

## Quick Commands Reference

```bash
# Start development
npm run dev

# Build production
npm run build

# Deploy edge function
supabase functions deploy <function-name>

# Push migrations
supabase db push

# View logs
supabase functions logs <function-name>

# Check status
supabase status
```

---

✅ **Ready to launch!** Follow this checklist and you'll have a production-ready AI stone replacement tool in about 30 minutes.
