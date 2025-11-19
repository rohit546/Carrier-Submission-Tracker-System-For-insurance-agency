# Eform Auto-Sync with Coversheet

## What Happens When User Submits Eform

### Automatic Process:

1. **User fills eform** → Clicks "Submit Application"
2. **Data saves to database AUTOMATICALLY:**
   - `insured_information` table (all form data)
   - `submissions` table (submission record) ← **CREATED AUTOMATICALLY**
3. **Submission automatically appears in Coversheet:**
   - Shows in agent's "My Submissions" list immediately
   - Has "NEW" tag on top right (for 48 hours)
   - Status: "DRAFT"
   - Source: "eform"
4. **"Start Quote" button** → Just a redirect link (convenience only)
   - Submission already exists in database
   - User can access it directly from Coversheet list
   - Button just redirects them to it

---

## Implementation in Eform

### Step 1: On "Submit Application" - Save to Database

```typescript
const handleSubmitApplication = async () => {
  // 1. Collect form data
  const formData = {
    corporationName: form.corporationName, // REQUIRED
    contactName: form.contactName,
    contactEmail: form.contactEmail,
    // ... all other fields
  };
  
  // 2. Save to insured_information table
  const insuredInfo = await saveToInsuredInformation(formData);
  
  // 3. Get agent (assign to default agent or specific agent)
  const agent = await getDefaultAgent(); // First agent, or specific agent
  
  // 4. Create submission in Coversheet database
  const submission = await createSubmission({
    insuredInfoId: insuredInfo.id,
    businessName: formData.corporationName,
    agentId: agent.id, // IMPORTANT: Assign to agent
    status: 'draft',
    source: 'eform', // IMPORTANT: Mark as from eform
    eformSubmissionId: yourEformSubmissionId,
    publicAccessToken: generateUUID(),
    insuredInfoSnapshot: insuredInfo, // Store snapshot
  });
  
  // 5. Show success
  setShowSuccess(true);
  setSubmissionId(submission.id);
  setPublicAccessToken(submission.publicAccessToken);
};
```

### Step 2: Get Default Agent

```typescript
// Get first agent from database (or assign to specific agent)
async function getDefaultAgent() {
  const response = await fetch('https://coversheet-domain.com/api/users?role=agent');
  const agents = await response.json();
  return agents[0]; // Return first agent, or filter by specific criteria
}
```

### Step 3: Create Submission Function

```typescript
async function createSubmission(data: {
  insuredInfoId: string;
  businessName: string;
  agentId: string;
  status: string;
  source: string;
  eformSubmissionId?: string;
  publicAccessToken: string;
  insuredInfoSnapshot: any;
}) {
  const response = await fetch('https://coversheet-domain.com/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: data.businessName,
      businessTypeId: null, // Will be selected later in Coversheet
      agentId: data.agentId,
      status: data.status,
      insuredInfoId: data.insuredInfoId,
      insuredInfoSnapshot: data.insuredInfoSnapshot,
      source: data.source,
      eformSubmissionId: data.eformSubmissionId,
      publicAccessToken: data.publicAccessToken,
    }),
  });
  
  return await response.json();
}
```

---

## What User Sees in Coversheet

### In "My Submissions" List:

```
┌─────────────────────────────────────────┐
│ [NEW] ← Blue tag on top right           │
│                                         │
│ SPG Trading Inc                        │
│ C-Store/Grocery Store                  │
│ 📅 19/11/2025                          │
│ ✓ 0 quoted                             │
│                                         │
│ [View Details]                         │
│                                         │
│ DRAFT ← Status badge                    │
└─────────────────────────────────────────┘
```

### "NEW" Tag Rules:

- **Shows for:** Submissions with `source = 'eform'`
- **Duration:** 48 hours from creation
- **Color:** Blue (`bg-blue-600`)
- **Position:** Top right corner
- **Auto-hides:** After 48 hours

---

## Database Schema

### submissions table:

```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  business_name VARCHAR(255),
  business_type_id UUID, -- Can be NULL initially
  agent_id UUID REFERENCES users(id), -- REQUIRED: Assign to agent
  status VARCHAR(50) DEFAULT 'draft',
  insured_info_id UUID REFERENCES insured_information(id),
  insured_info_snapshot JSONB,
  source VARCHAR(50) DEFAULT 'manual', -- Set to 'eform' for eform submissions
  eform_submission_id UUID,
  public_access_token UUID UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Important fields:**
- `agent_id` - Must be set so submission appears in agent's list
- `source` - Must be `'eform'` to show "NEW" tag
- `insured_info_snapshot` - Stores all eform data as JSON

---

## Complete Flow

```
┌─────────────────┐
│   Eform         │
│                 │
│ User submits    │
│ application     │
└────────┬────────┘
         │
         │ Saves to database
         │
         ▼
┌─────────────────────────────────┐
│  Database                       │
│  - insured_information          │
│  - submissions (source='eform') │
└────────┬────────────────────────┘
         │
         │ Automatically synced
         │
         ▼
┌─────────────────────────────────┐
│  Coversheet                     │
│  "My Submissions" List          │
│                                 │
│  [NEW] ← Blue tag              │
│  SPG Trading Inc                │
│  DRAFT                          │
│  [View Details]                │
└─────────────────────────────────┘
```

---

## Key Points

### ✅ Automatic Sync

- **No manual step needed**
- Submission appears automatically in Coversheet
- Real-time sync (as soon as eform is submitted)

### ✅ "NEW" Tag

- **Shows automatically** for eform submissions
- **Blue badge** on top right
- **Lasts 48 hours** from creation
- **Auto-hides** after 48 hours

### ✅ Agent Assignment

- **Must assign to agent** (`agent_id` required)
- Submission appears in that agent's list
- Can assign to default agent or specific agent

### ✅ Status

- **Starts as "DRAFT"**
- User can change in Coversheet
- Can be updated to "quoted", "bound", etc.

---

## Testing

### Test Flow:

1. **Submit eform** → Check database
2. **Open Coversheet** → Go to agent's submissions list
3. **Verify:**
   - ✅ Submission appears in list
   - ✅ "NEW" tag shows on top right
   - ✅ Status is "DRAFT"
   - ✅ Business name is correct
   - ✅ Can click "View Details"

### After 48 Hours:

- "NEW" tag should disappear
- Submission still visible
- Status unchanged

---

## Summary

**When user submits eform:**

1. ✅ Data saves to database automatically
2. ✅ Submission created with `source='eform'`
3. ✅ Assigned to agent (appears in their list)
4. ✅ Shows "NEW" tag for 48 hours
5. ✅ User can see it in Coversheet immediately
6. ✅ User can click "Start Quote" to work on it

**Everything is automatic - no manual steps needed!** 🎉

