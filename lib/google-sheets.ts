import { google } from 'googleapis';
import { InsuredInformation } from './types';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Google Sheets API client using OAuth with personal Gmail account
function getSheetsClient() {
  // Use OAuth 2.0 with personal Gmail account instead of service account
  // This avoids storage quota issues by using the user's personal Drive storage
  
  const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  const REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '';
  const USER_EMAIL = process.env.NOVATAE_USER_EMAIL || 'rohitkumar7480622@gmail.com';

  if (!CLIENT_ID || !CLIENT_SECRET) {
    // Fallback to service account if OAuth not configured
    console.log('[GOOGLE-SHEETS] OAuth not configured, falling back to service account');
    return getSheetsClientServiceAccount();
  }

  if (!REFRESH_TOKEN) {
    throw new Error(
      'Google OAuth refresh token not found. Please set GOOGLE_OAUTH_REFRESH_TOKEN environment variable.\n' +
      'Run the OAuth setup script to get a refresh token.'
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
  });

  console.log('[GOOGLE-SHEETS] Using OAuth with personal account:', USER_EMAIL);

  return {
    sheets: google.sheets({ version: 'v4', auth: oauth2Client }),
    drive: google.drive({ version: 'v3', auth: oauth2Client }),
    auth: oauth2Client,
  };
}

// The email to impersonate (files will be owned by this user, using their storage quota)
const IMPERSONATE_EMAIL = process.env.GOOGLE_IMPERSONATE_EMAIL || 'rohit@mckinneyandco.com';

// Service account with domain-wide delegation (impersonates a real user)
function getSheetsClientServiceAccount() {
  let credentials;

  // Try to read from JSON file first (if in project directory)
  try {
    const jsonPath = join(process.cwd(), 'pdf-generator-477915-6056095f253b.json');
    const jsonContent = readFileSync(jsonPath, 'utf-8');
    credentials = JSON.parse(jsonContent);
    console.log('[GOOGLE-SHEETS] Loaded service account credentials from file:', jsonPath);
  } catch (fileError) {
    // Fallback to environment variable
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    if (!credentialsJson) {
      throw new Error(
        'Google Sheets credentials not found. Either configure OAuth (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN) or use service account (pdf-generator-477915-6056095f253b.json).'
      );
    }

    try {
      credentials = JSON.parse(credentialsJson);
      console.log('[GOOGLE-SHEETS] Loaded service account credentials from environment variable');
    } catch (parseError) {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format. Must be valid JSON string.');
    }
  }

  // Use JWT client with domain-wide delegation to impersonate a real user
  // This means files will be owned by that user and use THEIR storage quota
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
    subject: IMPERSONATE_EMAIL, // Impersonate this user - files will use their storage
  });

  console.log('[GOOGLE-SHEETS] Using domain-wide delegation, impersonating:', IMPERSONATE_EMAIL);

  return {
    sheets: google.sheets({ version: 'v4', auth }),
    drive: google.drive({ version: 'v3', auth }),
    auth,
  };
}

// Template spreadsheet ID and GID
const TEMPLATE_SPREADSHEET_ID = '1XyIgmjERyh9yTni6ZuoEpIc7rwGU4bQooMlQG1S57sI';
const TEMPLATE_GID = '704674692';

// Destination folder ID in Rohit's Drive (where new sheets will be saved)
// Folder: https://drive.google.com/drive/folders/1Ymt9O6_CyvCN71VEyMyXrF6kHRaRMOcG
// Make sure the folder is shared with: novatae-automation@pdf-generator-477915.iam.gserviceaccount.com
const DESTINATION_FOLDER_ID = process.env.NOVATAE_DESTINATION_FOLDER_ID || '1Ymt9O6_CyvCN71VEyMyXrF6kHRaRMOcG';

