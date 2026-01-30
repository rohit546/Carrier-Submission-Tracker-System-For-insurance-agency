# Required API Keys for Form Integration

To enable the address search and property data fetching features, you need to add the following environment variables to your `.env` file:

## Required Environment Variables

### 1. SmartyStreets API Credentials
```env
SMARTY_AUTH_ID=632e75ce-01e0-8330-013e-007b76c4678e
SMARTY_AUTH_TOKEN=m7QYqW7Lq624LhfMV23H
```

**✅ Credentials provided - Add these to your `.env` file**

**How to get:**
- Sign up at https://www.smartystreets.com/
- Navigate to your account dashboard
- Go to API Keys section
- Copy your Auth ID and Auth Token

### 2. Google Maps API Key
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**How to get:**
- Go to https://console.cloud.google.com/
- Create a new project or select an existing one
- Enable the following APIs:
  - Maps JavaScript API
  - Places API
  - Geocoding API
- Go to "Credentials" → "Create Credentials" → "API Key"
- Copy the API key
- (Optional) Restrict the API key to your domain for security

## Notes

- The `NEXT_PUBLIC_` prefix is required for client-side access to Google Maps
- SmartyStreets credentials are server-side only (no prefix needed)
- After adding the keys, restart your development server

## Testing

Once the keys are configured:
1. Navigate to `/agent/form`
2. Type an address in the search field
3. Google autocomplete should show suggestions
4. Click "Fetch Data" to retrieve property information from SmartyStreets
5. View the fetched data in the "Property Data & Maps" modal
