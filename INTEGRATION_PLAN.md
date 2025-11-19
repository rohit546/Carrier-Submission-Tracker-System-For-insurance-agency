# Eform Integration Plan - Coversheet Submission Tracker

## Overview
Integrate external Next.js eform with Coversheet to automatically create submission drafts with insured information.

---

## Current State Analysis

### Coversheet Submission Structure (Current)
```typescript
{
  id: string
  businessName: string
  businessTypeId: string
  agentId: string
  status: 'draft' | 'quoted' | 'bound' | 'submitted'
  carriers: CarrierQuote[]
  createdAt: string
  updatedAt: string
}
```

### Eform Data Structure (From Screenshot)
```typescript
{
  // Ownership & Basic Info
  ownershipType: 'Owner' | 'Tenant' | 'Lessor\'s Risk' | 'Triple Net Lease'
  corporationName: string
  contactName: string
  contactNumber: string
  contactEmail: string
  leadSource: string
  proposedEffectiveDate: string
  priorCarrier: string
  targetPremium: number
  
  // Business Structure
  applicantIs: 'Individual' | 'Partnership' | 'Corporation' | 'Joint Venture' | 'LLC' | 'other'
  operationDescription: string
  dba: string
  address: string
  
  // Property Details
  hoursOfOperation: string
  noOfMPOs: number
  constructionType: string
  yearsExpInBusiness: number
  yearsAtThisLocation: number
  yearBuilt: number
  yearOfLatestUpdate: number
  totalSqFootage: number
  anyLeasedOutSpace: 'Yes' | 'No'
  protectionClass: string
  additionalInsured: string
  
  // Security
  alarm: {
    burglar: boolean
    centralStation: boolean
    local: boolean
  }
  fire: {
    centralStation: boolean
    local: boolean
  }
  
  // Coverage Limits
  propertySection: {
    building: number
    bpp: number
    bi: number
    canopy: number
    pumps: number
    mAndG: number
  }
  
  // General Liability Exposure
  generalLiability: {
    insideSalesTotal: { monthly: number, yearly: number }
    liquorSales: { monthly: number, yearly: number }
    gasolineSales: { monthly: number, yearly: number }
    propaneFillingExchange: { monthly: number, yearly: number }
    carwash: { monthly: number, yearly: number }
    cooking: { monthly: number, yearly: number }
  }
  
  // Worker's Compensation
  workersCompensation: {
    fein: string
    noOfEmployees: number
    payroll: number
    inclExcl: string
    percentOwnership: number
  }
}
```

---

## Integration Approaches

### Option 1: API Webhook Integration (Recommended)
**How it works:**
- Eform project calls Coversheet API when "Start Quote" is clicked
- Coversheet creates submission draft with insured info
- Returns submission ID to eform
- Eform can redirect to Coversheet or show link

**Pros:**
- ✅ Projects remain independent
- ✅ Easy to deploy separately
- ✅ Can handle multiple eform projects
- ✅ Clear separation of concerns

**Cons:**
- ⚠️ Requires network call (latency)
- ⚠️ Need to handle API authentication
- ⚠️ Error handling across services

### Option 2: Shared Database
**How it works:**
- Both projects connect to same Neon database
- Eform writes directly to database
- Coversheet reads from database

**Pros:**
- ✅ No API calls needed
- ✅ Fast data access
- ✅ Single source of truth

**Cons:**
- ⚠️ Tight coupling between projects
- ⚠️ Database schema changes affect both
- ⚠️ Harder to scale independently

### Option 3: Message Queue (Advanced)
**How it works:**
- Eform publishes event to queue (Redis/RabbitMQ)
- Coversheet subscribes and processes
- Async processing

**Pros:**
- ✅ Decoupled systems
- ✅ Can handle high volume
- ✅ Retry mechanisms

**Cons:**
- ⚠️ More complex setup
- ⚠️ Additional infrastructure
- ⚠️ Overkill for current needs

---

## Recommended Approach: API Webhook Integration

### Architecture Flow

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
│  {                                  │
│    insuredInfo: {...},             │
│    agentId: "xxx",                  │
│    source: "eform"                  │
│  }                                  │
└────────┬────────────────────────────┘
         │
         │ Creates submission draft
         │
         ▼
┌─────────────────┐
│  Coversheet DB   │
│  - submissions  │
│  - insured_info  │
└─────────────────┘
         │
         │ Returns submission ID
         │
         ▼
