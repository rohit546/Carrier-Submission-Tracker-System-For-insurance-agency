# Non-Standard Market Tracking - Simplified Plan

## Overview
Track email submissions to non-standard carriers: email status, quotes received, and followups.

## Database Schema Design

### Single Table: `non_standard_submissions`
**Purpose**: Track everything in one place - emails, quotes, status, and followups

**Connection to Submissions:**
- `submission_id` is a **foreign key** that links to `submissions.id`
- One submission can have **multiple** non-standard submissions (if you send emails multiple times)
- When a submission is deleted, all related non-standard submissions are automatically deleted (CASCADE)

```sql
CREATE TABLE non_standard_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  
  -- Email Details
  from_email VARCHAR(255) NOT NULL,
  to_emails TEXT[] NOT NULL, -- Array of recipient emails
  cc_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Status
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN (
    'sent',      -- Email sent
    'responded', -- Carrier responded
    'quoted',    -- Quote received
    'declined',  -- Declined
    'bound'      -- Policy bound
  )),
  
  -- Quotes (stored as JSONB array for simplicity)
  quotes JSONB DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [
  --   {
  --     "carrier": "Company Name",
  --     "email": "carrier@email.com",
  --     "amount": 5000.00,
  --     "received_date": "2026-01-22",
  --     "notes": "Quote details"
  --   }
  -- ]
  
  -- Followups (stored as JSONB array for simplicity)
  followups JSONB DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [
  --   {
  --     "date": "2026-01-23T10:00:00Z",
  --     "type": "email" | "phone" | "meeting" | "note",
  --     "with": "carrier@email.com",
  --     "notes": "Followup details",
  --     "created_by": "agent@email.com"
  --   }
  -- ]
  
  -- Last Activity
  last_activity_at TIMESTAMP,
  last_activity_type VARCHAR(50), -- 'email', 'quote', 'followup'
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_non_standard_submission_id ON non_standard_submissions(submission_id);
CREATE INDEX idx_non_standard_status ON non_standard_submissions(status);
CREATE INDEX idx_non_standard_sent_at ON non_standard_submissions(sent_at);
```

## Relationship & Queries

### Database Relationship

```
submissions table                    non_standard_submissions table
┌─────────────────┐                 ┌──────────────────────────────┐
│ id (UUID)       │◄────────────────│ submission_id (FK)          │
│ business_name   │                 │ id (UUID)                   │
│ status          │                 │ from_email                  │
│ ...             │                 │ to_emails[]                 │
└─────────────────┘                 │ quotes[]                    │
                                    │ followups[]                 │
                                    │ status                      │
                                    └──────────────────────────────┘
```

**Key Points:**
- `submission_id` in `non_standard_submissions` references `submissions.id`
- **One submission** can have **many non-standard submissions** (multiple emails sent)
- Foreign key ensures data integrity (can't create non-standard submission without valid submission)
- CASCADE delete: If submission is deleted, all related non-standard submissions are deleted

### How to Find Non-Standard Submissions for a Submission

**Get all non-standard submissions for a specific submission:**
```sql
SELECT * FROM non_standard_submissions 
WHERE submission_id = 'submission-uuid-here';
```

**Get submission with non-standard submission info:**
```sql
SELECT 
  s.*,
  nss.id as non_standard_id,
  nss.status as non_standard_status,
  nss.sent_at,
  jsonb_array_length(nss.quotes) as quote_count
FROM submissions s
LEFT JOIN non_standard_submissions nss ON s.id = nss.submission_id
WHERE s.id = 'submission-uuid-here';
```

**Find all submissions that have non-standard submissions:**
```sql
SELECT DISTINCT s.*
FROM submissions s
INNER JOIN non_standard_submissions nss ON s.id = nss.submission_id;
```

**Check if a submission has non-standard submissions:**
```sql
SELECT EXISTS(
  SELECT 1 FROM non_standard_submissions 
  WHERE submission_id = 'submission-uuid-here'
) as has_non_standard;
```

### UI Indicator

**In Submission List:**
- Add a badge/icon next to submissions that have non-standard submissions
- Query: Check if `non_standard_submissions` table has any records for that `submission_id`

**In Submission Detail Page:**
- Show "Non-Standard Market" section only if records exist
- Query: `SELECT * FROM non_standard_submissions WHERE submission_id = ?`

## How It Works

### 1. When Email is Sent
- Create new record in `non_standard_submissions`
- Store email details (from, to, subject, body)
- Set status = 'sent'
- Set `sent_at` = current time

### 2. When Quote is Received
- Update the record's `quotes` JSONB array
- Add new quote object with carrier, amount, date
- Update status to 'quoted' (if first quote)
- Update `last_activity_at` and `last_activity_type`

### 3. When Followup Happens
- Update the record's `followups` JSONB array
- Add new followup object with date, type, notes
- Update `last_activity_at` and `last_activity_type`

### 4. Status Updates
- Change `status` field when appropriate
- Update `last_activity_at` timestamp

## UI Display

### On Submission Detail Page

**Non-Standard Market Section:**
1. **Email Status Card**
   - Sent date
   - Recipients (to emails)
   - Subject
   - Current status badge

2. **Quotes Received**
   - List of quotes from `quotes` array
   - Show: Carrier, Amount, Date
   - Add Quote button

3. **Followups**
   - Timeline of followups from `followups` array
   - Show: Date, Type, With, Notes
   - Add Followup button

4. **Quick Actions**
   - Update Status dropdown
   - Add Quote
   - Add Followup
   - Add Note

## API Endpoints

1. `POST /api/submissions/[id]/non-standard` - Create new non-standard submission (when email sent)
2. `GET /api/submissions/[id]/non-standard` - Get non-standard submission for a submission
3. `PUT /api/non-standard/[id]` - Update status, add quote, add followup
4. `PUT /api/non-standard/[id]/status` - Update status only
5. `POST /api/non-standard/[id]/quotes` - Add a quote
6. `POST /api/non-standard/[id]/followups` - Add a followup

## Data Structure Examples

### Quotes Array
```json
[
  {
    "id": "unique-id-1",
    "carrier": "Tower Stone",
    "email": "matthew.cummins@towerstonecorp.com",
    "amount": 5000.00,
    "received_date": "2026-01-22",
    "notes": "Good quote, reviewing",
    "status": "reviewing"
  }
]
```

### Followups Array
```json
[
  {
    "id": "unique-id-1",
    "date": "2026-01-23T10:00:00Z",
    "type": "phone",
    "with": "matthew.cummins@towerstonecorp.com",
    "notes": "Called to discuss quote details",
    "created_by": "agent@mckinneyandco.com"
  },
  {
    "id": "unique-id-2",
    "date": "2026-01-24T14:00:00Z",
    "type": "email",
    "with": "matthew.cummins@towerstonecorp.com",
    "notes": "Sent followup email",
    "created_by": "agent@mckinneyandco.com"
  }
]
```

## Benefits of Simplified Approach

✅ **Single table** - Easy to query and maintain  
✅ **JSONB arrays** - Flexible, no complex joins  
✅ **Simple status** - One status field  
✅ **Easy to extend** - Add fields to JSONB without migrations  
✅ **Fast queries** - All data in one place  

## Migration

1. Create `non_standard_submissions` table
2. Update AutoSubmitModal to save email to database
3. Add UI section to submission detail page
4. Add API endpoints for quotes and followups
