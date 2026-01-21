# AMC Sheet Creation - Bug Analysis

## How It Currently Works

### 1. **Sheet Creation Process**
1. Copies the template spreadsheet (ID: `1XyIgmjERyh9yTni6ZuoEpIc7rwGU4bQooMlQG1S57sI`)
2. Makes it publicly accessible
3. Fills in data from the Coversheet
4. Waits 2 seconds for formulas to calculate
5. Reads premium values from cells F80, F93, F104, F117

### 2. **Data Mapping Issues (CRITICAL BUGS)**

#### **Bug #1: Gasoline Gallons Confusion** ⚠️
**Location:** `lib/google-sheets.ts` lines 420-429

**Problem:**
- The form field is labeled "Gasoline Gallons (Annual)" - expects a number like `50000` gallons
- BUT the code reads `gasolineSalesYearly` which might contain:
  - Dollars (e.g., "$500,000" in revenue) 
  - OR actual gallons (e.g., 50000)
- **If user enters sales revenue in dollars thinking it's gallons, you get 500,000 GALLONS instead of 500,000 DOLLARS**
- Example: User enters "$500,000" → Parsed as `500000` gallons → Premium explodes!

**Code:**
```typescript
// Row 16: Gasoline Gallons (F16) - Number of gallons
if (generalLiability?.gasolineSalesYearly || generalLiability?.gasoline_sales_yearly) {
  const gallonsValue = generalLiability.gasolineSalesYearly || generalLiability.gasoline_sales_yearly;
  const gallonsNumber = typeof gallonsValue === 'number'
    ? gallonsValue
    : parseFloat(String(gallonsValue).replace(/[^0-9.]/g, '')) || 0;
  // This writes to F16 - but what if gallonsValue was actually dollars?
}
```

#### **Bug #2: Inside Sales Could Be Wrong Format** ⚠️
**Location:** `lib/google-sheets.ts` lines 432-441

**Problem:**
- Inside Sales should be annual revenue (dollars) like $500,000
- Code writes it directly to F19
- **If the sheet's formula multiplies this by a rate or factor incorrectly, premiums become huge**
- Example: If formula is `=F19 * 100` instead of `=F19 * 0.01`, premium is 100x too high

**Code:**
```typescript
// Row 19: Inside Sales (F19) - Inside Sales (Annual)
if (generalLiability?.insideSalesYearly || generalLiability?.inside_sales_yearly) {
  const salesValue = generalLiability.insideSalesYearly || generalLiability.inside_sales_yearly;
  const salesNumber = typeof salesValue === 'number'
    ? salesValue
    : parseFloat(String(salesValue).replace(/[^0-9.]/g, '')) || 0;
  // No validation - could be millions if user entered wrong
}
```

#### **Bug #3: Premium Reading Timing** ⚠️
**Location:** `lib/google-sheets.ts` lines 472-509

**Problem:**
- Code waits only 2 seconds for formulas to calculate (line 474)
- Complex insurance formulas with multiple dependencies might need 5-10 seconds
- **If formulas haven't finished calculating, you read:**
  - Zero values (formulas not run yet)
  - Old cached values (previous calculation)
  - Error values (#REF!, #VALUE!)
  - **Or incorrect intermediate calculations**

**Code:**
```typescript
// Wait 2 seconds for formulas to calculate
await new Promise(resolve => setTimeout(resolve, 2000));

// Read premium values
const premiumResponse = await sheets.spreadsheets.values.batchGet({
  spreadsheetId: spreadsheetId,
  ranges: ['Rating!F80', 'Rating!F93', 'Rating!F104', 'Rating!F117'],
});

// Problem: Formulas might not be done in 2 seconds!
```

#### **Bug #4: No Data Validation** ⚠️
**Location:** Throughout `lib/google-sheets.ts`

**Problems:**
- No maximum/minimum checks on values
- No validation that gasoline is actually gallons (not dollars)
- No validation that values are reasonable
- Example: If someone enters 1,000,000 gallons by mistake, code doesn't catch it

### 3. **Why Premiums Show in Millions**

**Most Likely Causes:**

1. **Gasoline Gallons Confusion:**
   - User enters "$500,000" thinking it's revenue
   - Code parses as 500,000 gallons
   - Sheet formula multiplies gallons by a rate (e.g., $2/gallon) = $1,000,000 premium

2. **Inside Sales Multiplied Incorrectly:**
   - User enters $500,000 in annual sales
   - Sheet formula might multiply by wrong factor
   - Example: `=F19 * 0.5` gives $250,000 (reasonable)
   - But if formula is wrong: `=F19 * 2` gives $1,000,000 (too high)

3. **Formula Not Calculated Yet:**
   - 2 seconds isn't enough
   - Reads intermediate calculation or zero
   - Then multiplies by factors later = huge number

4. **Property Values Too High:**
   - Building value, BPP, Business Income might be entered incorrectly
   - If building value is $5M instead of $500K, property premium explodes

## Recommendations to Fix

### **Fix #1: Add Data Validation**
```typescript
// Validate gasoline gallons (should be reasonable number)
if (gallonsNumber > 1000000) {
  console.warn('[GOOGLE-SHEETS] WARNING: Gasoline gallons seems too high:', gallonsNumber);
  // Maybe cap it or ask for confirmation
}

// Validate inside sales (should be reasonable for a gas station/c-store)
if (salesNumber > 10000000) {
  console.warn('[GOOGLE-SHEETS] WARNING: Inside sales seems too high:', salesNumber);
}
```

### **Fix #2: Increase Wait Time & Verify Formulas**
```typescript
// Wait longer and check if formulas are done
await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds

// Try reading multiple times until stable
let attempts = 0;
let lastValues: number[] = [];
while (attempts < 3) {
  const premiumResponse = await sheets.spreadsheets.values.batchGet({...});
  const currentValues = premiumResponse.data.valueRanges?.map(...);
  
  // Check if values changed from last read (formulas still calculating)
  if (attempts > 0 && JSON.stringify(currentValues) === JSON.stringify(lastValues)) {
    break; // Values stable, formulas done
  }
  lastValues = currentValues;
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 more seconds
  attempts++;
}
```

### **Fix #3: Clarify Field Labels**
- Make it crystal clear: "Gasoline Gallons Sold (Annual)" - NOT revenue
- Add help text: "Enter number of gallons, e.g., 50000 (not dollars)"
- Add validation on frontend before submission

### **Fix #4: Add Debug Logging**
```typescript
console.log('[GOOGLE-SHEETS] Writing values:', {
  gasolineGallons: gallonsNumber,
  insideSales: salesNumber,
  building: buildingNumber,
  // ... all values
});
```

### **Fix #5: Check Sheet Formulas**
- Open the template sheet and verify formulas in F80, F93, F104, F117
- Make sure they're using correct multipliers
- Test with sample data to ensure formulas are correct

## Questions to Answer

1. **What units does the sheet expect?**
   - Gasoline: Gallons or Dollars?
   - Inside Sales: Dollars (annual revenue)?

2. **What are the formulas in F80, F93, F104, F117?**
   - Are they multiplying correctly?
   - Are they using the right cells?

3. **What are typical values?**
   - Normal gasoline gallons per year: 50,000-200,000?
   - Normal inside sales: $500K-$2M?
   - Normal premiums: $5K-$50K?

4. **Is the 2-second wait enough?**
   - Test: Create a sheet manually and see how long formulas take
   - If formulas take 5+ seconds, increase wait time