┌─────────────────┐
│   Eform App     │
│  Redirects to:  │
│  /agent/submission/{id} │
└─────────────────┘
```

---

## Database Schema Changes

### Option A: Add Columns to Submissions Table (Simple)
```sql
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS insured_info JSONB DEFAULT '{}'::jsonb;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS eform_submission_id UUID;
```

**Pros:**
- ✅ Simple, no new tables
- ✅ All data in one place
- ✅ Easy queries

**Cons:**
- ⚠️ Large JSONB field
- ⚠️ Harder to query specific fields
- ⚠️ Less normalized

### Option B: Separate Insured Info Table (Recommended)
```sql
CREATE TABLE IF NOT EXISTS insured_information (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  
  -- Ownership & Basic Info
  ownership_type VARCHAR(50),
  corporation_name VARCHAR(255),
  contact_name VARCHAR(255),
  contact_number VARCHAR(50),
  contact_email VARCHAR(255),
  lead_source VARCHAR(255),
  proposed_effective_date DATE,
  prior_carrier VARCHAR(255),
  target_premium DECIMAL(10, 2),
  
  -- Business Structure
  applicant_is VARCHAR(50),
  operation_description TEXT,
  dba VARCHAR(255),
  address TEXT,
  
  -- Property Details
  hours_of_operation VARCHAR(50),
  no_of_mpos INTEGER,
  construction_type VARCHAR(100),
  years_exp_in_business INTEGER,
  years_at_location INTEGER,
  year_built INTEGER,
  year_latest_update INTEGER,
  total_sq_footage INTEGER,
  leased_out_space VARCHAR(10),
  protection_class VARCHAR(50),
  additional_insured TEXT,
  
  -- Security (JSONB for flexibility)
  alarm_info JSONB DEFAULT '{}'::jsonb,
  fire_info JSONB DEFAULT '{}'::jsonb,
  
  -- Coverage (JSONB for complex nested data)
  property_coverage JSONB DEFAULT '{}'::jsonb,
  general_liability JSONB DEFAULT '{}'::jsonb,
  workers_compensation JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(submission_id)
);
```

**Pros:**
- ✅ Normalized structure
- ✅ Easy to query specific fields
- ✅ Can add indexes
- ✅ Better for future reporting

**Cons:**
- ⚠️ More complex schema
- ⚠️ Requires JOINs for full data

### Option C: Hybrid Approach (Best Balance)
```sql
-- Keep basic info in submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS insured_info JSONB DEFAULT '{}'::jsonb;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS eform_submission_id UUID;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_submissions_source ON submissions(source);
CREATE INDEX IF NOT EXISTS idx_submissions_insured_info ON submissions USING GIN (insured_info);
```

**Pros:**
- ✅ Simple to implement
- ✅ Flexible JSONB for complex data
- ✅ Can query with JSONB operators
- ✅ Easy to extend

---

## Implementation Plan

### Phase 1: Database Schema Update
1. Add `insured_info` JSONB column to submissions
2. Add `source` column (values: 'manual', 'eform', 'ghl')
3. Add `eform_submission_id` for tracking
4. Create migration script

### Phase 2: API Endpoint Creation
1. Create `/api/integrations/eform` endpoint
2. Accept POST request with insured info
3. Validate data structure
4. Create submission with status 'draft'
5. Store insured info in JSONB
6. Return submission ID

### Phase 3: Eform Integration
1. Add API call in eform when "Start Quote" clicked
2. Handle authentication (API key or JWT)
3. Handle errors and retries
4. Redirect to Coversheet submission page

### Phase 4: UI Updates - Submission Detail View
1. **New Layout Structure:**
   ```
   ┌─────────────────────────────────┐
   │  Insured Information (Top)      │
   │  - All eform data displayed     │
   │  - Editable if draft            │
   └─────────────────────────────────┘
   ┌─────────────────────────────────┐
   │  Business Type Selection         │
   │  - Dropdown: 3 options          │
   │  - Required before showing      │
   │    carrier appetite              │
   └─────────────────────────────────┘
   ┌─────────────────────────────────┐
   │  Carrier Appetite & Quotes       │
   │  - Only shown after business     │
   │    type selected                 │
   └─────────────────────────────────┘
   ```

2. **Component Structure:**
   - `InsuredInfoSection.tsx` - Display/edit insured info
   - `BusinessTypeSelector.tsx` - Select from 3 LOBs
   - `CarrierAppetiteSection.tsx` - Existing carrier section

### Phase 5: Data Flow Logic
1. **Submission Creation Flow:**
   ```
   Eform submits → API creates draft
   → businessTypeId = NULL (not selected yet)
   → insuredInfo = full eform data
   → status = 'draft'
   ```

2. **Agent Workflow:**
   ```
   Agent opens draft
   → Sees insured info (read-only or editable)
   → Selects business type
   → System shows carrier appetite for that type
   → Agent adds quotes
   → Saves submission
   ```

---

## Key Questions to Clarify

### 1. Authentication & Authorization
- **Q:** How will eform authenticate with Coversheet API?
  - Option A: API Key (simple)
  - Option B: JWT token (more secure)
  - Option C: Shared secret

### 2. Agent Identification
- **Q:** How do we know which agent to assign the submission to?
  - Option A: Pass `agentId` from eform
  - Option B: Use `agentId` from authenticated user in eform
  - Option C: Auto-assign based on lead source or other criteria

### 3. Business Type Selection
- **Q:** Should business type be pre-selected in eform?
  - Option A: Yes, eform knows it's for C-Store/Gas Station
  - Option B: No, agent selects after seeing insured info
  - Option C: Auto-detect from insured info (address, hours, etc.)

### 4. Data Editing
- **Q:** Can agent edit insured info after eform submission?
  - Option A: Yes, fully editable
  - Option B: Read-only, but can add notes
  - Option C: Editable only if status is 'draft'

### 5. Submission Status
- **Q:** What status should eform submissions start with?
  - Option A: 'draft' (agent must review)
  - Option B: 'pending_review' (new status)
  - Option C: 'quoted' (if eform includes quotes)

### 6. Error Handling
- **Q:** What happens if API call fails?
  - Option A: Show error, user retries
  - Option B: Queue for retry
  - Option C: Save locally, sync later

### 7. Redirect Behavior
- **Q:** After "Start Quote", where should user go?
  - Option A: Redirect to Coversheet submission page
  - Option B: Stay in eform, show link
  - Option C: Open Coversheet in new tab/iframe

---

## Recommended Implementation Steps

### Step 1: Database Migration
```sql
-- Add columns to submissions table
ALTER TABLE submissions 
  ADD COLUMN IF NOT EXISTS insured_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS eform_submission_id UUID;