// Helper to parse address components
function parseAddress(address: string | null | undefined): {
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
} {
  if (!address) {
    return { addressLine1: '', city: '', state: '', zipCode: '' };
  }

  // Extract zip code
  const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
  const zipCode = zipMatch ? zipMatch[1] : '';

  // Extract state
  const stateAbbreviations = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  const addressUpper = address.toUpperCase();
  let state = '';
  for (const st of stateAbbreviations) {
    const regex = new RegExp(`\\b${st}\\b`);
    if (regex.test(addressUpper)) {
      state = st;
      break;
    }
  }

  // Extract city
  let city = '';
  const cityMatch = address.match(/,\s*([^,]+?)\s*,?\s*[A-Z]{2}\s*\d{5}/i);
  if (cityMatch) {
    city = cityMatch[1].trim();
  } else {
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const potentialCity = parts[parts.length - 2] || parts[parts.length - 1];
      city = potentialCity.replace(/\s*[A-Z]{2}\s*\d{5}.*$/i, '').trim();
    }
  }

  // Get address line 1
  let addressLine1 = address
    .replace(/\b\d{5}(?:-\d{4})?\b/, '')
    .replace(new RegExp(`\\b${state}\\b`, 'i'), '')
    .replace(new RegExp(`\\b${city}\\b`, 'i'), '')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/g, '')
    .replace(/^\s*,/g, '')
    .trim();

  addressLine1 = addressLine1.replace(/,\s*$/, '').trim();

  return {
    addressLine1: addressLine1 || address,
    city: city || '',
    state: state || '',
    zipCode,
  };
}

// Format date to MM/DD/YYYY
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (e) {
    return '';
  }
}

