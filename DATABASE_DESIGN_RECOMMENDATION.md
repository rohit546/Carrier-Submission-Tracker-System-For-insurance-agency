# Database Design Recommendation: Insured Information Storage

## Your Requirements Analysis

### Key Requirements:
1. ✅ **Single source of truth** - Shared database
2. ✅ **Same insured info → Multiple submissions** (one-to-many)
3. ✅ **Same insured info → Summary data** (future feature)
4. ✅ **InsuredInfo-centric** - Insured info is the primary entity

### Use Case Example:
```
XYZ LLC (Insured Info)
  ├── Submission 1 (Draft)
  ├── Submission 2 (Quoted)
  ├── Submission 3 (Bound)
  └── Summary Data (Future)
```

---

## Recommendation: **Separate Table (Normalized Design)**

### Why NOT JSON in Submissions Table?

**Problem 1: Data Duplication**
```sql
-- If XYZ LLC has 3 submissions, insured info is stored 3 times
submissions:
  id: 1, insured_info: {corp: "XYZ LLC", contact: "John", ...}
  id: 2, insured_info: {corp: "XYZ LLC", contact: "John", ...}  -- DUPLICATE!
  id: 3, insured_info: {corp: "XYZ LLC", contact: "John", ...}  -- DUPLICATE!
```

**Problem 2: Data Inconsistency**
- If contact info changes, need to update 3 records
- Risk of different data in different submissions
- No single source of truth

**Problem 3: Can't Query Easily**
```sql
-- Hard to find: "All submissions for XYZ LLC"
-- Need to search JSONB in every submission
SELECT * FROM submissions 
WHERE insured_info->>'corporation_name' = 'XYZ LLC';
-- Slow, can't use indexes efficiently
```

**Problem 4: Summary Data Problem**
- Where do you store summary data?
- Can't link summary to insured info easily
- Would need another table anyway

---

## Recommended Design: Separate Insured Information Table

### Database Schema

```sql
-- Insured Information Table (Primary Entity)
CREATE TABLE IF NOT EXISTS insured_information (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Unique identifier (to prevent duplicates)
  -- Could be corporation name + address, or FEIN, or custom ID
  unique_identifier VARCHAR(255) UNIQUE,
  
  -- Ownership & Basic Info
  ownership_type VARCHAR(50),
  corporation_name VARCHAR(255) NOT NULL,
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
  
  -- Security (JSONB for flexibility - arrays/objects)
  alarm_info JSONB DEFAULT '{}'::jsonb,
  fire_info JSONB DEFAULT '{}'::jsonb,
  
  -- Coverage (JSONB for complex nested structures)
  property_coverage JSONB DEFAULT '{}'::jsonb,
  general_liability JSONB DEFAULT '{}'::jsonb,
  workers_compensation JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'eform', 'ghl'
  eform_submission_id UUID, -- If came from eform
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes for common queries
  CONSTRAINT insured_info_corporation_name_check CHECK (corporation_name IS NOT NULL AND corporation_name != '')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insured_info_corporation ON insured_information(corporation_name);
CREATE INDEX IF NOT EXISTS idx_insured_info_unique_id ON insured_information(unique_identifier);
CREATE INDEX IF NOT EXISTS idx_insured_info_source ON insured_information(source);
CREATE INDEX IF NOT EXISTS idx_insured_info_created ON insured_information(created_at);

-- Update Submissions Table
ALTER TABLE submissions 
  ADD COLUMN IF NOT EXISTS insured_info_id UUID REFERENCES insured_information(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- Make business_type_id nullable (for eform submissions that haven't selected yet)
ALTER TABLE submissions 
  ALTER COLUMN business_type_id DROP NOT NULL;

-- Index for insured info lookups
CREATE INDEX IF NOT EXISTS idx_submissions_insured_info ON submissions(insured_info_id);

-- Future: Summary Data Table
CREATE TABLE IF NOT EXISTS insured_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insured_info_id UUID NOT NULL REFERENCES insured_information(id) ON DELETE CASCADE,
  
  -- Summary data fields (to be defined)
  summary_data JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_summaries_insured_info ON insured_summaries(insured_info_id);
```

---

## Data Relationships

```
┌─────────────────────────┐
│ insured_information     │ (1)
│ - id (PK)               │
│ - corporation_name      │
│ - contact_name          │
│ - ... (all insured data)│
└───────────┬─────────────┘
            │
            │ (1 to many)
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌──────────┐   ┌──────────────┐
│submissions│   │summaries     │
│- id (PK) │   │- id (PK)      │
│- insured_│   │- insured_info_│
│  info_id │   │  id (FK)      │
│- business│   │- summary_data │
│  type_id │   └──────────────┘
│- status  │
└──────────┘
```

---

## Benefits of This Design

### 1. Single Source of Truth ✅
```sql
-- One record for XYZ LLC
insured_information: {id: 123, corporation_name: "XYZ LLC", ...}

-- Multiple submissions reference it
submissions: 
  {id: 1, insured_info_id: 123, status: 'draft'}
  {id: 2, insured_info_id: 123, status: 'quoted'}
  {id: 3, insured_info_id: 123, status: 'bound'}
```

### 2. Easy Queries ✅
```sql
-- Find all submissions for XYZ LLC
SELECT s.* 
FROM submissions s
JOIN insured_information i ON s.insured_info_id = i.id
WHERE i.corporation_name = 'XYZ LLC';

-- Find insured info with submission count
SELECT 
  i.*,
  COUNT(s.id) as submission_count
FROM insured_information i
LEFT JOIN submissions s ON s.insured_info_id = i.id
GROUP BY i.id;
```

