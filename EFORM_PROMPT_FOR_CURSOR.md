# Eform Integration Prompt for Cursor

## Context
You are working on an eform project. You need to integrate with Coversheet (a separate Next.js app) so that when users submit their form, the data is saved and they can access it in Coversheet.

---

## Database Schema

### Table: `insured_information`

This table stores all the insured information from the eform. Use this schema:

```sql
CREATE TABLE IF NOT EXISTS insured_information (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  
  -- Security (JSONB)
  alarm_info JSONB DEFAULT '{}'::jsonb,
  fire_info JSONB DEFAULT '{}'::jsonb,
  
  -- Coverage (JSONB)
  property_coverage JSONB DEFAULT '{}'::jsonb,
  general_liability JSONB DEFAULT '{}'::jsonb,
  workers_compensation JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  source VARCHAR(50) DEFAULT 'eform',
  eform_submission_id UUID, -- Your eform's submission ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `submissions`

This table stores the submission record that links to Coversheet:

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name VARCHAR(255) NOT NULL,
  business_type_id UUID, -- Can be NULL initially
  agent_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'draft',
  insured_info_id UUID REFERENCES insured_information(id),
  insured_info_snapshot JSONB,
  source VARCHAR(50) DEFAULT 'eform',
  eform_submission_id UUID, -- Your eform's submission ID
  public_access_token UUID UNIQUE, -- For no-auth access
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## What You Need to Do

### Step 1: On "Submit Application" Button - AUTO-CREATE SUBMISSION

**IMPORTANT:** When user clicks "Submit Application", you MUST automatically create a submission in the Coversheet database. This makes it appear in Coversheet's "My Submissions" list immediately.

**What to do:**

1. **Save to `insured_information` table:**
   - Map all form fields to the schema above
   - Generate `unique_identifier` from `corporation_name + address`
   - Set `source = 'eform'`
   - Store your eform's submission ID in `eform_submission_id`

2. **AUTO-CREATE submission in `submissions` table:**
   - **This is CRITICAL** - submission must be created here so it appears in Coversheet
   - Link to the `insured_information` record you just created
   - Set `business_name` = `corporation_name`
   - Set `status = 'draft'`
   - Set `source = 'eform'` (so it shows "NEW" tag in Coversheet)
   - **Assign to an agent** (`agent_id`) - get first agent from database or assign to specific agent
   - Generate a `public_access_token` (UUID)
   - Store snapshot of insured info in `insured_info_snapshot` (JSONB)
   - Store your eform's submission ID in `eform_submission_id`
   - Set `business_type_id = NULL` (will be selected later in Coversheet)

3. **Save the `public_access_token` and `submission_id`** - you'll need these for the "Start Quote" button

**Result:** Submission is now in Coversheet database and will appear in agent's "My Submissions" list with a "NEW" tag!

### Step 2: Add "Start Quote" Button (Just a Redirect)

After "Download PDF" and "Start New" buttons, add a new button:

**Button Text:** "Start Quote"

**Button Action (Just redirects - doesn't create anything):**
```typescript
const handleStartQuote = () => {
  // Use the public_access_token and submission_id from Step 1
  // This is just a convenience link - submission already exists in database
  const coversheetUrl = `https://your-coversheet-domain.com/agent/submission/${submissionId}?token=${publicAccessToken}`;
  window.location.href = coversheetUrl;
};
```

**Where to place it:**
- After "Download PDF" button
- Before or after "Start New" button
- Same styling as other buttons

**Note:** This button is just for convenience. The submission is already in Coversheet database and visible in "My Submissions" list. This button just redirects the user to it.

---

## Example Code Structure

```typescript
// When user clicks "Submit Application"
const handleSubmitApplication = async () => {
  // 1. Collect all form data
  const formData = {
    corporationName: form.corporationName,
    contactName: form.contactName,
    // ... all other fields
  };
  
  // 2. Save to insured_information table
  const insuredInfo = await saveToInsuredInformation(formData);
  
  // 3. Get default agent (or assign to specific agent)
  // IMPORTANT: Get the first agent from database, or assign to a specific agent
  const agent = await getDefaultAgent(); // You need to implement this
  
  // 4. Create submission in Coversheet database
  // This will automatically appear in Coversheet's "My Submissions" list
  const submission = await createSubmission({
    insuredInfoId: insuredInfo.id,
    businessName: formData.corporationName,
    agentId: agent.id, // Assign to an agent so it appears in their list
    status: 'draft',
    source: 'eform', // IMPORTANT: Mark as 'eform' so it shows "NEW" tag
    eformSubmissionId: yourEformSubmissionId,
    publicAccessToken: generateUUID(),
    insuredInfoSnapshot: insuredInfo, // Store snapshot
  });
  
  // 5. Store submission.id and submission.publicAccessToken for later use
  setSubmissionId(submission.id);
  setPublicAccessToken(submission.publicAccessToken);
  
  // 6. Show success message
  // 7. Show "Download PDF" and "Start Quote" buttons
  // NOTE: Submission is now automatically in Coversheet with "NEW" tag!
};

// "Start Quote" button handler
const handleStartQuote = () => {
  const coversheetUrl = `https://your-coversheet-domain.com/agent/submission/${submissionId}?token=${publicAccessToken}`;
  window.location.href = coversheetUrl;
};
```

---

## Important Notes

1. **Database Connection:** Use the same Neon PostgreSQL database that Coversheet uses (shared database)

2. **public_access_token:** This allows users to access their submission without logging in. Generate a UUID for each submission.

3. **Coversheet URL:** Replace `https://your-coversheet-domain.com` with your actual Coversheet URL (e.g., `http://localhost:3000` for local, or production URL)

4. **Field Mapping:** Map your eform fields to match the schema. Not all fields are required - only `corporation_name` is required.

5. **JSONB Fields:** For `alarm_info`, `fire_info`, `property_coverage`, `general_liability`, `workers_compensation` - store as JSON objects.

---

## Simple Implementation Checklist

- [ ] On "Submit Application": Save to `insured_information` table
- [ ] On "Submit Application": **AUTO-CREATE** record in `submissions` table (with `source='eform'` and `agent_id`)
- [ ] Store `submission_id` and `public_access_token` after submission
- [ ] Add "Start Quote" button after "Download PDF" (just a redirect link)
- [ ] "Start Quote" button redirects to: `https://coversheet-url/agent/submission/{id}?token={token}`
- [ ] Test: Submission automatically appears in Coversheet "My Submissions" list with "NEW" tag
- [ ] Test: User can see submission in Coversheet without clicking "Start Quote"
- [ ] Test: "Start Quote" button just redirects (doesn't create anything)

---

## That's It!

Keep it simple:
1. **On "Submit Application":** Save data AND auto-create submission in Coversheet database
2. **Submission automatically appears** in Coversheet "My Submissions" list with "NEW" tag
3. **Add "Start Quote" button:** Just a redirect link (convenience only)
4. **User can access submission** either:
   - Via "Start Quote" button (redirects to submission)
   - Or directly in Coversheet "My Submissions" list (already there!)

**Key Point:** Submission is created in database when form is submitted. "Start Quote" is just a convenience redirect - the submission already exists!

