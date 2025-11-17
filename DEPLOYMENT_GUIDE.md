# Multi-Platform Deployment Guide

This repository is structured to work with multiple deployment platforms without configuration changes.

## Supported Platforms

- ✅ **Railway** - Auto-detects Next.js
- ✅ **Vercel** - Native Next.js support
- ✅ **Netlify** - Next.js support
- ✅ **Render** - Auto-detects Next.js
- ✅ **Fly.io** - Docker or Nixpacks
- ✅ **AWS/Google Cloud/Azure** - Standard Node.js deployment

## Repository Structure

All project files are at the repository root:
```
/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/              # Utilities
├── database/         # Database schemas
├── scripts/          # Utility scripts
├── package.json      # At root - required for all platforms
├── next.config.js    # Next.js configuration
└── ...
```

## Deployment Instructions

### Railway

1. Connect GitHub repo to Railway
2. Railway auto-detects Next.js
3. Add environment variables
4. Deploy

**No root directory configuration needed!**

### Vercel

1. Import GitHub repository
2. Vercel auto-detects Next.js
3. Add environment variables
4. Deploy

### Render

1. Connect GitHub repository
2. Select "Web Service"
3. Build command: `npm run build`
4. Start command: `npm start`
5. Add environment variables

### Other Platforms

All platforms will automatically:
- Detect `package.json` at root
- Recognize Next.js framework
- Use standard build/start commands

## Environment Variables

Required for all platforms:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
GHL_API_KEY=your-ghl-key
GHL_LOCATION_ID=your-location-id
GHL_PIPELINE_STAGE_ID=your-stage-id
```

## Post-Deployment

After deployment, run database setup:

```bash
# Using platform CLI or one-off command
npm run seed-db
npm run load-playbook
```

## Troubleshooting

### Platform can't find package.json

- Ensure `package.json` is at repository root
- Check that repository root matches project root
- Verify git is tracking all files correctly

### Build fails

- Check Node.js version (requires 20+)
- Verify all dependencies in `package.json`
- Check build logs for specific errors

### Database connection issues

- Verify `DATABASE_URL` is set correctly
- Check database allows external connections
- Ensure SSL mode is enabled (`sslmode=require`)

