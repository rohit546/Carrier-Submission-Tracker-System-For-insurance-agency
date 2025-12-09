import { NextRequest, NextResponse } from 'next/server';
import { getSubmission, getInsuredInformation } from '@/lib/db/queries';

// Helper to parse address and extract addressLine1 and zipCode
function parseAddress(address: string | null | undefined): { addressLine1: string; zipCode: string } {
  if (!address) {
    return { addressLine1: '', zipCode: '' };
  }

  // Try to extract zip code (5 digits, possibly with -4 extension)
  const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
  const zipCode = zipMatch ? zipMatch[1] : '';

  // Remove zip code from address to get addressLine1
  let addressLine1 = address.replace(/\b\d{5}(?:-\d{4})?\b/, '').trim();
  
  // Clean up any trailing commas or extra spaces
  addressLine1 = addressLine1.replace(/,\s*$/, '').trim();

  return { addressLine1: addressLine1 || address, zipCode };
}

// Helper to parse name into firstName and lastName
function parseName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
}

// Helper to extract state from address
function extractState(address: string | null | undefined): string {
  if (!address) return 'GA'; // Default to GA
  
  // Common state abbreviations
  const stateAbbreviations = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  // Look for state abbreviation in address (usually before zip code)
  const addressUpper = address.toUpperCase();
  for (const state of stateAbbreviations) {
    const regex = new RegExp(`\\b${state}\\b`);
    if (regex.test(addressUpper)) {
      return state;
    }
  }
  
  return 'GA'; // Default
}

// Helper to validate FEIN format (XX-XXXXXXX) - optional field
function validateFEIN(fein: string | null | undefined): { valid: boolean; error?: string } {
  // FEIN is optional, so if empty, it's valid
  if (!fein || !fein.trim()) {
    return { valid: true };
  }

  // Remove any spaces
  const cleaned = fein.trim().replace(/\s+/g, '');
  
  // Check format: XX-XXXXXXX (2 digits, hyphen, 7 digits)
  const feinPattern = /^\d{2}-\d{7}$/;
  
  if (!feinPattern.test(cleaned)) {
    return { 
      valid: false, 
      error: 'FEIN must be in format XX-XXXXXXX (e.g., 58-3247891)' 
    };
  }

  return { valid: true };
}