### 3. Data Consistency ✅
- Update insured info once, all submissions see the change
- Or: Keep historical snapshots (see "Historical Data" section)

### 4. Future-Proof ✅
- Easy to add summary table
- Easy to add more related data
- Can add indexes for performance
- Can add constraints for validation

### 5. Performance ✅
- Indexes on foreign keys
- Fast JOINs
- Can query specific fields without parsing JSON

---

## Handling Updates: Historical vs Current

### Option A: Always Use Latest (Simple)
```sql
-- All submissions always see latest insured info
SELECT s.*, i.*
FROM submissions s
JOIN insured_information i ON s.insured_info_id = i.id;
```

**Pros:** Simple, always current
**Cons:** If insured info changes, old submissions show new data

### Option B: Snapshot on Submission Creation (Recommended)
```sql
-- Store snapshot when submission is created
ALTER TABLE submissions 
  ADD COLUMN insured_info_snapshot JSONB;

-- When creating submission, copy insured info
INSERT INTO submissions (..., insured_info_id, insured_info_snapshot)
VALUES (..., 123, (SELECT to_jsonb(i.*) FROM insured_information i WHERE id = 123));
```

**Pros:** Historical accuracy, can see what data was at submission time
**Cons:** Slightly more complex

### Option C: Version History (Advanced)
```sql
CREATE TABLE insured_information_history (
  id UUID PRIMARY KEY,
  insured_info_id UUID,
  version INTEGER,
  data JSONB,
  created_at TIMESTAMP
);
```

**Pros:** Full audit trail
**Cons:** Most complex

---

## Recommended Approach: Hybrid (Best Balance)

```sql
-- Keep current data in insured_information table
-- Store snapshot in submissions for historical reference
-- Use insured_info_id for linking and queries

-- When displaying submission:
-- 1. Show snapshot (what was at submission time)
-- 2. Show link to current insured info (if different)
-- 3. Allow updating current insured info (affects future submissions)
```

---

## Implementation Strategy

### Step 1: Create Insured Information Table
```sql
-- Migration script
CREATE TABLE insured_information (...);
```

### Step 2: Update Submissions Table
```sql
ALTER TABLE submissions 
  ADD COLUMN insured_info_id UUID,
  ADD COLUMN insured_info_snapshot JSONB,
  ALTER COLUMN business_type_id DROP NOT NULL;
```

### Step 3: Migration of Existing Data
```sql
-- For existing submissions without insured info:
-- Create insured_information record from business_name
-- Link submission to it
```

### Step 4: Update Application Code
```typescript
// Create insured info first
const insuredInfo = await createInsuredInformation(data);

// Then create submission
const submission = await createSubmission({
  insuredInfoId: insuredInfo.id,
  insuredInfoSnapshot: insuredInfo, // Store snapshot
  businessTypeId: null, // Can be null initially
  ...
});
```

---

## Query Examples

### Find All Submissions for an Insured
```sql
SELECT s.*, i.corporation_name, i.contact_name
FROM submissions s
JOIN insured_information i ON s.insured_info_id = i.id
WHERE i.corporation_name = 'XYZ LLC'
ORDER BY s.created_at DESC;
```

### Find Insured Info with Latest Submission
```sql
SELECT 
  i.*,
  s.id as latest_submission_id,
  s.status as latest_status
FROM insured_information i
LEFT JOIN LATERAL (
  SELECT * FROM submissions 
  WHERE insured_info_id = i.id 
  ORDER BY created_at DESC 
  LIMIT 1
) s ON true;
```

### Find Insured Info with Submission Count
```sql
SELECT 
  i.*,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.status = 'bound' THEN 1 END) as bound_count
FROM insured_information i
LEFT JOIN submissions s ON s.insured_info_id = i.id
GROUP BY i.id;
```

---

## Summary: Why Separate Table is Better

| Aspect | JSON in Submissions | Separate Table |
|--------|---------------------|----------------|
| **Data Duplication** | ❌ Yes (3x for 3 submissions) | ✅ No (one record) |
| **Data Consistency** | ❌ Hard to maintain | ✅ Single source |
| **Query Performance** | ❌ Slow (JSONB search) | ✅ Fast (indexed JOINs) |
| **Multiple Submissions** | ❌ Duplicate data | ✅ One-to-many relationship |
| **Summary Data** | ❌ Need another table | ✅ Easy to add |
| **Updates** | ❌ Update all records | ✅ Update one record |
| **Historical Data** | ❌ Hard to track | ✅ Easy with snapshots |
| **Scalability** | ❌ Poor | ✅ Excellent |

---

## Final Recommendation

**Use a separate `insured_information` table** because:

1. ✅ **Single source of truth** - One record per insured
2. ✅ **Supports multiple submissions** - One-to-many relationship
3. ✅ **Future-proof** - Easy to add summaries
4. ✅ **Better queries** - Indexed, fast JOINs
5. ✅ **Data consistency** - Update once, affects all
6. ✅ **Flexible** - Can add snapshot for historical data

**Hybrid JSONB Usage:**
- Use JSONB for complex nested data (alarm_info, fire_info, coverage)
- Use regular columns for frequently queried fields (corporation_name, contact_email)
- Best of both worlds!

---

## Next Steps

1. **Confirm this approach** - Does this meet your needs?
2. **Define unique_identifier** - How to identify same insured? (FEIN, corp+address, etc.)
3. **Create migration script** - Update database schema
4. **Update application code** - Modify submission creation flow
5. **Add insured info management** - UI to view/edit insured info

Would you like me to proceed with creating the migration script and updating the code?

