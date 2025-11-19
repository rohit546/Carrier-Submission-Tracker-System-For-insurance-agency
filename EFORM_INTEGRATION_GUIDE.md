# Eform Integration Guide

## Overview

This guide explains how to integrate your eform with the Coversheet submission system. The integration allows users to submit eforms and automatically create submission drafts in Coversheet without requiring authentication.

---

## Architecture

### Flow Diagram

```
┌─────────────────┐
│   Eform App     │
│  (Next.js)      │
└────────┬────────┘
         │
         │ User fills form
         │
         │ User clicks "Start Quote"
         │
         ▼
┌─────────────────────────────────────┐
│  POST /api/integrations/eform       │
│  Headers:                            │
│    x-api-key: YOUR_API_KEY          │
│  Body: {                             │
│    corporationName: "...",          │
│    contactName: "...",              │
│    ... (all insured info)          │
│  }                                   │
└────────┬────────────────────────────┘
         │
         │ Creates insured_information
         │ Creates submission (draft)
         │ Generates public access token
         │
         ▼
┌─────────────────────────────────────┐
│  Response:                           │
│  {                                   │
│    success: true,                   │
│    submissionId: "xxx",             │
│    publicToken: "xxx",              │
│    publicUrl: "https://..."         │
│  }                                   │
└────────┬────────────────────────────┘
         │
         │ Redirect user to publicUrl
         │
         ▼
┌─────────────────────────────────────┐
│  Coversheet Submission Page         │
│  /agent/submission/[id]?token=xxx   │
│  (No authentication required)        │
└─────────────────────────────────────┘
```

---

## Step 1: Configure API Key

### In Coversheet `.env.local`:

```env
EFORM_API_KEY=your-secret-api-key-change-this-in-production
NEXT_PUBLIC_APP_URL=https://your-coversheet-domain.com
```

**Important:** Use a strong, random API key in production!

---

## Step 2: Eform API Endpoint

### Endpoint Details

- **URL:** `https://your-coversheet-domain.com/api/integrations/eform`
- **Method:** `POST`
- **Authentication:** API Key via header
- **Content-Type:** `application/json`

### Headers

```javascript
{
  'Content-Type': 'application/json',
  'x-api-key': 'your-secret-api-key',  // OR
  'Authorization': 'Bearer your-secret-api-key'
}
```

### Request Body

```typescript
{
  // Required
  corporationName: string;
  
  // Optional - Ownership & Basic Info
  ownershipType?: string;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  leadSource?: string;
  proposedEffectiveDate?: string; // ISO date string
  priorCarrier?: string;
  targetPremium?: number;
  
  // Optional - Business Structure
  applicantIs?: string;
  operationDescription?: string;
  dba?: string;
  address?: string;
  
  // Optional - Property Details
  hoursOfOperation?: string;
  noOfMPOs?: number;
  constructionType?: string;
  yearsExpInBusiness?: number;
  yearsAtLocation?: number;
  yearBuilt?: number;
  yearLatestUpdate?: number;
  totalSqFootage?: number;
  leasedOutSpace?: string;
  protectionClass?: string;
  additionalInsured?: string;
  
  // Optional - Security (JSON objects)
  alarm?: {
    burglar?: boolean;
    centralStation?: boolean;
    local?: boolean;
  };
  fire?: {
    centralStation?: boolean;
    local?: boolean;
  };
  
  // Optional - Coverage (JSON objects)
  propertyCoverage?: {
    building?: number;
    bpp?: number;
    bi?: number;
    canopy?: number;
    pumps?: number;
    mAndG?: number;
  };
  generalLiability?: {
    insideSalesTotal?: { monthly?: number; yearly?: number };
    liquorSales?: { monthly?: number; yearly?: number };
    gasolineSales?: { monthly?: number; yearly?: number };
    propaneFillingExchange?: { monthly?: number; yearly?: number };
    carwash?: { monthly?: number; yearly?: number };
    cooking?: { monthly?: number; yearly?: number };
  };
  workersCompensation?: {
    fein?: string;
    noOfEmployees?: number;
    payroll?: number;
    inclExcl?: string;
    percentOwnership?: number;
  };
  
  // Optional - Metadata
  agentId?: string; // If you know which agent should handle this
  eformSubmissionId?: string; // Your eform's submission ID for reference
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "submissionId": "550e8400-e29b-41d4-a716-446655440000",
  "publicToken": "123e4567-e89b-12d3-a456-426614174000",
  "publicUrl": "https://your-coversheet-domain.com/agent/submission/550e8400-e29b-41d4-a716-446655440000?token=123e4567-e89b-12d3-a456-426614174000",
  "message": "Submission draft created successfully"
}
```

