# Production Deployment Checklist

## Pre-Deployment

### Environment Configuration
- [x] Environment variables configured in `.env.production`
- [x] Supabase URL and Anon Key set correctly
- [x] All sensitive keys excluded from version control

### Code Quality
- [x] All console.log/console.error statements removed
- [x] Error handling implemented throughout
- [x] Loading states properly displayed
- [x] Responsive design tested on mobile devices

### Build Optimization
- [x] Production build configured with code splitting
- [x] Bundle size optimized (react and supabase vendors separated)
- [x] Source maps disabled in production
- [x] Console statements dropped in production build
- [x] Minification enabled (esbuild)

### Database
- [x] Row Level Security (RLS) enabled on all tables
- [x] Proper authentication policies configured
- [x] Admin authentication secured
- [x] Storage buckets configured with proper permissions

### Security
- [x] Admin authentication requires strong passwords (6+ chars)
- [x] Session management implemented
- [x] RLS policies restrict data access
- [x] File upload validation in place
- [x] API endpoints secured with authentication

## Deployment Steps

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Verify build output**
   - Check `dist/` directory for generated files
   - Verify all assets are present

3. **Deploy to hosting platform**
   - Upload `dist/` directory contents
   - Configure redirects (see `dist/_redirects` for SPA routing)

4. **Configure environment variables** (if not using .env.production)
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

5. **Test production deployment**
   - [ ] Test image upload functionality
   - [ ] Test area selection with mask generation
   - [ ] Test stone catalog loading
   - [ ] Test admin panel access (Ctrl+Shift+A)
   - [ ] Test user authentication
   - [ ] Test responsive design on mobile

## Post-Deployment

### Monitoring
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all API endpoints responding
- [ ] Check database query performance

### User Testing
- [ ] Test complete workflow: upload → select → choose → preview
- [ ] Verify all toast notifications working
- [ ] Test session persistence
- [ ] Verify image processing completes successfully

## Azure API Configuration

The application is ready for Azure OpenAI API integration. The AI processing functions are located in:
- `/supabase/functions/process-ai-image/index.ts`

When you configure your Azure API:
1. Update the API endpoint in the edge function
2. Add necessary authentication headers
3. Test the image processing pipeline

## Notes

- Base path configured as `/LITHOVISION/` in vite.config.ts
- All database operations use Supabase
- Admin access: Press `Ctrl+Shift+A` anywhere in the app
- Default admin credentials should be changed immediately after first login
- Sessions expire after 7 days of inactivity
