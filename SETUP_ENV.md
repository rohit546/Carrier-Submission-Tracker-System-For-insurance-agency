# Environment Variables Setup

## Quick Setup

Create a `.env` file in the root directory with the following content:

```env
# SmartyStreets API Credentials (✅ Provided)
SMARTY_AUTH_ID=632e75ce-01e0-8330-013e-007b76c4678e
SMARTY_AUTH_TOKEN=m7QYqW7Lq624LhfMV23H

# Google Maps API Key (Required for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Database (if not already set)
DATABASE_URL=your_database_connection_string

# JWT Secret (if not already set)
JWT_SECRET=your_jwt_secret
```

## Steps to Setup

1. **Create `.env` file** in the root directory (`C:\Users\Dell\Desktop\Coversheet\.env`)

2. **Add the SmartyStreets credentials** (already provided above)

3. **Add Google Maps API Key**:
   - Go to https://console.cloud.google.com/
   - Enable Maps JavaScript API and Places API
   - Create an API key
   - Add it to `.env` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

4. **Restart your development server** after adding the credentials

## Testing

Once configured:
- Navigate to `/agent/form`
- Type an address → Google autocomplete should work
- Click "Fetch Data" → SmartyStreets data should load
- View property data in the modal
