# What Happens When User Clicks "Start Quote"

## Complete Flow Explanation

---

## Step 1: User Clicks "Start Quote" Button

**Location:** In your eform, after user submits the application

**What happens:**
- Button redirects user to Coversheet using the URL:
  ```
  https://your-coversheet-domain.com/agent/submission/{submissionId}?token={publicAccessToken}
  ```

---

## Step 2: User Lands on Coversheet Submission Page

**URL:** `/agent/submission/[id]?token=[token]`

**What happens:**
1. **Coversheet checks the token:**
   - Verifies `public_access_token` matches the submission
   - If valid → allows access (no login needed!)
   - If invalid → redirects to login page

2. **Coversheet loads the submission:**
   - Fetches submission data from database
   - Loads insured information (from `insured_info_snapshot`)
   - Loads business types
   - Loads carriers

---

## Step 3: User Sees the Submission Page

**What the user sees:**

### Top Section: Submission Header
- **Business Name** (from eform: `corporationName`)
- **Status Badge** (shows "Draft" initially)
- **Back to List** button

### Insured Information Section
- **All the data from eform is displayed:**
  - Corporation Name
  - Contact Name, Email, Phone
  - Address
  - Property Details (sq footage, year built, etc.)
  - Coverage Information (if provided)
  - Security Systems (alarm, fire)
  - All other fields from the eform

### Business Type Selection
- **Dropdown menu** with business types:
  - C-Store/Grocery Store
  - Gas Station (18 hours)
  - Gas Station (24 hours)
- User **must select one** to proceed
- Once selected, carriers appear below

### Carrier Appetite Section
- **Only shows after business type is selected**
- Shows all carriers that have appetite for that business type
- Each carrier shows:
  - **Status badge** (Active, Limited, Unresponsive)
  - **Geographic restrictions**
  - **Exclusions**
  - **Coverage details**
  - **Operational criteria**
  - **Contact information**
  - **Notes**

### Quote Section (for each carrier)
- **Checkbox** to mark carrier as "Quoted"
- **Quoted Amount** field (if quoted)
- **Remarks** textarea (for notes about the quote)
- **Selected** checkbox (to mark final selection)

### Save Button (at bottom)
- **Sticky button** that saves all changes
- Shows "Saved!" confirmation when clicked

---

## Step 4: User Can Work on Submission

**What user can do:**

1. **View all their insured information** (pre-filled from eform)
2. **Select business type** (required)
3. **See carrier appetite** (automatically loaded based on business type)
4. **Add quotes:**
   - Check "Quoted" for carriers
   - Enter quoted amounts
   - Add remarks
   - Mark carriers as "Selected"
5. **Save changes** (click "Save" button)
6. **Come back later** (link remains valid, no login needed)

---

## Step 5: User Can Access Later

**How it works:**
- The URL with token remains valid
- User can bookmark it
- User can share it (if needed)
- No expiration (unless you add one later)

**If user wants to see all their submissions:**
- They can log in to Coversheet (if they have an account)
- Or use the direct link each time

---

## Visual Flow Diagram

```
┌─────────────────────┐
│   Eform Page        │
│                     │
│  [Submit Application]│
│  [Download PDF]     │
│  [Start Quote] ←──┐  │
└─────────────────────┘  │
                         │
                         │ Click
                         │
                         ▼
┌─────────────────────────────────────────────┐
│  Coversheet Submission Page                 │
│  /agent/submission/[id]?token=[token]     │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Insured Information (from eform)    │   │
│  │ - Corporation Name                 │   │
│  │ - Contact Info                     │   │
│  │ - Property Details                 │   │
│  │ - Coverage Info                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Select Business Type: [Dropdown]    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Available Carriers (after selection)│   │
│  │                                     │   │
│  │ [✓] Carrier 1 - Active             │   │
│  │     Quoted: [ ] Amount: [____]     │   │
│  │     Remarks: [____________]        │   │
│  │                                     │   │
│  │ [✓] Carrier 2 - Limited             │   │
│  │     ...                             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Save Button]                              │
└─────────────────────────────────────────────┘
```

---

## Key Points

### ✅ No Login Required
- Token in URL provides access
- User doesn't need to create account
- User doesn't need to remember password

### ✅ All Data Pre-filled
- Everything from eform is already there
- User just needs to:
  1. Select business type
  2. Add quotes
  3. Save

### ✅ User Can See Their Submission
- In the submission list (if they log in)
- Or via the direct link (no login needed)

### ✅ User Can Edit Later
- Link remains valid
- Can add/update quotes anytime
- Can change business type
- Can add remarks

---

## Example: Complete User Journey

1. **User fills eform** → Clicks "Submit Application"
2. **Data saves to database** → Submission created
3. **User sees buttons:** "Download PDF", "Start Quote"
4. **User clicks "Start Quote"** → Redirected to Coversheet
5. **User sees their data** → All insured info displayed
6. **User selects business type** → "C-Store/Grocery Store"
7. **Carriers appear** → Shows all carriers with appetite
8. **User adds quotes:**
   - Checks "Quoted" for Carrier A
   - Enters amount: $5,000
   - Adds remark: "Good rate, responsive"
   - Marks as "Selected"
9. **User clicks "Save"** → Changes saved to database
10. **User can come back later** → Same link works, sees updated data

---

## Technical Details

### URL Structure
```
https://coversheet-domain.com/agent/submission/{submissionId}?token={publicAccessToken}
```

### Token Validation
- Server checks: `submissions.public_access_token = token`
- If match → allow access
- If no match → redirect to login

### Data Loading
- Submission data from `submissions` table
- Insured info from `insured_info_snapshot` (JSONB)
- Business types from `business_types` table
- Carriers from `carriers` table
- Carrier appetite from `carrier_appetite` table

### Saving Changes
- Updates `submissions` table
- Updates `carrier_quotes` table
- All changes persist to database

---

## Summary

**When user clicks "Start Quote":**

1. ✅ Redirects to Coversheet (no login)
2. ✅ Sees all their eform data pre-filled
3. ✅ Selects business type
4. ✅ Sees carrier appetite
5. ✅ Adds quotes and remarks
6. ✅ Saves changes
7. ✅ Can access anytime via same link

**It's that simple!** 🎉

