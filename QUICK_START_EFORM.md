# Quick Start: Eform Integration

## What You Need to Do in Your Eform

### Step 1: Add API Call When "Start Quote" is Clicked

```typescript
// In your eform "Start Quote" button handler:

async function handleStartQuote() {
  // 1. Collect all form data
  const formData = {
    corporationName: form.corporationName,
    contactName: form.contactName,
    contactEmail: form.contactEmail,
    contactNumber: form.contactPhone,
    // ... map all other fields from your form
  };
  
  // 2. Call Coversheet API
  const response = await fetch('https://your-coversheet-domain.com/api/integrations/eform', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-api-key-here', // Get this from Coversheet admin
    },
    body: JSON.stringify(formData),
  });
  
  const result = await response.json();
  
  // 3. Redirect user to Coversheet
  if (result.success) {
    window.location.href = result.publicUrl;
  } else {
    alert('Error: ' + result.error);
  }
}
```

### Step 2: Map Your Form Fields

Map your eform fields to Coversheet format:

| Your Eform Field | Coversheet Field | Required |
|-----------------|------------------|----------|
| `corporationName` | `corporationName` | ✅ Yes |
| `contactName` | `contactName` | No |
| `contactEmail` | `contactEmail` | No |
| `contactPhone` | `contactNumber` | No |
| `dba` | `dba` | No |
| `address` | `address` | No |
| ... (see full list in EFORM_INTEGRATION_GUIDE.md) | | |

### Step 3: Get API Key

Ask Coversheet admin for:
- **API Key** (stored in Coversheet `.env.local` as `EFORM_API_KEY`)
- **Coversheet URL** (e.g., `https://your-coversheet-domain.com`)

### Step 4: Test

1. Fill out your eform
2. Click "Start Quote"
3. User should be redirected to Coversheet submission page
4. Insured info should be pre-populated
5. User selects business type
6. Carriers appear
7. User can add quotes and save

---

## That's It! 🎉

The user will land on Coversheet with all their data, **no authentication required**.

See `EFORM_INTEGRATION_GUIDE.md` for complete documentation.

