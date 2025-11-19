import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/connection';
import { randomUUID } from 'crypto';

// API Key for eform authentication (set in .env.local)
const EFORM_API_KEY = process.env.EFORM_API_KEY || 'default-eform-key-change-in-production';

interface EformPayload {
  // Ownership & Basic Info
  ownershipType?: string;
  corporationName: string;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  leadSource?: string;
  proposedEffectiveDate?: string;
  priorCarrier?: string;
  targetPremium?: number;
  
  // Business Structure
  applicantIs?: string;
  operationDescription?: string;
  dba?: string;
  address?: string;
  
  // Property Details
  hoursOfOperation?: string;
  noOfMPOs?: number;
  constructionType?: string;
  yearsExpInBusiness?: number;
  yearsAtLocation?: number;
  yearBuilt?: number;
  yearLatestUpdate?: number;
  totalSqFootage?: number;
  leasedOutSpace?: string;
  protectionClass?: string;
  additionalInsured?: string;
  
  // Security
  alarm?: {
    burglar?: boolean;
    centralStation?: boolean;
    local?: boolean;
  };
  fire?: {
    centralStation?: boolean;
    local?: boolean;
  };
  
  // Coverage
  propertyCoverage?: {
    building?: number;
    bpp?: number;
    bi?: number;
    canopy?: number;
    pumps?: number;
    mAndG?: number;
  };
  generalLiability?: {
    insideSalesTotal?: { monthly?: number; yearly?: number };
    liquorSales?: { monthly?: number; yearly?: number };
    gasolineSales?: { monthly?: number; yearly?: number };
    propaneFillingExchange?: { monthly?: number; yearly?: number };
    carwash?: { monthly?: number; yearly?: number };
    cooking?: { monthly?: number; yearly?: number };
  };
  workersCompensation?: {
    fein?: string;
    noOfEmployees?: number;
    payroll?: number;
    inclExcl?: string;
    percentOwnership?: number;
  };
  
  // Metadata
  agentId?: string; // Optional: if eform knows the agent
  eformSubmissionId?: string; // Optional: eform's own submission ID
}

