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
    
    // If no snapshot but has ID, fetch it from database
    if (!insuredInfo && submission.insuredInfoId) {
      insuredInfo = await getInsuredInformation(submission.insuredInfoId);
    }

    // Normalize insured info (handle snake_case)
    const normalize = (data: any) => {
      if (!data) return null;
      return {
        corporationName: data.corporationName || data.corporation_name || submission.businessName,
        contactName: data.contactName || data.contact_name || '',
        contactNumber: data.contactNumber || data.contact_number || '',
        contactEmail: data.contactEmail || data.contact_email || '',
        address: data.address || '',
        operationDescription: data.operationDescription || data.operation_description || '',
      };
    };

    const normalized = normalize(insuredInfo);
    
    // Validate required fields
    if (!normalized?.corporationName) {
      return NextResponse.json(
        { error: 'Corporation name is required' },
        { status: 400 }
      );
    }

    if (!normalized.address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Parse address
    const { addressLine1, zipCode } = parseAddress(normalized.address);
    
    if (!zipCode) {
      return NextResponse.json(
        { error: 'Zip code is required in address' },
        { status: 400 }
      );
    }

    // Parse contact name
    const { firstName, lastName } = parseName(normalized.contactName);
    
    // Extract state
    const state = extractState(normalized.address);

    // Prepare webhook payload
    const taskId = `submission_${submissionId}_${Date.now()}`;
    
    const payload = {
      action: 'start_automation',
      task_id: taskId,
      data: {
        form_data: {
          firstName: firstName || 'N/A',
          lastName: lastName || 'N/A',
          companyName: normalized.corporationName,
          fein: '', // FEIN not stored in current schema - can be added later
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
      },
    };

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

    return NextResponse.json({
      success: true,
      message: 'Submission sent to RPA successfully',
      taskId: taskId,
      status: result.status || 'accepted',
    });

  } catch (error: any) {
    console.error('Auto-submit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to auto-submit submission' },
      { status: 500 }
    );
  }
}