// Create a new sheet tab in the existing template spreadsheet and populate with data
// This avoids storage quota issues by adding a tab instead of copying the entire file
export async function createNovataeSheet(
  insuredInfo: InsuredInformation,
  submissionId: string
): Promise<{ 
  sheetUrl: string; 
  sheetId: string;
  premiums?: {
    totalGLPremium?: number;
    totalPropertyPremium?: number;
    optionalTotalPremium?: number;
    totalPremium?: number;
  };
}> {
  const { sheets, drive } = getSheetsClient();
  const address = parseAddress(insuredInfo.address);
  // Add timestamp to make sheet name unique (handles multiple submissions same day)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const newSheetTitle = `${insuredInfo.corporationName || 'Submission'} - ${timestamp}`;

  // Step 1: Copy the entire template spreadsheet to create a new file
  // Using domain-wide delegation, this will use rohit@mckinneyandco.com's storage
  let newSpreadsheetId: string;
  try {
    const copyResponse = await drive.files.copy({
      fileId: TEMPLATE_SPREADSHEET_ID,
      requestBody: {
        name: newSheetTitle,
        // Save to destination folder if configured
        ...(DESTINATION_FOLDER_ID && { parents: [DESTINATION_FOLDER_ID] }),
      },
    });

    newSpreadsheetId = copyResponse.data.id || '';
    
    if (!newSpreadsheetId) {
      throw new Error('Failed to copy spreadsheet - no ID returned');
    }

    console.log('[GOOGLE-SHEETS] New spreadsheet created:', newSheetTitle, 'ID:', newSpreadsheetId);
  } catch (createError: any) {
    console.error('[GOOGLE-SHEETS] Error copying spreadsheet:', createError);
    throw new Error(`Failed to copy spreadsheet: ${createError.message || 'Unknown error'}. Make sure domain-wide delegation is configured correctly.`);
  }

  // Make the spreadsheet accessible to anyone with the link (editor access)
  try {
    await drive.permissions.create({
      fileId: newSpreadsheetId,
      requestBody: {
        role: 'writer', // Anyone with link can edit
        type: 'anyone', // Public access
      },
    });
    console.log('[GOOGLE-SHEETS] Spreadsheet made publicly accessible (anyone with link can EDIT)');
  } catch (permissionError: any) {
    console.warn('[GOOGLE-SHEETS] Could not set public permissions:', permissionError.message);
    // Don't fail the whole operation if permission setting fails
  }

  // Use the new spreadsheet ID
  const spreadsheetId = newSpreadsheetId;

  // Step 2: CLEAR all input cells first to remove any leftover test data from template
  // This ensures formulas only use the new data we're about to write
  console.log('[GOOGLE-SHEETS] Clearing all input cells to remove template test data...');
  // IMPORTANT: Only clear INPUT cells (column C for limits, column F for GL exposures)
  // DO NOT clear column D (rates) or column E (premiums) - these have formulas!
  // Property Coverage section is at rows 82-93, NOT 30-37!
  const cellsToClear = [
    'Rating!C5',  // Named Insured
    'Rating!C6',  // DBA
    'Rating!C7',  // Mailing Address (if exists)
    'Rating!C8',  // Location Address
    'Rating!C9',  // Effective Date
    'Rating!C24', // Year Built
    'Rating!C27', // State
    'Rating!C28', // Territory
    // Property Coverage INPUT cells (rows 30-37)
    'Rating!C30', // Building
    'Rating!C31', // Business Personal Property
    'Rating!C33', // Business Income
    'Rating!C34', // Pumps
    'Rating!C36', // Canopies
    'Rating!C37', // Signs
    // GL Exposures
    'Rating!F5',  // Liquor Sales
    'Rating!F16', // Gasoline Gallons
    'Rating!F19', // Inside Sales
    // DO NOT clear D or E columns - they contain rate formulas!
  ];
  
  try {
    // Use batchClear API which properly clears cells (better than writing empty strings)
    // This removes both values and formatting, ensuring clean slate
    await sheets.spreadsheets.values.batchClear({
      spreadsheetId: spreadsheetId,
      requestBody: {
        ranges: cellsToClear,
      },
    });
    console.log('[GOOGLE-SHEETS] Cleared', cellsToClear.length, 'input cells using batchClear');
    
    // Wait longer for formulas to recalculate with cleared values
    console.log('[GOOGLE-SHEETS] Waiting for formulas to recalculate after clearing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check Property Total BEFORE writing new data (should be $0 or very low after clearing)
    const beforeWriteResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetId,
      ranges: [
        'Rating!C30', // Building
        'Rating!C31', // BPP
        'Rating!C33', // Business Income
        'Rating!F16', // Gasoline Gallons
        'Rating!F19', // Inside Sales
        'Rating!F93', // Property Total (should be low/zero after clearing)
      ],
    });
    
    const beforeValues = beforeWriteResponse.data.valueRanges?.map(vr => {
      const val = vr.values?.[0]?.[0];
      return val ? (typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0) : 0;
    });
    
    console.log('[GOOGLE-SHEETS] Values AFTER clearing (before writing new data):');
    console.log('  C30 (Building):', beforeValues?.[0] || 'EMPTY');
    console.log('  C31 (BPP):', beforeValues?.[1] || 'EMPTY');
    console.log('  C33 (BI):', beforeValues?.[2] || 'EMPTY');
    console.log('  F16 (Gallons):', beforeValues?.[3] || 'EMPTY');
    console.log('  F19 (Sales):', beforeValues?.[4] || 'EMPTY');
    console.log('  F93 (Property Total):', beforeValues?.[5] || 'EMPTY');
    
    if (beforeValues?.[5] && beforeValues[5] > 1000) {
      console.error('[GOOGLE-SHEETS] ⚠️ WARNING: Property Total (F93) is still high after clearing:', beforeValues[5]);
      console.error('[GOOGLE-SHEETS] This suggests cells were not properly cleared or template has bad formulas!');
    }
    
  } catch (clearError: any) {
    console.error('[GOOGLE-SHEETS] Error clearing cells:', clearError.message);
    // Try fallback: write zeros instead of clearing
    console.log('[GOOGLE-SHEETS] Attempting fallback: writing zeros to cells...');
    try {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: 'Rating!C30', values: [[0]] },
            { range: 'Rating!C31', values: [[0]] },
            { range: 'Rating!C33', values: [[0]] },
            { range: 'Rating!C34', values: [[0]] },
            { range: 'Rating!C36', values: [[0]] },
            { range: 'Rating!C37', values: [[0]] },
            { range: 'Rating!F5', values: [[0]] },
            { range: 'Rating!F16', values: [[0]] },
            { range: 'Rating!F19', values: [[0]] },
          ],
        },
      });
      console.log('[GOOGLE-SHEETS] Fallback: Wrote zeros to key cells');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (fallbackError: any) {
      console.warn('[GOOGLE-SHEETS] Fallback also failed:', fallbackError.message);
      // Continue anyway - better to have some data than none
    }
  }

  // Step 3: Prepare data to write
  // Based on screenshot: Column A = Labels, Column B = Input values
  const values: { range: string; values: any[][] }[] = [];

  // INPUTS Section - Demographic
  // Based on actual sheet: Labels are in Column A, Input values go in Column C
  // Row 5: Named Insured - write to C5 (input cell, A5 = label)
  if (insuredInfo.corporationName) {
    values.push({
      range: 'Rating!C5', // C5 = input cell, A5 = label
      values: [[insuredInfo.corporationName]],
    });
    console.log('[GOOGLE-SHEETS] Mapping corporationName to C5:', insuredInfo.corporationName);
  }

  // Row 6: DBA (C6)
  if (insuredInfo.dba) {
    values.push({
      range: 'Rating!C6',
      values: [[insuredInfo.dba]],
    });
  }

  // Row 8: Location Address (C8) - use same as mailing if no separate location
  if (insuredInfo.address) {
    values.push({
      range: 'Rating!C8',
      values: [[insuredInfo.address]],
    });
  }

  // Row 9: Effective Date (C9) - Current date + 2 days
  const today = new Date();
  const effectiveDate = new Date(today);
  effectiveDate.setDate(today.getDate() + 2);
  const month = String(effectiveDate.getMonth() + 1).padStart(2, '0');
  const day = String(effectiveDate.getDate()).padStart(2, '0');
  const year = effectiveDate.getFullYear();
  const effectiveDateFormatted = `${month}/${day}/${year}`;
  values.push({
    range: 'Rating!C9',
    values: [[effectiveDateFormatted]],
  });

  // Property Coverage values
  const propertyCoverage = insuredInfo.propertyCoverage as any;

  // Row 24: Year Built (C24)
  if (insuredInfo.yearBuilt) {
    values.push({
      range: 'Rating!C24',
      values: [[insuredInfo.yearBuilt.toString()]],
    });
  }

  // Row 27: State (C27) - from address
  if (address.state) {
    values.push({
      range: 'Rating!C27',
      values: [[address.state]],
    });
  }

  // Row 28: Territory (C28) - 502 for Atlanta, 503 for rest of GA
  let territory = '503'; // Default for rest of GA
  if (address.state === 'GA') {
    const city = address.city?.toLowerCase() || '';
    if (city.includes('atlanta')) {
      territory = '502';
    } else {
      territory = '503';
    }
  }
  values.push({
    range: 'Rating!C28',
    values: [[territory]],
  });

  // PROPERTY COVERAGE INPUT SECTION - rows 30-37
  // C30 = Building, C31 = BPP, C33 = Business Income, C34 = Pumps, C36 = Canopies, C37 = Signs
  
  // Row 30: Building (C30)
  if (propertyCoverage?.building || propertyCoverage?.Building) {
    const buildingValue = propertyCoverage.building || propertyCoverage.Building;
    const buildingNumber = typeof buildingValue === 'number'
      ? buildingValue
      : parseFloat(String(buildingValue).replace(/[^0-9.]/g, '')) || 0;
    
    if (buildingNumber > 0) {
      values.push({
        range: 'Rating!C30',
        values: [[buildingNumber]],
      });
      console.log('[GOOGLE-SHEETS] Mapping Building to C30:', buildingNumber);
    }
  }

  // Row 31: Business Personal Property (C31)
  if (propertyCoverage?.bpp || propertyCoverage?.BPP || propertyCoverage?.contents) {
    const bppValue = propertyCoverage.bpp || propertyCoverage.BPP || propertyCoverage.contents;
    const bppNumber = typeof bppValue === 'number'
      ? bppValue
      : parseFloat(String(bppValue).replace(/[^0-9.]/g, '')) || 0;
    if (bppNumber > 0) {
      values.push({
        range: 'Rating!C31',
        values: [[bppNumber]],
      });
      console.log('[GOOGLE-SHEETS] Mapping BPP to C31:', bppNumber);
    }
  }

  // Row 33: Business Income (C33)
  if (propertyCoverage?.bi || propertyCoverage?.BI || propertyCoverage?.businessIncome) {
    const biValue = propertyCoverage.bi || propertyCoverage.BI || propertyCoverage.businessIncome;
    const biNumber = typeof biValue === 'number'
      ? biValue
      : parseFloat(String(biValue).replace(/[^0-9.]/g, '')) || 0;
    if (biNumber > 0) {
      values.push({
        range: 'Rating!C33',
        values: [[biNumber]],
      });
      console.log('[GOOGLE-SHEETS] Mapping Business Income to C33:', biNumber);
    }
  }

  // Row 34: Pumps (C34)
  if (propertyCoverage?.pumps) {
    const pumpsValue = typeof propertyCoverage.pumps === 'number'
      ? propertyCoverage.pumps
      : parseFloat(String(propertyCoverage.pumps).replace(/[^0-9.]/g, '')) || 0;
    if (pumpsValue > 0) {
      values.push({
        range: 'Rating!C34',
        values: [[pumpsValue]],
      });
      console.log('[GOOGLE-SHEETS] Mapping Pumps to C34:', pumpsValue);
    }
  }

  // Row 36: Canopies (C36)
  if (propertyCoverage?.canopy || propertyCoverage?.canopies) {
    const canopyValue = propertyCoverage.canopy || propertyCoverage.canopies;
    const canopyNumber = typeof canopyValue === 'number'
      ? canopyValue
      : parseFloat(String(canopyValue).replace(/[^0-9.]/g, '')) || 0;
    if (canopyNumber > 0) {
      values.push({
        range: 'Rating!C36',
        values: [[canopyNumber]],
      });
      console.log('[GOOGLE-SHEETS] Mapping Canopies to C36:', canopyNumber);
    }
  }

  // Row 37: Signs (C37)
  if (propertyCoverage?.signs) {
    const signsValue = typeof propertyCoverage.signs === 'number'
      ? propertyCoverage.signs
      : parseFloat(String(propertyCoverage.signs).replace(/[^0-9.]/g, '')) || 0;
    if (signsValue > 0) {
      values.push({
        range: 'Rating!C37',
        values: [[signsValue]],
      });
      console.log('[GOOGLE-SHEETS] Mapping Signs to C37:', signsValue);
    }
  }

  // General Liability Section
  const generalLiability = insuredInfo.generalLiability as any;
  
  // Row 5: Liquor Sales (F5) - Liquor Sales (Annual)
  if (generalLiability?.liquorSalesYearly || generalLiability?.liquor_sales_yearly) {
    const liquorValue = generalLiability.liquorSalesYearly || generalLiability.liquor_sales_yearly;
    const liquorNumber = typeof liquorValue === 'number'
      ? liquorValue
      : parseFloat(String(liquorValue).replace(/[^0-9.]/g, '')) || 0;
    values.push({
      range: 'Rating!F5',
      values: [[liquorNumber]],
    });
  }

  // Row 16: Gasoline Gallons (F16) - Number of gallons
  if (generalLiability?.gasolineSalesYearly || generalLiability?.gasoline_sales_yearly) {
    const gallonsValue = generalLiability.gasolineSalesYearly || generalLiability.gasoline_sales_yearly;
    const gallonsNumber = typeof gallonsValue === 'number'
      ? gallonsValue
      : parseFloat(String(gallonsValue).replace(/[^0-9.]/g, '')) || 0;
    
    // Validation: Gasoline gallons should be reasonable (typically 10K-500K gallons/year)
    if (gallonsNumber > 1000000) {
      console.warn('[GOOGLE-SHEETS] WARNING: Gasoline gallons seems too high:', gallonsNumber, '- This might be dollars instead of gallons!');
      // Cap at reasonable maximum to prevent premium explosion
      const cappedGallons = Math.min(gallonsNumber, 1000000);
      console.warn('[GOOGLE-SHEETS] Capping at 1,000,000 gallons');
      values.push({
        range: 'Rating!F16',
        values: [[cappedGallons]],
      });
    } else if (gallonsNumber > 0) {
      values.push({
        range: 'Rating!F16',
        values: [[gallonsNumber]],
      });
    }
  }

  // Row 19: Inside Sales (F19) - Inside Sales (Annual)
  if (generalLiability?.insideSalesYearly || generalLiability?.inside_sales_yearly) {
    const salesValue = generalLiability.insideSalesYearly || generalLiability.inside_sales_yearly;
    const salesNumber = typeof salesValue === 'number'
      ? salesValue
      : parseFloat(String(salesValue).replace(/[^0-9.]/g, '')) || 0;
    
    // Validation: Inside sales should be reasonable for a gas station/c-store (typically $100K-$5M/year)
    if (salesNumber > 20000000) {
      console.warn('[GOOGLE-SHEETS] WARNING: Inside sales seems too high:', salesNumber, '- Please verify this is correct!');
      // Cap at reasonable maximum
      const cappedSales = Math.min(salesNumber, 20000000);
      console.warn('[GOOGLE-SHEETS] Capping at $20,000,000');
      values.push({
        range: 'Rating!F19',
        values: [[cappedSales]],
      });
    } else if (salesNumber > 0) {
      values.push({
        range: 'Rating!F19',
        values: [[salesNumber]],
      });
    }
  }

  // Step 4: Write all values to the new spreadsheet (keep 'Rating!' since it's a copy)
  if (values.length > 0) {
    console.log('[GOOGLE-SHEETS] Writing', values.length, 'values to spreadsheet:');
    values.forEach(v => {
      console.log(`  ${v.range} = ${v.values[0][0]} (type: ${typeof v.values[0][0]})`);
    });

    const response = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: values, // Use original 'Rating!' ranges since it's a new spreadsheet copy
      },
    });
    
    console.log('[GOOGLE-SHEETS] Successfully wrote', values.length, 'data ranges to spreadsheet:', newSheetTitle);
    
    // Wait a moment for values to be written
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify what was actually written
    const verifyRanges = values.slice(0, 5).map(v => v.range); // Check first 5 values
    const verifyResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetId,
      ranges: verifyRanges,
    });
    
    console.log('[GOOGLE-SHEETS] Verification - Values after writing:');
    verifyRanges.forEach((range, idx) => {
      const writtenValue = verifyResponse.data.valueRanges?.[idx]?.values?.[0]?.[0];
      const expectedValue = values[idx].values[0][0];
      console.log(`  ${range}: Expected=${expectedValue}, Actual=${writtenValue}`);
    });
    
    // Check Property Total AFTER writing new data
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for formulas
    const afterWriteResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetId,
      ranges: [
        'Rating!F93', // Property Total
        'Rating!F80', // GL Total
        'Rating!F117', // Total Premium
      ],
    });
    
    const afterValues = afterWriteResponse.data.valueRanges?.map(vr => {
      const val = vr.values?.[0]?.[0];
      return val ? (typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0) : 0;
    });
    
    console.log('[GOOGLE-SHEETS] Premium values AFTER writing new data:');
    console.log('  F93 (Property Total):', afterValues?.[0] || 'EMPTY');
    console.log('  F80 (GL Total):', afterValues?.[1] || 'EMPTY');
    console.log('  F117 (Total Premium):', afterValues?.[2] || 'EMPTY');
    
    if (afterValues?.[0] && afterValues[0] > 1000000) {
      console.error('[GOOGLE-SHEETS] ⚠️ ERROR: Property Total (F93) is too high:', afterValues[0]);
      console.error('[GOOGLE-SHEETS] This indicates a problem with the data or template formulas!');
      console.error('[GOOGLE-SHEETS] Please check the template spreadsheet for incorrect formulas or test data.');
    }
  }

  // URL points to the new spreadsheet
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${TEMPLATE_GID}`;

  console.log('[GOOGLE-SHEETS] New spreadsheet created successfully:', sheetUrl);

  // Step 5: Read premium values from the sheet (wait a bit for formulas to calculate)
  const premiums: {
    totalGLPremium?: number;
    totalPropertyPremium?: number;
    optionalTotalPremium?: number;
    totalPremium?: number;
  } = {};
  
  // Define premium ranges to read (must be before try block)
  const premiumRanges = [
    { range: 'Rating!F80', key: 'totalGLPremium' },
    { range: 'Rating!F93', key: 'totalPropertyPremium' },
    { range: 'Rating!F104', key: 'optionalTotalPremium' },
    { range: 'Rating!F117', key: 'totalPremium' },
  ];
  
  // First, let's check what formula is in F93 and what cells feed into it
  try {
    // Wait a moment for formulas to calculate after writing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check the formula in F93
    const formulaResponse = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      ranges: ['Rating!F93'],
      includeGridData: true,
    });
    
    const cellData = formulaResponse.data.sheets?.[0]?.data?.[0]?.rowData?.[92]?.values?.[5] as any; // Row 93 (0-indexed = 92), Column F (0-indexed = 5)
    if (cellData) {
      console.log('[GOOGLE-SHEETS] F93 (Property Total) formula:', cellData.formulaValue || 'No formula (calculated value)');
      console.log('[GOOGLE-SHEETS] F93 effective value:', cellData.effectiveValue);
      if (cellData.formulaValue) {
        console.log('[GOOGLE-SHEETS] ⚠️ F93 FORMULA:', cellData.formulaValue);
      }
    }
  } catch (formulaError: any) {
    console.warn('[GOOGLE-SHEETS] Could not read F93 formula:', formulaError.message);
  }
  
  // Check what values are in the cells that feed into Property Total
  try {
    const formulaResponse = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      ranges: ['Rating!F93'],
      includeGridData: true,
    });
    
    const cellData2 = formulaResponse.data.sheets?.[0]?.data?.[0]?.rowData?.[92]?.values?.[5] as any; // Row 93 (0-indexed = 92), Column F (0-indexed = 5)
    if (cellData2?.effectiveValue) {
      console.log('[GOOGLE-SHEETS] F93 (Property Total) formula:', cellData2.formulaValue || 'No formula');
      console.log('[GOOGLE-SHEETS] F93 effective value:', cellData2.effectiveValue);
      if (cellData2.formulaValue) {
        console.log('[GOOGLE-SHEETS] F93 formula breakdown:', cellData2.formulaValue);
      }
    }
  } catch (formulaError: any) {
    console.warn('[GOOGLE-SHEETS] Could not read F93 formula:', formulaError.message);
  }
  
  // Check what values are in the INPUT cells (rows 30-37) and CALCULATED values (rows 83-88)
  try {
    const propertyInputsResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetId,
      ranges: [
        // INPUT cells (where we write values)
        'Rating!C30', // Building input
        'Rating!C31', // BPP input
        'Rating!C33', // BI input
        'Rating!C34', // Pumps input
        'Rating!C36', // Canopies input
        'Rating!C37', // Signs input
        // CALCULATED values (formulas reference inputs above)
        'Rating!D83', // Building rate
        'Rating!D84', // BPP rate
        'Rating!D85', // BI rate
        'Rating!E83', // Building premium
        'Rating!E84', // BPP premium
        'Rating!E85', // BI premium
      ],
    });
    
    console.log('[GOOGLE-SHEETS] Property values debug:');
    const propertyInputs = propertyInputsResponse.data.valueRanges || [];
    const labels = ['C30 (Building INPUT)', 'C31 (BPP INPUT)', 'C33 (BI INPUT)', 'C34 (Pumps INPUT)', 'C36 (Canopies INPUT)', 'C37 (Signs INPUT)', 
                    'D83 (Bld Rate)', 'D84 (BPP Rate)', 'D85 (BI Rate)', 'E83 (Bld Prem)', 'E84 (BPP Prem)', 'E85 (BI Prem)'];
    labels.forEach((label, idx) => {
      const val = propertyInputs[idx]?.values?.[0]?.[0];
      console.log(`  ${label}:`, val || 'EMPTY');
    });
  } catch (inputError: any) {
    console.warn('[GOOGLE-SHEETS] Could not read property inputs:', inputError.message);
  }
  
  try {
    // Wait longer for formulas to calculate (increased from 2 to 5 seconds)
    // Complex insurance formulas with multiple dependencies need more time
    console.log('[GOOGLE-SHEETS] Waiting for formulas to calculate...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try reading multiple times to ensure formulas are stable
    let attempts = 0;
    let lastPremiums: { [key: string]: number } = {};
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      const premiumResponse = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: premiumRanges.map(r => r.range),
      });
      
      const currentPremiums: { [key: string]: number } = {};
      if (premiumResponse.data.valueRanges) {
        premiumRanges.forEach((premiumRange, index) => {
          const values = premiumResponse.data.valueRanges?.[index]?.values;
          if (values && values[0] && values[0][0]) {
            const value = values[0][0];
            const numValue = typeof value === 'number' 
              ? value 
              : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
            if (numValue > 0) {
              currentPremiums[premiumRange.key] = numValue;
            }
          }
        });
      }
      
      // Check if values are stable (same as last read)
      if (attempts > 0 && JSON.stringify(currentPremiums) === JSON.stringify(lastPremiums)) {
        console.log('[GOOGLE-SHEETS] Premium values stable after', attempts + 1, 'reads');
        Object.assign(premiums, currentPremiums);
        break;
      }
      
      lastPremiums = currentPremiums;
      attempts++;
      
      if (attempts < maxAttempts) {
        console.log('[GOOGLE-SHEETS] Formulas still calculating, waiting 2 more seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Use last read values even if not stable
        Object.assign(premiums, currentPremiums);
      }
    }
    
    // The reading logic is now in the while loop above
  } catch (premiumError: any) {
    console.warn('[GOOGLE-SHEETS] Could not read premium values:', premiumError.message);
    // Don't fail the whole operation if premium reading fails
  }

  return {
    sheetUrl,
    sheetId: spreadsheetId,
    premiums,
  };
}
