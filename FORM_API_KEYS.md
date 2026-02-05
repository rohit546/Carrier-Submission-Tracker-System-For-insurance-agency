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
2. Type an address in the search field (should be able to type freely without blocking)
3. Google autocomplete should show suggestions after typing 3+ characters
4. Click "Fetch Data" to retrieve property information from SmartyStreets
5. View the fetched data in the "Property Data & Maps" modal

## Troubleshooting

### Issue: Can't type more than 2-3 letters in address field
**Fixed!** The Google Autocomplete widget was blocking input. Now using AutocompleteService only, which doesn't interfere with typing.

### Issue: Address suggestions not appearing
**Check:**
1. Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env` file
2. Restart your development server after adding the key
3. Check browser console for errors:
   - ✅ "Google Autocomplete Service initialized" = Working
   - ⚠️ "Google Maps not loaded" = API key missing or invalid
4. Verify the API key has these APIs enabled:
   - Maps JavaScript API
   - Places API
   - Geocoding API
5. Check browser console for API errors (quota exceeded, invalid key, etc.)

### Issue: Warning icon appears in input field
- If you see "⚠️ API key needed" warning, add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env`
- The warning only appears when typing 3+ characters without suggestions
