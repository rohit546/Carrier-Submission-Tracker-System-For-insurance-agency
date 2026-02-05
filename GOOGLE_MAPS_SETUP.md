# Google Maps API Setup for Railway Deployment

## Problem
3D maps (Street View) are not working on Railway deployment but work locally. This is because the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable is not set in Railway.

## Solution

### Step 1: Get Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (required for all maps)
   - **Places API** (required for address autocomplete)
   - **Geocoding API** (required for address lookup)
   - **Street View Static API** (required for 3D Street View)
   - **Maps Embed API** (required for embedded maps)

4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

5. (Recommended) Restrict your API key:
   - Click on your API key to edit it
   - Under "Application restrictions", select "HTTP referrers"
   - Add your Railway domain: `*.railway.app/*`
   - Under "API restrictions", select "Restrict key"
   - Choose only the APIs listed above

### Step 2: Add to Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Click "New Variable"
5. Add:
   - **Name**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: Your Google Maps API key
6. Click "Add"

### Step 3: Trigger a New Deployment

**IMPORTANT**: Next.js embeds `NEXT_PUBLIC_` variables at build time. You must rebuild after adding this variable.

1. Railway will automatically trigger a new deployment when you add the variable
2. Wait for the build to complete
3. Verify the 3D maps work

### Step 4: Verify It Works

1. Go to your deployed application
2. Navigate to the form page
3. Search for an address
4. Click "View Property Data"
5. Go to the "3D Maps" tab
6. The Street View should now load instead of showing "3D Street View requires Google Maps API key"

## Troubleshooting

### Still seeing "requires Google Maps API key" error?

1. **Check the variable name**: It must be exactly `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (case-sensitive)
2. **Verify the build**: Check Railway logs to ensure the variable was available during build
3. **Check API restrictions**: Make sure your API key allows requests from `*.railway.app`
4. **Verify APIs are enabled**: All 5 APIs listed above must be enabled
5. **Check billing**: Google Maps API requires a billing account (free tier available)

### Other maps work but 3D doesn't?

- This means the API key is partially working
- Check that **Street View Static API** is enabled
- Verify the API key has access to Street View Static API

### Getting API errors in console?

- Check browser console for specific error messages
- Common errors:
  - "This API key is not authorized": API not enabled
  - "RefererNotAllowedMapError": API key restrictions too strict
  - "OverQueryLimit": Quota exceeded (check billing)

## Cost Considerations

Google Maps API has a free tier:
- Maps JavaScript API: $200 free credit/month
- Places API: $200 free credit/month
- Geocoding API: $200 free credit/month
- Street View Static API: $200 free credit/month

For most applications, the free tier is sufficient. Monitor usage in Google Cloud Console.
