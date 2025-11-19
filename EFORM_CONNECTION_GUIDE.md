# How to Connect Your Eform with Coversheet

## Quick Connection Guide

### Step 1: Get API Key from Coversheet

1. Open Coversheet `.env.local` file
2. Find or add: `EFORM_API_KEY=your-secret-key-here`
3. Copy this API key (you'll use it in your eform)

### Step 2: In Your Eform - Add This Code

When user clicks "Start Quote" button, add this:

```typescript
async function handleStartQuote() {
  // 1. Collect all form data
  const formData = {
    corporationName: form.corporationName, // REQUIRED
    contactName: form.contactName,
    contactEmail: form.contactEmail,
    contactNumber: form.contactPhone,
    address: form.address,
    // ... add all other fields from your form
  };
  
  // 2. Call Coversheet API
  const response = await fetch('http://localhost:3000/api/integrations/eform', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-api-key-here', // Use the key from Step 1
    },
    body: JSON.stringify(formData),
  });
  
  const result = await response.json();
  
  // 3. Redirect user to Coversheet
  if (result.success) {
    window.location.href = result.publicUrl; // No login needed!
  } else {
    alert('Error: ' + result.error);
  }
}
```

### Step 3: Map Your Form Fields

Map your eform fields to Coversheet format:

| Your Eform Field | Coversheet Field | Required |
|-----------------|------------------|----------|
| `corporationName` | `corporationName` | ✅ Yes |
| `contactName` | `contactName` | No |
| `contactEmail` | `contactEmail` | No |
| `contactPhone` | `contactNumber` | No |
| `dba` | `dba` | No |
| `address` | `address` | No |
| `ownershipType` | `ownershipType` | No |
| `operationDescription` | `operationDescription` | No |
| `hoursOfOperation` | `hoursOfOperation` | No |
| `totalSqFootage` | `totalSqFootage` | No |
| `yearBuilt` | `yearBuilt` | No |
| ... (see full list below) | | |

### Step 4: Test Connection

1. Fill out your eform
2. Click "Start Quote"
3. User should be redirected to: `http://localhost:3000/agent/submission/[id]?token=[token]`
4. Insured info should be pre-populated
5. User selects business type
6. Carriers appear

---

## Complete Field Mapping

### Required Fields
- `corporationName` (string) - **REQUIRED**

### Optional Fields

**Basic Info:**
- `ownershipType` (string)
- `contactName` (string)
- `contactNumber` (string)
- `contactEmail` (string)
- `leadSource` (string)
- `proposedEffectiveDate` (string - ISO date)
- `priorCarrier` (string)
- `targetPremium` (number)

**Business Structure:**
- `applicantIs` (string)
- `operationDescription` (string)
- `dba` (string)
- `address` (string)

**Property Details:**
- `hoursOfOperation` (string)
- `noOfMPOs` (number)
- `constructionType` (string)
- `yearsExpInBusiness` (number)
- `yearsAtLocation` (number)
- `yearBuilt` (number)
- `yearLatestUpdate` (number)
- `totalSqFootage` (number)
- `leasedOutSpace` (string)
- `protectionClass` (string)
- `additionalInsured` (string)

**Security (JSON objects):**
- `alarm` (object): `{ burglar?: boolean, centralStation?: boolean, local?: boolean }`
- `fire` (object): `{ centralStation?: boolean, local?: boolean }`

**Coverage (JSON objects):**
- `propertyCoverage` (object): `{ building?: number, bpp?: number, bi?: number, ... }`
- `generalLiability` (object): `{ insideSalesTotal?: { monthly?: number, yearly?: number }, ... }`
- `workersCompensation` (object): `{ fein?: string, noOfEmployees?: number, ... }`

**Metadata:**
- `agentId` (string) - Optional: if you know which agent should handle this
- `eformSubmissionId` (string) - Optional: your eform's submission ID

---

## Example: Complete Integration

```typescript
// In your eform component
async function handleStartQuote() {
  const formData = {
    // Required
    corporationName: formData.corporationName,
    
    // Basic Info
    contactName: formData.contactName,
    contactEmail: formData.contactEmail,
    contactNumber: formData.contactPhone,
    ownershipType: formData.ownershipType,
    address: formData.address,
    
    // Property
    hoursOfOperation: formData.hoursOfOperation,
    totalSqFootage: parseInt(formData.totalSqFootage),
    yearBuilt: parseInt(formData.yearBuilt),
    
    // Security
    alarm: {
      burglar: formData.hasBurglarAlarm,
      centralStation: formData.hasCentralStation,
    },
    
    // Coverage
    propertyCoverage: {
      building: parseFloat(formData.buildingCoverage),
      bpp: parseFloat(formData.bppCoverage),
    },
    
    // Metadata
    eformSubmissionId: formData.submissionId, // Your eform's ID
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/integrations/eform', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_COVERSHEET_API_KEY || 'your-api-key',
      },
      body: JSON.stringify(formData),
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Redirect to Coversheet
      window.location.href = result.publicUrl;
    } else {
      alert('Failed to create submission: ' + result.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}
```

---

## API Endpoint Details

**URL:** `http://localhost:3000/api/integrations/eform` (or your production URL)

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
x-api-key: your-api-key-here
```

**Response (Success):**
```json
{
  "success": true,
  "submissionId": "550e8400-e29b-41d4-a716-446655440000",
  "publicToken": "123e4567-e89b-12d3-a456-426614174000",
  "publicUrl": "http://localhost:3000/agent/submission/550e8400-e29b-41d4-a716-446655440000?token=123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (Error):**
```json
{
  "error": "Error message here"
}
```

---

## Security Notes

1. **Never expose API key in client-side code!**
   - Use environment variables
   - Or create a server-side API route in your eform that proxies the request

2. **For Production:**
   - Change `http://localhost:3000` to your production Coversheet URL
   - Use HTTPS
   - Use a strong, random API key

---

## Troubleshooting

**Error: "Unauthorized. Invalid API key"**
- Check `EFORM_API_KEY` in Coversheet `.env.local`
- Verify you're sending the key in `x-api-key` header

**Error: "corporationName is required"**
- Ensure `corporationName` is included and not empty

**Redirect not working**
- Check `publicUrl` in response
- Verify Coversheet is running
- Check browser console for errors

---

## Need More Help?

See `EFORM_INTEGRATION_GUIDE.md` for complete documentation.

