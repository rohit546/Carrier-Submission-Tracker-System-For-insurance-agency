# GoHighLevel Integration Setup

## Environment Variables

Add these to your `.env.local` file:

```env
GHL_API_KEY=pit-08876e0d-f388-4a63-ba4d-c2bea2af5746
GHL_LOCATION_ID=eoDjI8W0iLnEwTnIgGPx
GHL_PIPELINE_STAGE_ID=1d2218ac-d2ac-4ef2-8dc3-46e76b9d9b4c
```

**Note:** `GHL_PIPELINE_STAGE_ID` is optional. If not set, it defaults to `1d2218ac-d2ac-4ef2-8dc3-46e76b9d9b4c`.

**Note:** The API URL is hardcoded to `https://services.leadconnectorhq.com` and doesn't need to be in `.env.local`.

## Getting Your GHL API Key and Location ID

1. Log in to your GoHighLevel account
2. Go to **Settings** → **Integrations** → **API**
3. Generate a new API key or use an existing one
4. Copy the API key to your `.env.local` file as `GHL_API_KEY`
5. Find your Location ID in your GHL account settings
6. Copy the Location ID to your `.env.local` file as `GHL_LOCATION_ID`

## API Endpoints Used

### Search Opportunities
- **Endpoint**: `GET /opportunities/search?location_id={locationId}&limit=20`
- **Purpose**: Search for opportunities in GoHighLevel
- **Returns**: List of opportunities with associated contact information
- **Method**: GET with query parameters
- **Note**: The search filters opportunities client-side by opportunity name or contact name

### Get Contact Details (from Opportunity)
- **Endpoint**: `GET /contacts/{contactId}?locationId={locationId}`
- **Purpose**: Fetch full contact details from the opportunity's contactId
- **Returns**: Complete contact information
- **Note**: This is called automatically for each opportunity to get contact details

## How It Works

1. **Agent clicks "Search GoHighLevel"** button on new submission form
2. **Modal opens** with search interface for opportunities
3. **System fetches** all opportunities from GHL for the location (with pagination)
4. **System filters** opportunities by the configured pipeline stage ID (`1d2218ac-d2ac-4ef2-8dc3-46e76b9d9b4c`)
5. **Agent searches** by typing to filter opportunities by name, company, email, or phone
6. **For each opportunity**, the system fetches the associated contact details
7. **Results display** with opportunity name and contact information (sorted by most recent first)
8. **Agent selects** an opportunity
9. **Business name auto-fills** from GHL contact data (company name or contact name)
10. **Submission created** with GHL contact ID and opportunity ID stored for reference

## Features

- ✅ Search opportunities from GoHighLevel
- ✅ Filter by specific pipeline stage ID (configurable via `GHL_PIPELINE_STAGE_ID`)
- ✅ Pagination support to fetch all opportunities
- ✅ Automatically fetch contact details for each opportunity
- ✅ View opportunity name and contact information (name, email, phone, address)
- ✅ Sort by most recent first
- ✅ Auto-populate business name from contact data
- ✅ Store GHL contact ID and opportunity ID with submission
- ✅ Clear and simple UI

## Current Configuration

The integration is configured with:
- **API Key**: `pit-08876e0d-f388-4a63-ba4d-c2bea2af5746`
- **Location ID**: `eoDjI8W0iLnEwTnIgGPx`
- **Pipeline Stage ID**: `1d2218ac-d2ac-4ef2-8dc3-46e76b9d9b4c`
- **API Base URL**: `https://services.leadconnectorhq.com`
- **API Version**: `2021-07-28`

## Troubleshooting

### "GoHighLevel not configured"
- Make sure both `GHL_API_KEY` and `GHL_LOCATION_ID` are set in `.env.local`
- Restart your dev server after adding the keys

### "Failed to search opportunities"
- Verify your API key is valid
- Check that the Location ID matches your GHL account
- Ensure your GHL account has API access enabled
- Check the browser console and server logs for detailed error messages
- Verify that opportunities exist in your GHL account for the specified location

### No results found
- Try different search terms (searches opportunity names and contact names)
- Check if opportunities exist in your GHL account for the specified location
- Verify API permissions for the location
- Ensure the Location ID is correct
- Note: The search fetches all opportunities and filters client-side, so if no opportunities exist, no results will show

### API Authentication Issues
- The API key should start with `pit-` or `Bearer pit-`
- The code automatically adds `Bearer` prefix if missing
- Make sure there are no extra spaces in the environment variables

