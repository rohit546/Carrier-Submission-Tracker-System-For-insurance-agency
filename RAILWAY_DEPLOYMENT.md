# Railway Deployment Guide

## Prerequisites

1. Railway account (sign up at https://railway.app)
2. GitHub repository connected to Railway
3. Neon PostgreSQL database (or Railway PostgreSQL)

## Deployment Steps

### 1. Connect Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `rohit546/Carrier-Submission-Tracker-System-For-insurance-agency`
5. Railway will automatically detect Next.js and start building
   - ✅ All project files are at repository root
   - ✅ No root directory configuration needed
   - ✅ Works with multiple deployment platforms

### 2. Environment Variables

Add these environment variables in Railway dashboard (Settings → Variables):

#### Required Variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here

# GoHighLevel API
GHL_API_KEY=pit-08876e0d-f388-4a63-ba4d-c2bea2af5746
GHL_LOCATION_ID=eoDjI8W0iLnEwTnIgGPx
GHL_PIPELINE_STAGE_ID=1d2218ac-d2ac-4ef2-8dc3-46e76b9d9b4c
```

#### How to Get DATABASE_URL:

**Option 1: Use Neon PostgreSQL (Recommended)**
- Go to your Neon dashboard
- Copy the connection string
- Format: `postgresql://user:password@host:port/database?sslmode=require`

**Option 2: Use Railway PostgreSQL**
- In Railway, add a PostgreSQL service
- Railway will automatically create `DATABASE_URL` variable
- Connect it to your Next.js service

#### Generate JWT_SECRET:

```bash
# Run this command to generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Database Setup

After deployment, run database migrations:

1. **Option A: Using Railway CLI**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Link to your project
   railway link
   
   # Run seed script
   railway run npm run seed-db
   ```

2. **Option B: Using Railway Dashboard**
   - Go to your service → Settings → Deployments
   - Create a one-off deployment with command: `npm run seed-db`

3. **Load Carrier Playbook Data**
   ```bash
   railway run npm run load-playbook
   ```

### 4. Build Settings

Railway will automatically:
- Detect Next.js framework
- Run `npm install`
- Run `npm run build`
- Start with `npm start`

### 5. Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your custom domain
3. Railway will provide DNS records
4. Update your DNS settings

## Post-Deployment Checklist

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Database seeded with initial data
- [ ] Carrier playbook data loaded
- [ ] Test login functionality
- [ ] Test GHL integration
- [ ] Verify database connections

## Troubleshooting

### Build Fails

- Check build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Railway uses latest LTS by default)

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check if database allows connections from Railway IPs
- Ensure SSL mode is set (`sslmode=require`)

### Environment Variables Not Working

- Restart the service after adding variables
- Check variable names match exactly (case-sensitive)
- Verify no extra spaces in values

## Railway-Specific Features

### Health Checks

Railway automatically monitors:
- Port 3000 (default Next.js port)
- Health endpoint: `/health` (if you add one)

### Logs

View logs in Railway dashboard:
- Real-time logs
- Build logs
- Deployment logs

### Scaling

Railway can auto-scale based on:
- Traffic
- Resource usage
- Custom metrics

## Cost Estimation

- **Hobby Plan**: Free tier available
- **Pro Plan**: $5/month (if needed for more resources)
- **Database**: Neon free tier or Railway PostgreSQL

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