**Error (400/401/500):**
```json
{
  "error": "Error message here"
}
```

---

## Step 3: Implement in Your Eform

### Example: Next.js API Route

```typescript
// app/api/submit-eform/route.ts
import { NextRequest, NextResponse } from 'next/server';

const COVERSHEET_API_URL = process.env.COVERSHEET_API_URL || 'https://your-coversheet-domain.com';
const COVERSHEET_API_KEY = process.env.COVERSHEET_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Map your eform data to Coversheet format
    const coversheetPayload = {
      corporationName: formData.corporationName,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactNumber: formData.contactNumber,
      ownershipType: formData.ownershipType,
      address: formData.address,
      // ... map all other fields
    };
    
    // Call Coversheet API
    const response = await fetch(`${COVERSHEET_API_URL}/api/integrations/eform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': COVERSHEET_API_KEY!,
      },
      body: JSON.stringify(coversheetPayload),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: result.error || 'Failed to create submission' },
        { status: response.status }
      );
    }
    
    // Return public URL for redirect
    return NextResponse.json({
      success: true,
      submissionUrl: result.publicUrl,
      submissionId: result.submissionId,
    });
    
  } catch (error: any) {
    console.error('Eform submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Example: Client-Side "Start Quote" Button

```typescript
// components/StartQuoteButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StartQuoteButton({ formData }: { formData: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  async function handleStartQuote() {
    setLoading(true);
    try {
      // Submit to your API route
      const response = await fetch('/api/submit-eform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to Coversheet submission page
        window.location.href = result.submissionUrl;
      } else {
        alert('Failed to create submission: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <button
      onClick={handleStartQuote}
      disabled={loading}
      className="btn-primary"
    >
      {loading ? 'Creating Submission...' : 'Start Quote'}
    </button>
  );
}
```

### Example: Direct Client-Side Call (Alternative)

```typescript
// Direct call from client (if you prefer)
async function handleStartQuote() {
  const COVERSHEET_API_URL = 'https://your-coversheet-domain.com';
  const COVERSHEET_API_KEY = 'your-api-key'; // Store securely!
  
  const response = await fetch(`${COVERSHEET_API_URL}/api/integrations/eform`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': COVERSHEET_API_KEY,
    },
    body: JSON.stringify({
      corporationName: formData.corporationName,
      // ... all other fields
    }),
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Redirect to Coversheet
    window.location.href = result.publicUrl;
  }
}
```

---

## Step 4: User Experience Flow

### In Your Eform:

1. **User fills out the form** with all insured information
2. **User clicks "Start Quote" button**
3. **Your eform:**
   - Validates the form data
   - Calls Coversheet API (`/api/integrations/eform`)
   - Receives `publicUrl` in response
   - **Redirects user to `publicUrl`** (no authentication needed!)

### In Coversheet:

1. **User lands on submission page** (via public URL with token)
2. **Sees insured information** (pre-populated from eform)
3. **Selects business type** (required - one of: C-Store/Grocery Store, Gas Station 18 hours, Gas Station 24 hours)
4. **Views carrier appetite** (automatically loaded based on business type)
5. **Adds quotes and remarks** for carriers
6. **Clicks "Save"** to save changes
7. **Can continue working** or come back later (link remains valid)

---

## Step 5: Data Mapping Reference

### Common Field Mappings

| Eform Field | Coversheet Field | Notes |
|------------|------------------|-------|
| `corporationName` | `corporationName` | **Required** |
| `contactName` | `contactName` | |
| `contactEmail` | `contactEmail` | |
| `contactPhone` | `contactNumber` | |
| `dba` | `dba` | |
| `address` | `address` | |
| `ownershipType` | `ownershipType` | |
| `operationDescription` | `operationDescription` | |
| `hoursOfOperation` | `hoursOfOperation` | |
| `totalSqFootage` | `totalSqFootage` | Number |
| `yearBuilt` | `yearBuilt` | Number |
| `alarm` | `alarm` | JSON object |
| `fire` | `fire` | JSON object |
| `propertyCoverage` | `propertyCoverage` | JSON object |
| `generalLiability` | `generalLiability` | JSON object |
| `workersCompensation` | `workersCompensation` | JSON object |

---

## Step 6: Environment Variables

### In Your Eform Project `.env.local`:

```env
# Coversheet Integration
COVERSHEET_API_URL=https://your-coversheet-domain.com
COVERSHEET_API_KEY=your-secret-api-key
```

---

## Step 7: Testing

### Test the Integration:

1. **Fill out your eform** with test data
2. **Click "Start Quote"**
3. **Verify redirect** to Coversheet submission page
4. **Check insured information** is displayed correctly
5. **Select business type** and verify carriers load
6. **Save submission** and verify it persists

### Test API Directly:

```bash
curl -X POST https://your-coversheet-domain.com/api/integrations/eform \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "corporationName": "Test Corp LLC",
    "contactName": "John Doe",
    "contactEmail": "john@test.com",
    "contactNumber": "555-1234"
  }'
```

Expected response:
```json
{
  "success": true,
  "submissionId": "...",
  "publicToken": "...",
  "publicUrl": "https://..."
}
```

---

## Security Considerations

### ✅ Public Access Token

- Each submission gets a unique `publicAccessToken`
- Token is included in URL: `/agent/submission/[id]?token=xxx`
- Token is verified on server before allowing access
- **No authentication required** - designed for productivity

### ⚠️ API Key Security

- **Never expose API key in client-side code!**
- Store API key in server-side environment variables only
- Use Next.js API routes to proxy requests
- Or use server-side rendering to call Coversheet API

### 🔒 Best Practices

1. **Use HTTPS** in production
2. **Rotate API keys** periodically
3. **Monitor API usage** for suspicious activity
4. **Rate limit** if needed (future enhancement)

---

## Troubleshooting

### Error: "Unauthorized. Invalid API key"

- Check `EFORM_API_KEY` in Coversheet `.env.local`
- Verify you're sending the key in `x-api-key` or `Authorization` header
- Ensure no extra spaces or quotes in API key

### Error: "corporationName is required"

- Ensure `corporationName` is included in request body
- Check it's not empty or null

### Redirect Not Working

- Verify `publicUrl` is returned in API response
- Check URL format: `/agent/submission/[id]?token=[token]`
- Ensure Coversheet domain is correct

### Insured Info Not Showing

- Check that `insuredInfoSnapshot` is populated in submission
- Verify all fields are mapped correctly
- Check browser console for errors

---

## Next Steps

1. ✅ **Run database migration** (`database/migration_add_insured_information.sql`)
2. ✅ **Set API key** in Coversheet `.env.local`
3. ✅ **Implement API call** in your eform
4. ✅ **Test integration** end-to-end
5. ✅ **Deploy both projects**

---

## Support

If you encounter issues:

1. Check Coversheet server logs
2. Check eform server logs
3. Verify API key is correct
4. Test API endpoint directly with curl
5. Check database for created records

---

## Summary

**What you need to do in your eform:**

1. **Add API call** when "Start Quote" is clicked
2. **Map your form data** to Coversheet format
3. **Call:** `POST /api/integrations/eform` with API key header
4. **Get:** `publicUrl` from response
5. **Redirect:** User to `publicUrl`

**That's it!** The user will land on Coversheet submission page with all their data pre-populated, no authentication required. 🎉

