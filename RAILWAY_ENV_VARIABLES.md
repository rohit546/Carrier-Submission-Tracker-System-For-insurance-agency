# Railway Environment Variables Configuration

## Required Environment Variables for Deployment

### 1. Database Connection
```
DATABASE_URL=postgresql://user:password@host:port/database
```
- **Required**: Yes
- **Description**: PostgreSQL connection string for Neon database
- **Where to get**: From your Neon database dashboard

### 2. Google Sheets API (Novatae AMC)
```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"pdf-generator-477915",...}
```
- **Required**: Yes (for Novatae AMC functionality)
- **Description**: Complete JSON content of the service account key file
- **How to set**: 
  1. Open `pdf-generator-477915-6056095f253b.json`
  2. Copy the entire JSON content
  3. Paste it as a single-line string in Railway (escape quotes if needed)
- **Alternative**: You can also use OAuth (see optional variables below)

### 3. JWT Secret
```
JWT_SECRET=your-secret-key-here
```
- **Required**: Yes
- **Description**: Secret key for JWT token signing
- **Recommendation**: Use a strong random string (at least 32 characters)

### 4. Webhook URLs (Optional - have defaults)
```
ENCOVA_WEBHOOK_URL=https://encova-submission-bot-rpa-production.up.railway.app/webhook
GUARD_WEBHOOK_URL=https://guardsubmissionbot-production.up.railway.app/webhook
COLUMBIA_WEBHOOK_URL=https://columbia-submission-bot-production.up.railway.app/webhook
```
- **Required**: No (defaults are set in code)
- **Description**: URLs for RPA bot webhooks
- **Note**: Only set if you need to override the defaults

### 5. Google Maps API Key
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```
- **Required**: Yes (for address autocomplete, maps, and Street View)
- **Description**: Google Maps JavaScript API key with Places, Geocoding, and Street View Static APIs enabled
- **Where to get**: 
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Create or select a project
  3. Enable these APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
     - Street View Static API
     - Maps Embed API
  4. Create credentials (API Key)
  5. Restrict the API key to your domain (optional but recommended)
- **Important**: This must be set BEFORE building, as Next.js embeds `NEXT_PUBLIC_` variables at build time

### 6. Base URL
```
NEXT_PUBLIC_BASE_URL=https://your-app.railway.app
```
- **Required**: Recommended
- **Description**: Public base URL of your Railway deployment
- **Note**: Railway auto-generates this, but you can set it explicitly

### 6. Optional Environment Variables

#### Google OAuth (Alternative to Service Account)
```
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REFRESH_TOKEN=your-refresh-token
GOOGLE_OAUTH_REDIRECT_URI=https://your-app.railway.app/api/auth/google/callback
```
- **Required**: No (only if not using service account)
- **Description**: OAuth credentials for Google Sheets API

#### Novatae Configuration
```
NOVATAE_USER_EMAIL=rohitkumar7480622@gmail.com
NOVATAE_DESTINATION_FOLDER_ID=1Ymt9O6_CyvCN71VEyMyXrF6kHRaRMOcG
```
- **Required**: No (has defaults)
- **Description**: Email and folder ID for Novatae sheet creation

#### GHL Integration (Optional)
```
GHL_API_KEY=your-ghl-api-key
GHL_LOCATION_ID=your-ghl-location-id
```
- **Required**: No
- **Description**: GoHighLevel API credentials

#### EForm Integration (Optional)
```
EFORM_API_KEY=your-eform-api-key
```
- **Required**: No
- **Description**: EForm API key

## How to Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Click "New Variable"
5. Add each variable name and value
6. Click "Deploy" to apply changes

## Important Notes

### NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
**CRITICAL**: This environment variable must be set BEFORE the build runs. Next.js embeds `NEXT_PUBLIC_` prefixed variables into the client bundle at build time. If you add this variable after deployment:

1. Add the variable in Railway
2. **Trigger a new deployment** (Railway will rebuild automatically)
3. The 3D maps and Street View will work after the rebuild

If the variable is missing during build, you'll see "3D Street View requires Google Maps API key" error.

### GOOGLE_SERVICE_ACCOUNT_JSON Format
The `GOOGLE_SERVICE_ACCOUNT_JSON` must be a **single-line JSON string**. 

**Option 1: Single line (recommended)**
```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"pdf-generator-477915","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"novatae-automation@pdf-generator-477915.iam.gserviceaccount.com",...}
```

**Option 2: Use Railway's multiline support**
- Railway supports multiline environment variables
- Copy the entire JSON file content
- Paste it directly (Railway will handle it)

### Service Account File
The file `pdf-generator-477915-6056095f253b.json` is in `.gitignore` and should **NOT** be committed to GitHub. Instead, use the `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable.

## Verification Checklist

After deployment, verify:
- [ ] Database connection works
- [ ] Google Maps API key is set (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- [ ] Address autocomplete works
- [ ] 3D maps and Street View load correctly
- [ ] Novatae AMC sheet creation works (test with a submission)
- [ ] RPA webhooks are receiving updates
- [ ] Authentication (login) works
- [ ] All carrier automations (Encova, Guard, Columbia, Novatae) work

## Troubleshooting

### Google Sheets API Errors
- Verify `GOOGLE_SERVICE_ACCOUNT_JSON` is set correctly
- Check that the service account has access to the template spreadsheet
- Verify the service account email has Editor permissions

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check that the database is accessible from Railway
- Ensure the database has the `rpa_tasks` column (run migration if needed)

### Webhook Errors
- Verify webhook URLs are correct
- Check that RPA bots are running and accessible
- Verify CORS settings on webhook endpoints
