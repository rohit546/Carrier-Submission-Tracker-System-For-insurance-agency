# What Happens If User Doesn't Click "Start Quote" Immediately?

## The Problem

User fills eform → Submits → Doesn't click "Start Quote" → Comes back 1 hour later

**Question:** Will they need to fill the form again?

**Answer:** **NO!** The data is already saved. Here's how to handle it:

---

## Solution: Store Submission Info in Eform

### Step 1: When User Submits Eform

**Save these in your eform's state/storage:**

```typescript
// After creating submission in database
const submission = await createSubmission({
  insuredInfoId: insuredInfo.id,
  businessName: formData.corporationName,
  eformSubmissionId: yourEformSubmissionId,
  publicAccessToken: generateUUID(),
});

// STORE THESE LOCALLY (so user can access later)
localStorage.setItem('lastSubmissionId', submission.id);
localStorage.setItem('lastSubmissionToken', submission.publicAccessToken);
localStorage.setItem('lastSubmissionDate', new Date().toISOString());
```

### Step 2: Check on Page Load

**When eform page loads, check if user has a saved submission:**

```typescript
useEffect(() => {
  // Check if user has a saved submission
  const savedSubmissionId = localStorage.getItem('lastSubmissionId');
  const savedToken = localStorage.getItem('lastSubmissionToken');
  const savedDate = localStorage.getItem('lastSubmissionDate');
  
  if (savedSubmissionId && savedToken) {
    // Check if it's recent (within last 30 days, or whatever you want)
    const submissionDate = new Date(savedDate);
    const daysSince = (Date.now() - submissionDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince < 30) {
      // Show "Continue to Quote" button
      setHasExistingSubmission(true);
      setSubmissionId(savedSubmissionId);
      setPublicAccessToken(savedToken);
    }
  }
}, []);
```

### Step 3: Show "Continue to Quote" Button

**If user has existing submission, show this instead of "Start Quote":**

```typescript
{hasExistingSubmission ? (
  <button onClick={handleContinueToQuote} className="btn-primary">
    Continue to Quote
  </button>
) : (
  <button onClick={handleStartQuote} className="btn-primary">
    Start Quote
  </button>
)}
```

---

## Alternative: Show Submission in Coversheet List

### Option A: User Logs In to Coversheet

**If user has a Coversheet account:**
1. User logs in to Coversheet
2. Goes to `/agent` page
3. Sees all submissions (including theirs)
4. Clicks on their submission
5. Continues working

**How to link eform user to Coversheet:**
- Store `agentId` when creating submission
- Or create a user account in Coversheet with same email

### Option B: Show Submission List by Email

**Create a public page that shows submissions by email:**

```typescript
// In Coversheet: app/submissions/by-email/page.tsx
// User enters email → sees their submissions
// No login needed, just email verification
```

---

## Recommended Solution: Hybrid Approach

### Best Practice:

1. **Store submission info in eform localStorage**
   - Submission ID
   - Public token
   - Submission date

2. **Show "Continue to Quote" button if exists**
   - Check localStorage on page load
   - If found → show "Continue to Quote"
   - If not found → show "Start Quote" (after submit)

3. **Also allow access via Coversheet login**
   - User can log in to Coversheet
   - See all their submissions
   - Continue working

---

## Complete Flow Example

### Scenario 1: User Submits and Clicks "Start Quote" Immediately

```
Eform Submit → Save to DB → Show "Start Quote" → User clicks → Goes to Coversheet
```

### Scenario 2: User Submits but Doesn't Click "Start Quote"

```
Eform Submit → Save to DB → Save to localStorage → User leaves
                                                      │
                                                      │ (1 hour later)
                                                      ▼
User returns → Eform checks localStorage → Finds submission → Shows "Continue to Quote"
                                                      │
                                                      │ User clicks
                                                      ▼
                                            Goes to Coversheet (same link)
```

### Scenario 3: User Returns After Days/No localStorage

```
User returns → Eform checks localStorage → Not found/expired
                                                      │
                                                      │ Option 1: Fill form again
                                                      │ Option 2: Log in to Coversheet
                                                      │ Option 3: Enter email to see submissions
```

