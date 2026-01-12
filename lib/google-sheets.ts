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
  const { sheets } = getSheetsClient();
  const address = parseAddress(insuredInfo.address);
  // Add timestamp to make sheet name unique (handles multiple submissions same day)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const newSheetTitle = `${insuredInfo.corporationName || 'Submission'} - ${timestamp}`;

  // Step 1: Create a new sheet tab in the existing template spreadsheet
  // This duplicates the template sheet tab with all formulas/formatting
  let newSheetId: number;
  try {
    // Duplicate the template sheet tab within the same spreadsheet
    const duplicateResponse = await sheets.spreadsheets.sheets.copyTo({
      spreadsheetId: TEMPLATE_SPREADSHEET_ID,
      sheetId: parseInt(TEMPLATE_GID),
      requestBody: {
        destinationSpreadsheetId: TEMPLATE_SPREADSHEET_ID, // Same spreadsheet
      },
    });

    newSheetId = duplicateResponse.data.sheetId || parseInt(TEMPLATE_GID);
    
    if (!newSheetId) {
      throw new Error('Failed to create new sheet tab - no sheet ID returned');
    }

    // Rename the new sheet tab
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: TEMPLATE_SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: newSheetId,
                title: newSheetTitle,
              },
              fields: 'title',
            },
          },
        ],
      },
    });

    console.log('[GOOGLE-SHEETS] New sheet tab created successfully:', newSheetTitle, 'Sheet ID:', newSheetId);
  } catch (createError: any) {
    console.error('[GOOGLE-SHEETS] Error creating sheet tab:', createError);
    
    // If we can't create a new tab, fall back to writing directly to the template sheet
    if (createError.message?.includes('permission') || createError.message?.includes('access')) {
      console.log('[GOOGLE-SHEETS] Cannot create new tab, will write to template sheet directly (will overwrite existing data)');
      newSheetId = parseInt(TEMPLATE_GID);
    } else {
      throw new Error(`Failed to create sheet tab: ${createError.message || 'Unknown error'}. Make sure the service account has Editor access to the template sheet.`);
    }
  }

  // Use the template spreadsheet ID (we're adding a tab to it, not copying)
  const spreadsheetId = TEMPLATE_SPREADSHEET_ID;

  // Step 2: Prepare data to write
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

  // Row 30: Building (C30) - from propertyCoverage, leave empty if not available
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
    }
  }

  // Row 31: Business Personal Property (C31)
  if (propertyCoverage?.bpp || propertyCoverage?.BPP || propertyCoverage?.contents) {
    const bppValue = propertyCoverage.bpp || propertyCoverage.BPP || propertyCoverage.contents;
    const bppNumber = typeof bppValue === 'number'
      ? bppValue
      : parseFloat(String(bppValue).replace(/[^0-9.]/g, '')) || 0;
    values.push({
      range: 'Rating!C31',
      values: [[bppNumber]],
    });
  }

  // Row 33: Business Income (C33)
  if (propertyCoverage?.bi || propertyCoverage?.BI || propertyCoverage?.businessIncome) {
    const biValue = propertyCoverage.bi || propertyCoverage.BI || propertyCoverage.businessIncome;
    const biNumber = typeof biValue === 'number'
      ? biValue
      : parseFloat(String(biValue).replace(/[^0-9.]/g, '')) || 0;
    values.push({
      range: 'Rating!C33',
      values: [[biNumber]],
    });
  }

  // Row 34: Pumps (C34)
  if (propertyCoverage?.pumps) {
    const pumpsValue = typeof propertyCoverage.pumps === 'number'
      ? propertyCoverage.pumps
      : parseFloat(String(propertyCoverage.pumps).replace(/[^0-9.]/g, '')) || 0;
    values.push({
      range: 'Rating!C34',
      values: [[pumpsValue]],
    });
  }

  // Row 36: Canopies (C36)
  if (propertyCoverage?.canopy || propertyCoverage?.canopies) {
    const canopyValue = propertyCoverage.canopy || propertyCoverage.canopies;
    const canopyNumber = typeof canopyValue === 'number'
      ? canopyValue
      : parseFloat(String(canopyValue).replace(/[^0-9.]/g, '')) || 0;
    values.push({
      range: 'Rating!C36',
      values: [[canopyNumber]],
    });
  }

  // Row 37: Signs (C37)
  if (propertyCoverage?.signs) {
    const signsValue = typeof propertyCoverage.signs === 'number'
      ? propertyCoverage.signs
      : parseFloat(String(propertyCoverage.signs).replace(/[^0-9.]/g, '')) || 0;
    values.push({
      range: 'Rating!C37',
      values: [[signsValue]],
    });
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
    values.push({
      range: 'Rating!F16',
      values: [[gallonsNumber]],
    });
  }

  // Row 19: Inside Sales (F19) - Inside Sales (Annual)
  if (generalLiability?.insideSalesYearly || generalLiability?.inside_sales_yearly) {
    const salesValue = generalLiability.insideSalesYearly || generalLiability.inside_sales_yearly;
    const salesNumber = typeof salesValue === 'number'
      ? salesValue
      : parseFloat(String(salesValue).replace(/[^0-9.]/g, '')) || 0;
    values.push({
      range: 'Rating!F19',
      values: [[salesNumber]],
    });
  }

  // Step 3: Write all values to the new sheet tab
  if (values.length > 0) {
    // Update all ranges to use the new sheet name
    // Sheet names with spaces or special characters need to be quoted
    const escapedSheetName = newSheetTitle.includes(' ') || newSheetTitle.includes('-') 
      ? `'${newSheetTitle}'` 
      : newSheetTitle;
    
    const updatedValues = values.map(v => ({
      range: v.range.replace('Rating!', `${escapedSheetName}!`),
      values: v.values,
    }));

    console.log('[GOOGLE-SHEETS] Writing to ranges:', updatedValues.map(v => `${v.range} = ${v.values[0][0]}`).join(', '));

    const response = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updatedValues,
      },
    });
    
    console.log('[GOOGLE-SHEETS] Successfully wrote', updatedValues.length, 'data ranges to sheet:', newSheetTitle);
    console.log('[GOOGLE-SHEETS] Response:', JSON.stringify(response.data, null, 2));
  }

  // URL points to the template spreadsheet with the new sheet tab
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${newSheetId}`;

  console.log('[GOOGLE-SHEETS] Sheet tab created/updated successfully:', sheetUrl);

  // Step 4: Read premium values from the sheet (wait a bit for formulas to calculate)
  const premiums: {
    totalGLPremium?: number;
    totalPropertyPremium?: number;
    optionalTotalPremium?: number;
    totalPremium?: number;
  } = {};
  
  try {
    // Wait 2 seconds for formulas to calculate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const escapedSheetName = newSheetTitle.includes(' ') || newSheetTitle.includes('-') 
      ? `'${newSheetTitle}'` 
      : newSheetTitle;
    
    // Read premium values
    const premiumRanges = [
      { range: `${escapedSheetName}!F80`, key: 'totalGLPremium' },
      { range: `${escapedSheetName}!F93`, key: 'totalPropertyPremium' },
      { range: `${escapedSheetName}!F104`, key: 'optionalTotalPremium' },
      { range: `${escapedSheetName}!F117`, key: 'totalPremium' },
    ];
    
    const premiumResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetId,
      ranges: premiumRanges.map(r => r.range),
    });
    
    if (premiumResponse.data.valueRanges) {
      premiumRanges.forEach((premiumRange, index) => {
        const values = premiumResponse.data.valueRanges?.[index]?.values;
        if (values && values[0] && values[0][0]) {
          const value = values[0][0];
          // Parse the value (might be a number or formatted string like "$1,234.56")
          const numValue = typeof value === 'number' 
            ? value 
            : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
          if (numValue > 0) {
            premiums[premiumRange.key as keyof typeof premiums] = numValue;
          }
        }
      });
    }
    
    console.log('[GOOGLE-SHEETS] Premium values read:', premiums);
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
