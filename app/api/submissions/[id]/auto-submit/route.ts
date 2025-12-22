import { NextRequest, NextResponse } from 'next/server';
import { getSubmission, getInsuredInformation } from '@/lib/db/queries';

// Carrier types
type CarrierType = 'encova' | 'guard';

// Webhook URLs
const ENCOVA_WEBHOOK_URL = process.env.ENCOVA_WEBHOOK_URL || 'https://encova-submission-bot-rpa-production.up.railway.app/webhook';
const GUARD_WEBHOOK_URL = process.env.GUARD_WEBHOOK_URL || 'https://guardsubmissionbot-production.up.railway.app/webhook';

// Helper to parse address and extract components
function parseAddress(address: string | null | undefined): { 
  addressLine1: string; 
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
} {
  if (!address) {
    return { addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '' };
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

  // Extract city (between last comma and state)
  let city = '';
  const cityMatch = address.match(/,\s*([^,]+?)\s*,?\s*[A-Z]{2}\s*\d{5}/i);
  if (cityMatch) {
    city = cityMatch[1].trim();
  } else {
    // Fallback: try to get city from comma-separated parts
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const potentialCity = parts[parts.length - 2] || parts[parts.length - 1];
      city = potentialCity.replace(/\s*[A-Z]{2}\s*\d{5}.*$/i, '').trim();
    }
  }

  // Get address line 1 (everything before city/state/zip)
  let addressLine1 = address
    .replace(/\b\d{5}(?:-\d{4})?\b/, '')
    .replace(new RegExp(`\\b${state}\\b`, 'i'), '')
    .replace(new RegExp(`\\b${city}\\b`, 'i'), '')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/g, '')
    .replace(/^\s*,/g, '')
    .trim();

  // Clean up address line
  addressLine1 = addressLine1.replace(/,\s*$/, '').trim();

  return { 
    addressLine1: addressLine1 || address, 
    addressLine2: '', 
    city: city || '', 
    state: state || 'GA', 
    zipCode 
  };
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
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// Helper to parse phone number into parts
function parsePhone(phone: string | null | undefined): { area: string; prefix: string; suffix: string } {
  if (!phone) return { area: '', prefix: '', suffix: '' };
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return {
      area: digits.substring(0, 3),
      prefix: digits.substring(3, 6),
      suffix: digits.substring(6, 10),
    };
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return {
      area: digits.substring(1, 4),
      prefix: digits.substring(4, 7),
      suffix: digits.substring(7, 11),
    };
  }
  return { area: '', prefix: '', suffix: '' };
}

// Helper to map ownership type to legal entity code
// L=LLC, C=Corporation, P=Partnership, I=Individual, J=Joint Venture
function mapLegalEntity(ownershipType: string | null | undefined, companyName?: string): string {
  // First check ownership type field
  if (ownershipType) {
    const type = ownershipType.toLowerCase();
    if (type.includes('llc') || type.includes('limited liability')) return 'L';
    if (type.includes('corp') || type.includes('inc')) return 'C';
    if (type.includes('partner')) return 'P';
    if (type.includes('individual') || type.includes('sole') || type.includes('proprietor')) return 'I';
    if (type.includes('joint') || type.includes('venture')) return 'J';
  }
  
  // If ownership type doesn't indicate legal entity, check company name
  if (companyName) {
    const name = companyName.toUpperCase();
    if (name.includes(' LLC') || name.includes(',LLC') || name.includes(' L.L.C')) return 'L';
    if (name.includes(' INC') || name.includes(' CORP') || name.includes(' INCORPORATED')) return 'C';
    if (name.includes(' LP') || name.includes(' LLP') || name.includes('PARTNERSHIP')) return 'P';
  }
  
  return 'L'; // Default to LLC
}

// Helper to format date as MM/DD/YYYY
function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  try {
    // Try to parse and format
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return date;
  }
}

// Helper to validate FEIN format
function validateFEIN(fein: string | null | undefined): { valid: boolean; error?: string } {
  if (!fein || !fein.trim()) return { valid: true };
  const cleaned = fein.trim().replace(/\s+/g, '');
  const feinPattern = /^\d{2}-\d{7}$/;
  if (!feinPattern.test(cleaned)) {
    return { valid: false, error: 'FEIN must be in format XX-XXXXXXX' };
  }
  return { valid: true };
}

