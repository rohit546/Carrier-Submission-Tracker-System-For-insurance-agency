import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import { randomUUID } from 'crypto'
import { AdditionalInterest } from '@/types/form'

// Helper function to safely parse integers
function safeParseInt(value: string | number | undefined | null): number | null {
  if (!value) return null
  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10)
  return isNaN(parsed) ? null : parsed
}

// Helper function to safely parse floats
function safeParseFloat(value: string | number | undefined | null): number | null {
  if (!value) return null
  const parsed = typeof value === 'number' ? value : parseFloat(String(value))
  return isNaN(parsed) ? null : parsed
}

export async function POST(request: NextRequest) {
  let client: Client | null = null

  try {
    const formData = await request.json()

    // Validate required fields
    if (!formData.corporationName) {
      return NextResponse.json(
        { success: false, error: 'Corporation name is required' },
        { status: 400 }
      )
    }

    // Get database connection string (separate from NEON_CONNECTION_STRING which is for GSOS lookups)
    const connectionString = process.env.COVERSHEET_STRING
    if (!connectionString) {
      console.error('❌ COVERSHEET_STRING not configured')
      return NextResponse.json(
        { success: false, error: 'Coversheet database not configured' },
        { status: 500 }
      )
    }

    // Connect to database
    client = new Client({ connectionString })
    await client.connect()

    // Get agent_id - simple lookup for username "agent" (required field in submissions table)
    let agentId: string | null = null
    try {
      const agentQuery = await client.query(
        `SELECT id FROM users WHERE LOWER(username) = 'agent' LIMIT 1`
      )
      if (agentQuery.rows.length > 0) {
        agentId = agentQuery.rows[0].id
      }
    } catch (error: any) {
      console.error('⚠️ Error looking up agent:', error.message)
    }

    // If no agent found, return error (agent_id is required NOT NULL in submissions table)
    if (!agentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Agent user not found. Please ensure a user with username "agent" exists in the users table.' 
        },
        { status: 400 }
      )
    }

    // Generate unique identifier from corporation_name + address
    const uniqueIdentifier = `${formData.corporationName}_${formData.address || 'no-address'}`.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 255)
    
    // Generate UUIDs
    const eformSubmissionId = randomUUID()
    const publicAccessToken = randomUUID()

    // Prepare insured_information data
    const insuredInfoData = {
      unique_identifier: uniqueIdentifier,
      ownership_type: formData.ownershipType || null,
      corporation_name: formData.corporationName,
      contact_name: formData.contactName || null,
      contact_number: formData.contactNumber || null,
      contact_email: formData.contactEmail || null,
      lead_source: formData.leadSource || null,
      proposed_effective_date: formData.proposedEffectiveDate ? new Date(formData.proposedEffectiveDate) : null,
      prior_carrier: formData.priorCarrier || null,
      target_premium: safeParseFloat(formData.targetPremium),
      applicant_is: formData.applicantType || null,
      operation_description: formData.operationDescription || null,
      dba: formData.dba || null,
      fein: formData.fein || null,
      address: formData.address || null,
      hours_of_operation: formData.hoursOfOperation || null,
      no_of_mpos: safeParseInt(formData.noOfMPDs),
      construction_type: formData.constructionType || null,
      years_exp_in_business: safeParseInt(formData.yearsInBusiness),
      years_at_location: safeParseInt(formData.yearsAtLocation),
      year_built: safeParseInt(formData.yearBuilt),
      year_latest_update: safeParseInt(formData.yearOfLatestUpdate),
      total_sq_footage: safeParseInt(formData.totalSqFootage),
      leased_out_space: formData.anyLeasedOutSpace || null,
      protection_class: formData.protectionClass || null,
      additional_insured: formData.additionalInterests && formData.additionalInterests.length > 0
        ? formData.additionalInterests.map((ai: AdditionalInterest) => `${ai.type}: ${ai.name || ''}${ai.address ? ' - ' + ai.address : ''}`).join('; ')
        : null,
      alarm_info: {
        burglar: {
          centralStation: formData.burglarAlarm?.centralStation || false,
          local: formData.burglarAlarm?.local || false
        }
      },
      fire_info: {
        fire: {
          centralStation: formData.fireAlarm?.centralStation || false,
          local: formData.fireAlarm?.local || false
        }
      },
      property_coverage: {
        building: formData.building || null,
        bpp: formData.bpp || null,
        bi: formData.bi || null,
        canopy: formData.canopy || null,
        pumps: formData.pumps || null,
        ms: formData.ms || null
      },
      general_liability: {
        insideSalesMonthly: formData.insideSalesMonthly || null,
        insideSalesYearly: formData.insideSalesYearly || null,
        liquorSalesMonthly: formData.liquorSalesMonthly || null,
        liquorSalesYearly: formData.liquorSalesYearly || null,
        gasolineSalesMonthly: formData.gasolineSalesMonthly || formData.gasSalesMonthly || null,
        gasolineSalesYearly: formData.gasolineSalesYearly || formData.gasSalesYearly || null,
        propaneFillingExchangeMonthly: formData.propaneFillingExchangeMonthly || formData.propaneSalesMonthly || null,
        propaneFillingExchangeYearly: formData.propaneFillingExchangeYearly || formData.propaneSalesYearly || null,
        carwash: formData.carwash || formData.carwashMonthly || null,
        cooking: formData.cooking || formData.cookingMonthly || null
      },
      workers_compensation: {
        noOfEmployees: formData.noOfEmployees || null,
        payroll: formData.payroll || null,
        officersInclExcl: formData.officersInclExcl || null
      },
      source: 'eform',
      eform_submission_id: eformSubmissionId
    }

    // Insert into insured_information table
    const insuredInfoQuery = `
      INSERT INTO insured_information (
        unique_identifier, ownership_type, corporation_name, contact_name, contact_number,
        contact_email, lead_source, proposed_effective_date, prior_carrier, target_premium,
        applicant_is, operation_description, dba, fein, address, hours_of_operation, no_of_mpos,
        construction_type, years_exp_in_business, years_at_location, year_built,
        year_latest_update, total_sq_footage, leased_out_space, protection_class,
        additional_insured, alarm_info, fire_info, property_coverage, general_liability,
        workers_compensation, source, eform_submission_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
      ) RETURNING id
    `

    const insuredInfoResult = await client.query(insuredInfoQuery, [
      insuredInfoData.unique_identifier,
      insuredInfoData.ownership_type,
      insuredInfoData.corporation_name,
      insuredInfoData.contact_name,
      insuredInfoData.contact_number,
      insuredInfoData.contact_email,
      insuredInfoData.lead_source,
      insuredInfoData.proposed_effective_date,
      insuredInfoData.prior_carrier,
      insuredInfoData.target_premium,
      insuredInfoData.applicant_is,
      insuredInfoData.operation_description,
      insuredInfoData.dba,
      insuredInfoData.fein,
      insuredInfoData.address,
      insuredInfoData.hours_of_operation,
      insuredInfoData.no_of_mpos,
      insuredInfoData.construction_type,
      insuredInfoData.years_exp_in_business,
      insuredInfoData.years_at_location,
      insuredInfoData.year_built,
      insuredInfoData.year_latest_update,
      insuredInfoData.total_sq_footage,
      insuredInfoData.leased_out_space,
      insuredInfoData.protection_class,
      insuredInfoData.additional_insured,
      JSON.stringify(insuredInfoData.alarm_info),
      JSON.stringify(insuredInfoData.fire_info),
      JSON.stringify(insuredInfoData.property_coverage),
      JSON.stringify(insuredInfoData.general_liability),
      JSON.stringify(insuredInfoData.workers_compensation),
      insuredInfoData.source,
      insuredInfoData.eform_submission_id
    ])

    const insuredInfoId = insuredInfoResult.rows[0].id

    // Create snapshot of insured info for submissions table
    const insuredInfoSnapshot = insuredInfoData

    // Get GHL opportunity ID from form data (if provided)
    const ghlOpportunityId = formData.ghlOpportunityId || formData._ghlOpportunityId || null

    // Insert into submissions table
    const submissionQuery = `
      INSERT INTO submissions (
        business_name, agent_id, status, insured_info_id, insured_info_snapshot,
        source, eform_submission_id, public_access_token, ghl_opportunity_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `

    // Use the found agent_id
    const submissionResult = await client.query(submissionQuery, [
      formData.corporationName,
      agentId, // Use the found agent_id
      'draft',
      insuredInfoId,
      JSON.stringify(insuredInfoSnapshot),
      'eform',
      eformSubmissionId,
      publicAccessToken,
      ghlOpportunityId
    ])

    const submissionId = submissionResult.rows[0].id

    console.log('✅ Successfully saved to Coversheet database:', {
      insuredInfoId,
      submissionId,
      publicAccessToken,
      ghlOpportunityId: ghlOpportunityId || 'N/A (not provided)'
    })

    return NextResponse.json({
      success: true,
      insuredInfoId,
      submissionId,
      publicAccessToken,
      eformSubmissionId
    })

  } catch (error: any) {
    console.error('❌ Error saving to Coversheet database:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to save to database' 
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.end()
    }
  }
}