---

## Implementation in Eform

### Code Example:

```typescript
// After submission is created
const handleSubmitApplication = async () => {
  // ... save to database ...
  
  const submission = await createSubmission({
    insuredInfoId: insuredInfo.id,
    businessName: formData.corporationName,
    eformSubmissionId: yourEformSubmissionId,
    publicAccessToken: generateUUID(),
  });
  
  // Save to localStorage for later access
  localStorage.setItem('lastSubmissionId', submission.id);
  localStorage.setItem('lastSubmissionToken', submission.publicAccessToken);
  localStorage.setItem('lastSubmissionDate', new Date().toISOString());
  localStorage.setItem('lastSubmissionName', formData.corporationName);
  
  // Show success and buttons
  setShowSuccess(true);
  setSubmissionId(submission.id);
  setPublicAccessToken(submission.publicAccessToken);
};

// Check on page load
useEffect(() => {
  const savedId = localStorage.getItem('lastSubmissionId');
  const savedToken = localStorage.getItem('lastSubmissionToken');
  const savedDate = localStorage.getItem('lastSubmissionDate');
  const savedName = localStorage.getItem('lastSubmissionName');
  
  if (savedId && savedToken) {
    // Check if recent (within 30 days)
    const daysSince = (Date.now() - new Date(savedDate).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince < 30) {
      setHasExistingSubmission(true);
      setSubmissionId(savedId);
      setPublicAccessToken(savedToken);
      setSubmissionName(savedName);
    } else {
      // Clear old submission
      localStorage.removeItem('lastSubmissionId');
      localStorage.removeItem('lastSubmissionToken');
      localStorage.removeItem('lastSubmissionDate');
      localStorage.removeItem('lastSubmissionName');
    }
  }
}, []);

// Render buttons
{hasExistingSubmission ? (
  <div className="existing-submission-banner">
    <p>You have an existing submission for: <strong>{submissionName}</strong></p>
    <button onClick={handleContinueToQuote} className="btn-primary">
      Continue to Quote
    </button>
    <button onClick={handleStartNew} className="btn-secondary">
      Start New Submission
    </button>
  </div>
) : (
  showSuccess && (
    <>
      <button onClick={handleStartQuote} className="btn-primary">
        Start Quote
      </button>
      <button onClick={handleDownloadPDF} className="btn-secondary">
        Download PDF
      </button>
    </>
  )
)}
```

---

## Summary

### ✅ What Happens:

1. **User submits eform** → Data saved to database
2. **Submission info saved to localStorage** → For later access
3. **User returns later** → Eform checks localStorage
4. **If found** → Shows "Continue to Quote" button
5. **User clicks** → Goes to Coversheet (same link, data still there)
6. **User continues** → No need to fill form again!

### ✅ Key Points:

- **Data is always saved** in database (never lost)
- **localStorage helps** user find their submission quickly
- **Link remains valid** (token doesn't expire)
- **User can also log in** to Coversheet to see all submissions
- **No need to fill form again** - data is already there!

---

## Additional Features (Optional)

### 1. Show Submission Status

```typescript
// Fetch submission status from Coversheet
const checkSubmissionStatus = async () => {
  const response = await fetch(
    `https://coversheet-domain.com/api/submissions/${submissionId}?token=${publicAccessToken}`
  );
  const submission = await response.json();
  
  // Show status: Draft, Quoted, Bound, etc.
  setSubmissionStatus(submission.status);
};
```

### 2. Show Last Updated Date

```typescript
// Show when submission was last updated
<p>Last updated: {new Date(submission.updatedAt).toLocaleString()}</p>
```

### 3. Multiple Submissions

```typescript
// Store array of submissions
const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
// Show list of all user's submissions
```

---

## Bottom Line

**User doesn't need to fill form again!**

- Data is saved in database
- localStorage helps them find it quickly
- Link remains valid
- They can continue where they left off

**Just make sure to:**
1. Save submission info to localStorage after submit
2. Check localStorage on page load
3. Show "Continue to Quote" if found
4. Optionally: Allow login to Coversheet to see all submissions