// Helper to format FEIN (add hyphen if missing, ensure correct format)
function formatFEIN(fein: string | null | undefined): string {
  if (!fein) return '';
  
  // Remove all non-digit characters
  const digits = fein.replace(/\D/g, '');
  
  // Must be exactly 9 digits
  if (digits.length !== 9) {
    return fein; // Return original if invalid length
  }
  
  // Format as XX-XXXXXXX
  return `${digits.substring(0, 2)}-${digits.substring(2)}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;
    
    // Fetch submission with insured info
    const submission = await getSubmission(submissionId);
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Get insured info from snapshot or fetch it
    let insuredInfo = submission.insuredInfoSnapshot;
    
    console.log('[AUTO-SUBMIT] Submission:', {
      id: submission.id,
      businessName: submission.businessName,
      hasInsuredInfoSnapshot: !!submission.insuredInfoSnapshot,
      insuredInfoId: submission.insuredInfoId,
    });
    
    // If no snapshot but has ID, fetch it from database
    if (!insuredInfo && submission.insuredInfoId) {
      console.log('[AUTO-SUBMIT] Fetching insured info from database...');
      insuredInfo = await getInsuredInformation(submission.insuredInfoId);
      console.log('[AUTO-SUBMIT] Fetched insured info:', {
        hasData: !!insuredInfo,
        corporationName: insuredInfo?.corporationName || insuredInfo?.corporation_name,
        address: insuredInfo?.address,
      });
    }

    // Normalize insured info (handle both camelCase and snake_case)
    const normalize = (data: any) => {
      if (!data) {
        console.log('[AUTO-SUBMIT] No insured info data, using submission business name');
        return {
          corporationName: submission.businessName,
          contactName: '',
          contactNumber: '',
          contactEmail: '',
          address: '',
          operationDescription: '',
          fein: '',
          dba: '',
          ownershipType: '',
          yearsAtLocation: null,
          constructionType: '',
          totalSqFootage: null,
          yearBuilt: null,
          generalLiability: {},
          propertyCoverage: {},
        };
      }
      const normalized = {
        corporationName: data.corporationName || data.corporation_name || submission.businessName,
        contactName: data.contactName || data.contact_name || '',
        contactNumber: data.contactNumber || data.contact_number || '',
        contactEmail: data.contactEmail || data.contact_email || '',
        address: data.address || '',
        operationDescription: data.operationDescription || data.operation_description || '',
        fein: data.fein || data.fein_id || data.federal_employer_id || '',
        dba: data.dba || '',
        ownershipType: data.ownershipType || data.ownership_type || '',
        yearsAtLocation: data.yearsAtLocation || data.years_at_location || null,
        constructionType: data.constructionType || data.construction_type || '',
        totalSqFootage: data.totalSqFootage || data.total_sq_footage || null,
        yearBuilt: data.yearBuilt || data.year_built || null,
        generalLiability: data.generalLiability || data.general_liability || {},
        propertyCoverage: data.propertyCoverage || data.property_coverage || {},
        noOfStories: (data as any).noOfStories || (data as any).no_of_stories || null,
      };
      console.log('[AUTO-SUBMIT] Normalized data:', normalized);
      return normalized;
    };

    const normalized = normalize(insuredInfo);
    
    // Validate required fields
    if (!normalized?.corporationName) {
      console.error('[AUTO-SUBMIT] Validation failed: Corporation name missing');
      return NextResponse.json(
        { error: 'Corporation name is required. Please ensure insured information is complete.' },
        { status: 400 }
      );
    }

    // Validate FEIN format (optional - only validate if provided)
    const feinValidation = validateFEIN(normalized.fein);
    if (!feinValidation.valid) {
      console.error('[AUTO-SUBMIT] Validation failed: FEIN invalid', feinValidation.error);
      return NextResponse.json(
        { 
          error: feinValidation.error || 'FEIN format is invalid',
          details: 'FEIN must be in format XX-XXXXXXX (e.g., 58-3247891)',
          field: 'fein'
        },
        { status: 400 }
      );
    }

    // Format FEIN to ensure correct format (if provided)
    const formattedFEIN = normalized.fein ? formatFEIN(normalized.fein) : '';

    if (!normalized.address) {
      console.error('[AUTO-SUBMIT] Validation failed: Address missing');
      return NextResponse.json(
        { error: 'Address is required. Please ensure insured information includes an address.' },
        { status: 400 }
      );
    }

    // Parse address
    const { addressLine1, zipCode } = parseAddress(normalized.address);
    console.log('[AUTO-SUBMIT] Parsed address:', { addressLine1, zipCode, original: normalized.address });
    
    // Validate zip code is present
    if (!zipCode) {
      console.error('[AUTO-SUBMIT] Validation failed: Zip code not found in address');
      return NextResponse.json(
        { 
          error: 'Zip code is required in address',
          details: `The address "${normalized.address}" does not contain a valid zip code. Please update the address to include a zip code (e.g., 12345 or 12345-6789) before submitting.`,
          field: 'address'
        },
        { status: 400 }
      );
    }

    // Parse contact name
    const { firstName, lastName } = parseName(normalized.contactName);
    
    // Extract state
    const state = extractState(normalized.address);

    // Prepare webhook payload with new format including quote automation
    const taskId = `submission_${submissionId}_${Date.now()}`;
    
    // Extract quote data fields
    const gasolineSalesYearly = (normalized.generalLiability as any)?.gasolineSalesYearly || 
                                (normalized.generalLiability as any)?.gasoline_sales_yearly || null;
    const insideSalesYearly = (normalized.generalLiability as any)?.insideSalesYearly || 
                              (normalized.generalLiability as any)?.inside_sales_yearly || null;
    const bi = (normalized.propertyCoverage as any)?.bi || null;
    const bpp = (normalized.propertyCoverage as any)?.bpp || null;
    
    const payload = {
      action: 'start_automation',
      task_id: taskId,
      data: {
        form_data: {
          firstName: firstName || 'N/A',
          lastName: lastName || 'N/A',
          companyName: normalized.corporationName,
          fein: formattedFEIN, // Use formatted FEIN
          description: normalized.operationDescription || 'Business operations',
          addressLine1: addressLine1,
          zipCode: zipCode,
          phone: normalized.contactNumber || '',
          email: normalized.contactEmail || '',
        },
        dropdowns: {
          state: state,
          addressType: 'Business',
          contactMethod: 'Email',
          producer: 'Shahnaz Sutar', // Default producer
        },
        save_form: true,
        run_quote_automation: true, // Enable quote automation
        quote_data: {
          // Map our insured info fields to RPA quote_data format
          dba: normalized.dba || '',
          org_type: normalized.ownershipType || '',
          years_at_location: normalized.yearsAtLocation ? String(normalized.yearsAtLocation) : '',
          no_of_gallons_annual: gasolineSalesYearly ? String(gasolineSalesYearly) : '',
          inside_sales: insideSalesYearly ? String(insideSalesYearly) : '',
          construction_type: normalized.constructionType || '',
          no_of_stories: (normalized as any).noOfStories ? String((normalized as any).noOfStories) : '',
          square_footage: normalized.totalSqFootage ? String(normalized.totalSqFootage) : '',
          year_built: normalized.yearBuilt ? String(normalized.yearBuilt) : '',
          limit_business_income: bi ? String(bi) : '',
          limit_personal_property: bpp ? String(bpp) : '',
          building_description: normalized.operationDescription || '',
        },
      },
    };

    console.log('[AUTO-SUBMIT] Payload prepared:', {
      taskId,
      hasQuoteData: !!payload.data.quote_data,
      quoteDataFields: Object.keys(payload.data.quote_data),
    });

    // Send to RPA webhook
    const webhookUrl = process.env.RPA_WEBHOOK_URL || 'https://encova-submission-bot-rpa-production.up.railway.app/webhook';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RPA webhook error:', errorText);
      return NextResponse.json(
        { error: `Failed to submit to RPA: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Build response with new RPA response format
    const responseData: any = {
      success: true,
      message: result.message || 'Submission sent to RPA successfully',
      taskId: taskId,
      status: result.status || 'accepted',
    };

    // Include account creation info if available
    if (result.account_created) {
      responseData.accountCreated = true;
      responseData.accountNumber = result.account_number;
      responseData.quoteUrl = result.quote_url;
    }

    // Include quote automation info if available
    if (result.quote_automation) {
      responseData.quoteAutomation = {
        success: result.quote_automation.success,
        message: result.quote_automation.message,
      };
    }

    console.log('[AUTO-SUBMIT] RPA Response:', responseData);

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Auto-submit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to auto-submit submission' },
      { status: 500 }
    );
  }
}