-- Add index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_submissions_insured_info 
  ON submissions USING GIN (insured_info);
```

### Step 2: Create API Endpoint
```typescript
// app/api/integrations/eform/route.ts
POST /api/integrations/eform
Body: {
  insuredInfo: { /* all eform data */ },
  agentId: string,
  source: 'eform'
}
Response: {
  submissionId: string,
  url: string
}
```

### Step 3: Update Submission Detail Component
- Add `InsuredInfoSection` at top
- Add `BusinessTypeSelector` (required before showing carriers)
- Modify carrier section to only show after business type selected

### Step 4: Update Submission Type
```typescript
interface Submission {
  // ... existing fields
  insuredInfo?: InsuredInformation;
  source?: 'manual' | 'eform' | 'ghl';
  eformSubmissionId?: string;
  businessTypeId?: string; // Now optional (can be null initially)
}
```

---

## Potential Issues & Solutions

### Issue 1: Business Type Not Selected
**Problem:** Submission created without businessTypeId
**Solution:** Make businessTypeId nullable, require it before showing carriers

### Issue 2: Large JSONB Data
**Problem:** Insured info might be large
**Solution:** Use JSONB compression, only load when needed

### Issue 3: Data Validation
**Problem:** Eform might send invalid data
**Solution:** Validate on API endpoint, return clear errors

### Issue 4: Concurrent Edits
**Problem:** Agent edits while eform updates
**Solution:** Use optimistic locking or version numbers

### Issue 5: Missing Required Fields
**Problem:** Eform might not have all required fields
**Solution:** Make insured info optional, validate on save

---

## Next Steps

1. **Clarify Questions Above** - Answer the 7 key questions
2. **Choose Database Approach** - Option A, B, or C
3. **Create Migration Script** - Update database schema
4. **Build API Endpoint** - Handle eform submissions
5. **Update UI Components** - New submission detail layout
6. **Test Integration** - End-to-end testing
7. **Deploy** - Roll out to production

---

## Questions for You

1. **Where is the eform project?** (Same repo, different repo, different server?)
2. **How should authentication work?** (API key, JWT, shared secret?)
3. **Who is the agent?** (How do we identify which agent gets the submission?)
4. **Can business type be pre-selected?** (Does eform know it's C-Store vs Gas Station?)
5. **Should insured info be editable?** (After eform submission, can agent change it?)
6. **What happens on error?** (If API fails, should eform retry or show error?)

Please answer these questions so we can finalize the implementation plan!