export async function POST(request: NextRequest) {
  try {
    // Check API key (simple authentication)
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== EFORM_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid API key.' },
        { status: 401 }
      );
    }

    const data: EformPayload = await request.json();

    // Validate required fields
    if (!data.corporationName || data.corporationName.trim() === '') {
      return NextResponse.json(
        { error: 'corporationName is required' },
        { status: 400 }
      );
    }

    // Generate unique identifier (corporation name + address hash)
    const uniqueId = `${data.corporationName}_${data.address || 'no-address'}`.toLowerCase().replace(/\s+/g, '-').substring(0, 255);

    // Check if insured info already exists
    let insuredInfoId: string;
    const existing = await sql`
      SELECT id FROM insured_information 
      WHERE unique_identifier = ${uniqueId}
      LIMIT 1
    `;

    if (existing.length > 0) {
      // Update existing insured info
      insuredInfoId = existing[0].id;
      await sql`
        UPDATE insured_information
        SET
          ownership_type = ${data.ownershipType || null},
          corporation_name = ${data.corporationName},
          contact_name = ${data.contactName || null},
          contact_number = ${data.contactNumber || null},
          contact_email = ${data.contactEmail || null},
          lead_source = ${data.leadSource || null},
          proposed_effective_date = ${data.proposedEffectiveDate ? new Date(data.proposedEffectiveDate) : null},
          prior_carrier = ${data.priorCarrier || null},
          target_premium = ${data.targetPremium || null},
          applicant_is = ${data.applicantIs || null},
          operation_description = ${data.operationDescription || null},
          dba = ${data.dba || null},
          address = ${data.address || null},
          hours_of_operation = ${data.hoursOfOperation || null},
          no_of_mpos = ${data.noOfMPOs || null},
          construction_type = ${data.constructionType || null},
          years_exp_in_business = ${data.yearsExpInBusiness || null},
          years_at_location = ${data.yearsAtLocation || null},
          year_built = ${data.yearBuilt || null},
          year_latest_update = ${data.yearLatestUpdate || null},
          total_sq_footage = ${data.totalSqFootage || null},
          leased_out_space = ${data.leasedOutSpace || null},
          protection_class = ${data.protectionClass || null},
          additional_insured = ${data.additionalInsured || null},
          alarm_info = ${JSON.stringify(data.alarm || {})}::jsonb,
          fire_info = ${JSON.stringify(data.fire || {})}::jsonb,
          property_coverage = ${JSON.stringify(data.propertyCoverage || {})}::jsonb,
          general_liability = ${JSON.stringify(data.generalLiability || {})}::jsonb,
          workers_compensation = ${JSON.stringify(data.workersCompensation || {})}::jsonb,
          source = 'eform',
          eform_submission_id = ${data.eformSubmissionId || null},
          updated_at = NOW()
        WHERE id = ${insuredInfoId}
      `;
    } else {
      // Create new insured info
      const result = await sql`
        INSERT INTO insured_information (
          unique_identifier,
          ownership_type, corporation_name, contact_name, contact_number, contact_email,
          lead_source, proposed_effective_date, prior_carrier, target_premium,
          applicant_is, operation_description, dba, address,
          hours_of_operation, no_of_mpos, construction_type,
          years_exp_in_business, years_at_location, year_built, year_latest_update,
          total_sq_footage, leased_out_space, protection_class, additional_insured,
          alarm_info, fire_info, property_coverage, general_liability, workers_compensation,
          source, eform_submission_id
        )
        VALUES (
          ${uniqueId},
          ${data.ownershipType || null}, ${data.corporationName}, ${data.contactName || null},
          ${data.contactNumber || null}, ${data.contactEmail || null},
          ${data.leadSource || null}, ${data.proposedEffectiveDate ? new Date(data.proposedEffectiveDate) : null},
          ${data.priorCarrier || null}, ${data.targetPremium || null},
          ${data.applicantIs || null}, ${data.operationDescription || null},
          ${data.dba || null}, ${data.address || null},
          ${data.hoursOfOperation || null}, ${data.noOfMPOs || null},
          ${data.constructionType || null},
          ${data.yearsExpInBusiness || null}, ${data.yearsAtLocation || null},
          ${data.yearBuilt || null}, ${data.yearLatestUpdate || null},
          ${data.totalSqFootage || null}, ${data.leasedOutSpace || null},
          ${data.protectionClass || null}, ${data.additionalInsured || null},
          ${JSON.stringify(data.alarm || {})}::jsonb,
          ${JSON.stringify(data.fire || {})}::jsonb,
          ${JSON.stringify(data.propertyCoverage || {})}::jsonb,
          ${JSON.stringify(data.generalLiability || {})}::jsonb,
          ${JSON.stringify(data.workersCompensation || {})}::jsonb,
          'eform', ${data.eformSubmissionId || null}
        )
        RETURNING id
      `;
      insuredInfoId = result[0].id;
    }

    // Get snapshot of insured info for historical reference
    const insuredSnapshotRows = await sql`
      SELECT * FROM insured_information WHERE id = ${insuredInfoId}
    `;
    
    if (insuredSnapshotRows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve insured information' },
        { status: 500 }
      );
    }
    
    const insuredSnapshot = insuredSnapshotRows[0];
    
    // Format snapshot properly for JSONB storage
    const snapshotData = {
      id: insuredSnapshot.id,
      uniqueIdentifier: insuredSnapshot.unique_identifier,
      ownershipType: insuredSnapshot.ownership_type,
      corporationName: insuredSnapshot.corporation_name,
      contactName: insuredSnapshot.contact_name,
      contactNumber: insuredSnapshot.contact_number,
      contactEmail: insuredSnapshot.contact_email,
      leadSource: insuredSnapshot.lead_source,
      proposedEffectiveDate: insuredSnapshot.proposed_effective_date?.toISOString(),
      priorCarrier: insuredSnapshot.prior_carrier,
      targetPremium: insuredSnapshot.target_premium ? parseFloat(insuredSnapshot.target_premium) : null,
      applicantIs: insuredSnapshot.applicant_is,
      operationDescription: insuredSnapshot.operation_description,
      dba: insuredSnapshot.dba,
      address: insuredSnapshot.address,
      hoursOfOperation: insuredSnapshot.hours_of_operation,
      noOfMPOs: insuredSnapshot.no_of_mpos,
      constructionType: insuredSnapshot.construction_type,
      yearsExpInBusiness: insuredSnapshot.years_exp_in_business,
      yearsAtLocation: insuredSnapshot.years_at_location,
      yearBuilt: insuredSnapshot.year_built,
      yearLatestUpdate: insuredSnapshot.year_latest_update,
      totalSqFootage: insuredSnapshot.total_sq_footage,
      leasedOutSpace: insuredSnapshot.leased_out_space,
      protectionClass: insuredSnapshot.protection_class,
      additionalInsured: insuredSnapshot.additional_insured,
      alarmInfo: insuredSnapshot.alarm_info,
      fireInfo: insuredSnapshot.fire_info,
      propertyCoverage: insuredSnapshot.property_coverage,
      generalLiability: insuredSnapshot.general_liability,
      workersCompensation: insuredSnapshot.workers_compensation,
      source: insuredSnapshot.source,
      eformSubmissionId: insuredSnapshot.eform_submission_id,
      createdAt: insuredSnapshot.created_at?.toISOString(),
      updatedAt: insuredSnapshot.updated_at?.toISOString(),
    };

    // Get default agent (or use provided agentId)
    let agentId = data.agentId;
    if (!agentId) {
      // Get first agent from database
      const agents = await sql`
        SELECT id FROM users WHERE role = 'agent' LIMIT 1
      `;
      if (agents.length > 0) {
        agentId = agents[0].id;
      } else {
        return NextResponse.json(
          { error: 'No agent found in system. Please create an agent first.' },
          { status: 400 }
        );
      }
    }

    // Generate public access token for no-auth access
    const publicToken = randomUUID();

    // Create submission draft
    const submissionResult = await sql`
      INSERT INTO submissions (
        business_name,
        business_type_id,
        agent_id,
        status,
        insured_info_id,
        insured_info_snapshot,
        source,
        eform_submission_id,
        public_access_token
      )
      VALUES (
        ${data.corporationName},
        NULL, -- business_type_id is null initially (agent selects later)
        ${agentId},
        'draft',
        ${insuredInfoId},
        ${JSON.stringify(snapshotData)}::jsonb,
        'eform',
        ${data.eformSubmissionId || null},
        ${publicToken}
      )
      RETURNING id
    `;

    const submissionId = submissionResult[0].id;

    // Return submission ID and public access URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const publicUrl = `${baseUrl}/agent/submission/${submissionId}?token=${publicToken}`;

    return NextResponse.json({
      success: true,
      submissionId,
      publicToken,
      publicUrl,
      message: 'Submission draft created successfully'
    });

  } catch (error: any) {
    console.error('Eform integration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create submission' },
      { status: 500 }
    );
  }
}