// Helper to format FEIN
function formatFEIN(fein: string | null | undefined): string {
  if (!fein) return '';
  const digits = fein.replace(/\D/g, '');
  if (digits.length !== 9) return fein;
  return `${digits.substring(0, 2)}-${digits.substring(2)}`;
}

// Normalize insured info
function normalizeInsuredInfo(data: any, businessName: string) {
  if (!data) {
    return {
      corporationName: businessName,
      contactName: '',
      contactNumber: '',
      contactEmail: '',
      address: '',
      operationDescription: '',
      fein: '',
      dba: '',
      ownershipType: '',
      yearsExpInBusiness: null,
      yearsAtLocation: null,
      constructionType: '',
      totalSqFootage: null,
      yearBuilt: null,
      proposedEffectiveDate: '',
      noOfMPOs: null,
      generalLiability: {},
      propertyCoverage: {},
    };
  }
  return {
    corporationName: data.corporationName || data.corporation_name || businessName,
    contactName: data.contactName || data.contact_name || '',
    contactNumber: data.contactNumber || data.contact_number || '',
    contactEmail: data.contactEmail || data.contact_email || '',
    address: data.address || '',
    operationDescription: data.operationDescription || data.operation_description || '',
    fein: data.fein || data.fein_id || data.federal_employer_id || '',
    dba: data.dba || '',
    ownershipType: data.ownershipType || data.ownership_type || '',
    yearsExpInBusiness: data.yearsExpInBusiness || data.years_exp_in_business || null,
    yearsAtLocation: data.yearsAtLocation || data.years_at_location || null,
    constructionType: data.constructionType || data.construction_type || '',
    totalSqFootage: data.totalSqFootage || data.total_sq_footage || null,
    yearBuilt: data.yearBuilt || data.year_built || null,
    proposedEffectiveDate: data.proposedEffectiveDate || data.proposed_effective_date || '',
    noOfMPOs: data.noOfMPOs || data.no_of_mpos || null,
    generalLiability: data.generalLiability || data.general_liability || {},
    propertyCoverage: data.propertyCoverage || data.property_coverage || {},
  };
}

