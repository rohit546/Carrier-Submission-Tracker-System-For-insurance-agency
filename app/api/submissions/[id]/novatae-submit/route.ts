import { NextRequest, NextResponse } from 'next/server';
import { getSubmission, getInsuredInformation } from '@/lib/db/queries';
import { createNovataeSheet } from '@/lib/google-sheets';
import { InsuredInformation } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: submissionId } = params;

    console.log(`[NOVATAE-SUBMIT] Request for submission ${submissionId}`);

    // Get submission
    const submission = await getSubmission(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Get insured information
    if (!submission.insuredInfoId) {
      return NextResponse.json(
        { error: 'Insured information is required for Novatae submission' },
        { status: 400 }
      );
    }

    const insuredInfo = await getInsuredInformation(submission.insuredInfoId);
    if (!insuredInfo) {
      return NextResponse.json(
        { error: 'Insured information not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!insuredInfo.corporationName) {
      return NextResponse.json(
        { error: 'Corporation name is required' },
        { status: 400 }
      );
    }

    if (!insuredInfo.address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Create Novatae sheet
    console.log(`[NOVATAE-SUBMIT] Creating sheet for ${insuredInfo.corporationName}`);
    
    // Convert null values to undefined for type compatibility
    const normalizedInsuredInfo: InsuredInformation = {
      ...insuredInfo,
      targetPremium: insuredInfo.targetPremium ?? undefined,
      noOfMPOs: insuredInfo.noOfMPOs ?? undefined,
      yearsExpInBusiness: insuredInfo.yearsExpInBusiness ?? undefined,
      yearsAtLocation: insuredInfo.yearsAtLocation ?? undefined,
      yearBuilt: insuredInfo.yearBuilt ?? undefined,
      yearLatestUpdate: insuredInfo.yearLatestUpdate ?? undefined,
      totalSqFootage: insuredInfo.totalSqFootage ?? undefined,
    };
    
    const result = await createNovataeSheet(normalizedInsuredInfo, submissionId);

    console.log(`[NOVATAE-SUBMIT] Sheet created: ${result.sheetUrl}`);

    return NextResponse.json({
      success: true,
      message: 'Novatae sheet created successfully',
      sheetUrl: result.sheetUrl,
      sheetId: result.sheetId,
    });

  } catch (error: any) {
    console.error('[NOVATAE-SUBMIT] Error:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('GOOGLE_SERVICE_ACCOUNT_JSON')) {
      return NextResponse.json(
        { error: 'Google Sheets API credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_JSON environment variable.' },
        { status: 500 }
      );
    }

    if (error.message?.includes('Template sheet not found')) {
      return NextResponse.json(
        { error: 'Template sheet not found. Please ensure the template sheet is accessible.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create Novatae sheet' },
      { status: 500 }
    );
  }
}