// Build Encova payload
function buildEncovaPayload(normalized: any, submissionId: string) {
  const { firstName, lastName } = parseName(normalized.contactName);
  const address = parseAddress(normalized.address);
  const formattedFEIN = normalized.fein ? formatFEIN(normalized.fein) : '';
  
  const gasolineSalesYearly = (normalized.generalLiability as any)?.gasolineSalesYearly || 
                              (normalized.generalLiability as any)?.gasoline_sales_yearly || null;
  const insideSalesYearly = (normalized.generalLiability as any)?.insideSalesYearly || 
                            (normalized.generalLiability as any)?.inside_sales_yearly || null;
  const bi = (normalized.propertyCoverage as any)?.bi || null;
  const bpp = (normalized.propertyCoverage as any)?.bpp || null;

  return {
    action: 'start_automation',
    task_id: `encova_${submissionId}_${Date.now()}`,
    data: {
      form_data: {
        firstName: firstName || 'N/A',
        lastName: lastName || 'N/A',
        companyName: normalized.corporationName,
        fein: formattedFEIN,
        description: normalized.operationDescription || 'Business operations',
        addressLine1: address.addressLine1,
        zipCode: address.zipCode,
        phone: normalized.contactNumber || '',
        email: normalized.contactEmail || '',
      },
      dropdowns: {
        state: address.state,
        addressType: 'Business',
        contactMethod: 'Email',
        producer: 'Shahnaz Sutar',
      },
      save_form: true,
      run_quote_automation: true,
      quote_data: {
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
}

// Build Guard payload - SIMPLIFIED (server hardcodes many fields)
function buildGuardPayload(normalized: any, submissionId: string) {
  const address = parseAddress(normalized.address);
  const phone = parsePhone(normalized.contactNumber);
  const yearsInBusiness = normalized.yearsExpInBusiness || normalized.yearsAtLocation || 0;
  
  // Gasoline gallons - NOT dollars, don't include in combined sales
  const gasolineGallons = Number((normalized.generalLiability as any)?.gasolineSalesYearly || 
                              (normalized.generalLiability as any)?.gasoline_sales_yearly || 0);
  // Inside sales - dollar amount
  const insideSalesYearly = Number((normalized.generalLiability as any)?.insideSalesYearly || 
                            (normalized.generalLiability as any)?.inside_sales_yearly || 0);
  // Combined sales = only dollar-based sales (not gallons)
  const combinedSales = insideSalesYearly;

  // Map ownership type to legal entity code
  // L=LLC, C=Corporation, P=Partnership, I=Individual, J=Joint Venture
  const legalEntity = mapLegalEntity(normalized.ownershipType, normalized.corporationName);
  
  // Map ownership for tenant/owner field
  const ownershipType = normalized.ownershipType?.toLowerCase().includes('owner') ? 'owner' : 'tenant';

  return {
    // Action & Task
    action: 'start_automation',
    task_id: `guard_${submissionId}_${Date.now()}`,
    
    // Create account flag
    create_account: true,
    
    // Account data - ONLY user-provided fields (server hardcodes the rest)
    account_data: {
      // Business Entity Information
      legal_entity: legalEntity,
      applicant_name: normalized.corporationName,
      dba: normalized.dba || '',
      
      // Business Address
      address1: address.addressLine1,
      address2: address.addressLine2 || '',
      zipcode: address.zipCode,
      city: address.city,
      state: address.state,
      
      // Contact Information
      contact_name: normalized.contactName || '',
      contact_phone: {
        area: phone.area,
        prefix: phone.prefix,
        suffix: phone.suffix,
      },
      email: normalized.contactEmail || '',
      
      // Business Details
      years_in_business: String(yearsInBusiness),
      description: normalized.operationDescription || '',
      
      // Property Ownership
      ownership_type: ownershipType,
      
      // NOTE: These fields are HARDCODED on server - not sending:
      // website, producer_id, csr_id, policy_inception, headquarters_state,
      // industry_id, sub_industry_id, business_type_id, lines_of_business
    },
    
    // Quote data - filled after account is created
    quote_data: {
      combined_sales: String(combinedSales),
      gas_gallons: String(gasolineGallons),
      year_built: normalized.yearBuilt ? String(normalized.yearBuilt) : '',
      square_footage: normalized.totalSqFootage ? String(normalized.totalSqFootage) : '',
      mpds: normalized.noOfMPOs ? String(normalized.noOfMPOs) : '0',
    },
  };
}

// Send to carrier webhook
async function sendToCarrier(carrier: CarrierType, payload: any): Promise<{
  carrier: CarrierType;
  success: boolean;
  data?: any;
  error?: string;
}> {
  const webhookUrl = carrier === 'encova' ? ENCOVA_WEBHOOK_URL : GUARD_WEBHOOK_URL;
  
  try {
    console.log(`[AUTO-SUBMIT] Sending to ${carrier}:`, JSON.stringify(payload, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[AUTO-SUBMIT] ${carrier} error:`, result);
      return {
        carrier,
        success: false,
        error: result.message || result.error || `HTTP ${response.status}`,
      };
    }

    console.log(`[AUTO-SUBMIT] ${carrier} success:`, result);
    return {
      carrier,
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error(`[AUTO-SUBMIT] ${carrier} exception:`, error);
    return {
      carrier,
      success: false,
      error: error.message || 'Network error',
    };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;
    const body = await request.json().catch(() => ({}));
    const carriers: CarrierType[] = body.carriers || ['encova', 'guard'];
    
    console.log(`[AUTO-SUBMIT] Request for submission ${submissionId}, carriers: ${carriers.join(', ')}`);

    // Fetch submission
    const submission = await getSubmission(submissionId);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Get insured info
    let insuredInfo = submission.insuredInfoSnapshot;
    if (!insuredInfo && submission.insuredInfoId) {
      insuredInfo = await getInsuredInformation(submission.insuredInfoId);
    }

    const normalized = normalizeInsuredInfo(insuredInfo, submission.businessName);

    // Validation
    if (!normalized.corporationName) {
      return NextResponse.json(
        { error: 'Corporation name is required.' },
        { status: 400 }
      );
    }

    if (!normalized.address) {
      return NextResponse.json(
        { error: 'Address is required.' },
        { status: 400 }
      );
    }

    const address = parseAddress(normalized.address);
    if (!address.zipCode) {
      return NextResponse.json(
        { 
          error: 'Zip code is required in address',
          details: `Please update the address to include a zip code.`,
        },
        { status: 400 }
      );
    }

    // Validate year built - required for both carriers
    if (!normalized.yearBuilt) {
      return NextResponse.json(
        { error: 'Year built is required for RPA submission.' },
        { status: 400 }
      );
    }
    
    const yearBuiltNum = typeof normalized.yearBuilt === 'string' 
      ? parseInt(normalized.yearBuilt, 10) 
      : normalized.yearBuilt;
    
    if (isNaN(yearBuiltNum) || yearBuiltNum < 1800 || yearBuiltNum > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { 
          error: `Year built must be a valid year between 1800 and ${new Date().getFullYear() + 1}`,
          field: 'yearBuilt'
        },
        { status: 400 }
      );
    }

    // Validate FEIN if provided
    const feinValidation = validateFEIN(normalized.fein);
    if (!feinValidation.valid) {
      return NextResponse.json(
        { error: feinValidation.error, field: 'fein' },
        { status: 400 }
      );
    }

    // Guard-specific validation
    if (carriers.includes('guard')) {
      if (!normalized.contactName) {
        return NextResponse.json(
          { error: 'Contact name is required for Guard submission.' },
          { status: 400 }
        );
      }
      if (!normalized.contactNumber) {
        return NextResponse.json(
          { error: 'Contact phone is required for Guard submission.' },
          { status: 400 }
        );
      }
      const yearsInBusiness = normalized.yearsExpInBusiness || normalized.yearsAtLocation;
      if (!yearsInBusiness) {
        return NextResponse.json(
          { error: 'Years in business is required for Guard submission.' },
          { status: 400 }
        );
      }
      if (!normalized.operationDescription) {
        return NextResponse.json(
          { error: 'Description of operations is required for Guard submission.' },
          { status: 400 }
        );
      }
      // Policy inception date is auto-set by Guard automation if not provided
      if (!address.city) {
        return NextResponse.json(
          { error: 'City is required in address for Guard submission.' },
          { status: 400 }
        );
      }
    }

    // Build payloads and send in parallel
    const promises: Promise<any>[] = [];
    
    if (carriers.includes('encova')) {
      const encovaPayload = buildEncovaPayload(normalized, submissionId);
      promises.push(sendToCarrier('encova', encovaPayload));
    }
    
    if (carriers.includes('guard')) {
      const guardPayload = buildGuardPayload(normalized, submissionId);
      promises.push(sendToCarrier('guard', guardPayload));
    }

    // Wait for all requests to complete
    const results = await Promise.all(promises);

    // Build response
    const response: any = {
      success: results.every(r => r.success),
      results: {},
    };

    for (const result of results) {
      response.results[result.carrier] = {
        success: result.success,
        message: result.success 
          ? (result.data?.message || 'Submitted successfully')
          : (result.error || 'Submission failed'),
        taskId: result.data?.task_id,
        status: result.data?.status,
        ...(result.data?.account_created && {
          accountCreated: true,
          accountNumber: result.data.account_number,
          quoteUrl: result.data.quote_url,
        }),
        ...(result.data?.policy_code && {
          policyCode: result.data.policy_code,
        }),
        ...(result.data?.quotation_url && {
          quotationUrl: result.data.quotation_url,
        }),
      };
    }

    // Set overall message
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    if (successCount === totalCount) {
      response.message = `Successfully submitted to ${totalCount} carrier${totalCount > 1 ? 's' : ''}`;
    } else if (successCount > 0) {
      response.message = `Partial success: ${successCount}/${totalCount} carriers`;
      response.success = false; // Mark as partial failure
    } else {
      response.message = 'All submissions failed';
    }

    console.log('[AUTO-SUBMIT] Final response:', JSON.stringify(response, null, 2));

    return NextResponse.json(response, { 
      status: response.success ? 200 : (successCount > 0 ? 207 : 500) 
    });

  } catch (error: any) {
    console.error('[AUTO-SUBMIT] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to auto-submit submission' },
      { status: 500 }
    );
  }
}
