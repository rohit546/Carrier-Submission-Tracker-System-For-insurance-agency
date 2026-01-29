// Webhook API route for sending form data to external endpoints
import { NextRequest, NextResponse } from 'next/server'
import { FormData, AdditionalInterest } from '@/types/form'

// Helper function to generate unique identifier
function generateUniqueIdentifier(formData: FormData): string {
  const corpName = (formData.corporationName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_')
  const address = (formData.address || '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')
  return `${corpName}_${address}`.substring(0, 100)
}

// Transform form data to webhook format
function transformFormDataToWebhookFormat(formData: any): any {
  const now = new Date()
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 23)
  
  // Extract submissionId for dashboard_link (internal field)
  const submissionId = (formData as any)._submissionId || null
  
  // Generate IDs
  const id = crypto.randomUUID()
  const eformSubmissionId = crypto.randomUUID()
  const uniqueIdentifier = generateUniqueIdentifier(formData as FormData)
  
  // Construct dashboard_link if submissionId is available
  const dashboardLink = submissionId 
    ? `https://carrier-submission-tracker-system-for-insurance-production.up.railway.app/agent/submission/${submissionId}`
    : null

  // Format additional interests - create both old and new format for compatibility
  let additionalInsuredText = ''
  if (formData.additionalInterests && formData.additionalInterests.length > 0) {
    additionalInsuredText = formData.additionalInterests
      .map((ai: AdditionalInterest) => `${ai.name || 'N/A'} - ${ai.type}${ai.address ? ' (' + ai.address + ')' : ''}`)
      .join('; ')
  }

  // Get first additional interest for individual fields (if exists)
  const firstInterest = formData.additionalInterests && formData.additionalInterests.length > 0 
    ? formData.additionalInterests[0] 
    : null

  // Transform general liability sales - convert strings to numbers where possible
  const parseNumber = (value: string | undefined): number | null => {
    if (!value) return null
    const num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''))
    return isNaN(num) ? null : num
  }

  // Transform property coverage - convert strings to numbers
  const parseCoverageValue = (value: string | undefined): string | null => {
    if (!value) return null
    // Remove currency symbols and commas, keep as string
    return value.toString().replace(/[^0-9]/g, '') || null
  }

  return {
    id,
    unique_identifier: uniqueIdentifier,
    ownership_type: formData.ownershipType || null,
    corporation_name: formData.corporationName || null,
    contact_name: formData.contactName || null,
    contact_number: formData.contactNumber || null,
    contact_email: formData.contactEmail || null,
    lead_source: formData.leadSource || null,
    proposed_effective_date: formData.proposedEffectiveDate || null,
    prior_carrier: formData.priorCarrier || null,
    target_premium: formData.targetPremium || null,
    applicant_is: formData.applicantType || null,
    operation_description: formData.operationDescription || null,
    dba: formData.dba || null,
    address: formData.address || null,
    hours_of_operation: formData.hoursOfOperation || null,
    no_of_mpos: formData.noOfMPDs || null,
    construction_type: formData.constructionType || null,
    years_exp_in_business: formData.yearsInBusiness || null,
    years_at_location: formData.yearsAtLocation || null,
    year_built: formData.yearBuilt || null,
    year_latest_update: formData.yearOfLatestUpdate || null,
    total_sq_footage: formData.totalSqFootage || null,
    leased_out_space: formData.anyLeasedOutSpace || null,
    protection_class: formData.protectionClass || null,
    additional_insured: additionalInsuredText || null,
    alarm_info: {
      burglar: {
        local: formData.burglarAlarm?.local || false,
        centralStation: formData.burglarAlarm?.centralStation || false
      }
    },
    fire_info: {
      fire: {
        local: formData.fireAlarm?.local || false,
        centralStation: formData.fireAlarm?.centralStation || false
      }
    },
    property_coverage: {
      bi: parseCoverageValue(formData.bi),
      ms: parseCoverageValue(formData.ms),
      bpp: parseCoverageValue(formData.bpp),
      pumps: parseCoverageValue(formData.pumps),
      canopy: parseCoverageValue(formData.canopy),
      building: parseCoverageValue(formData.building)
    },
    general_liability: {
      carwash: parseNumber(formData.carwash) || parseNumber(formData.carwashMonthly) || null,
      cooking: parseNumber(formData.cooking) || parseNumber(formData.cookingMonthly) || null,
      insideSalesYearly: parseNumber(formData.insideSalesYearly) || null,
      liquorSalesYearly: parseNumber(formData.liquorSalesYearly) || null,
      insideSalesMonthly: parseNumber(formData.insideSalesMonthly) || null,
      liquorSalesMonthly: parseNumber(formData.liquorSalesMonthly) || null,
      gasolineSalesYearly: parseNumber(formData.gasolineSalesYearly) || parseNumber(formData.gasSalesYearly) || null,
      gasolineSalesMonthly: parseNumber(formData.gasolineSalesMonthly) || parseNumber(formData.gasSalesMonthly) || null,
      propaneFillingExchangeYearly: parseNumber(formData.propaneFillingExchangeYearly) || parseNumber(formData.propaneSalesYearly) || null,
      propaneFillingExchangeMonthly: parseNumber(formData.propaneFillingExchangeMonthly) || parseNumber(formData.propaneSalesMonthly) || null
    },
    workers_compensation: {
      payroll: formData.payroll || null,
      noOfEmployees: formData.noOfEmployees || null,
      officersInclExcl: formData.officersInclExcl || null
    },
    // New format for additional interests
    additionalInsuredType: firstInterest?.type || null,
    additionalInsuredName: firstInterest?.name || null,
    additionalInsuredAddress: firstInterest?.address || null,
    // Include all additional interests as array
    additionalInterests: formData.additionalInterests || [],
    // Include buildings if provided
    buildings: formData.buildings || [],
    source: 'eform',
    eform_submission_id: eformSubmissionId,
    created_at: timestamp,
    updated_at: timestamp,
    fein: formData.fein || null,
    dashboard_link: dashboardLink
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🌐 WEBHOOK API: Request received')
    const formData: FormData = await request.json()
    console.log('🌐 WEBHOOK API: Form data received, corporation:', formData.corporationName)

    // Transform form data to webhook format
    const webhookData = transformFormDataToWebhookFormat(formData)
    console.log('🌐 WEBHOOK API: Data transformed, sending to webhook endpoint...')

    // Send to webhook endpoint
    console.log('🌐 WEBHOOK API: Making POST request to webhook.mightyinvestmentgroup.com/application')
    const webhookResponse = await fetch('https://webhook.mightyinvestmentgroup.com/application', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
      // Add timeout
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })
    console.log('🌐 WEBHOOK API: Response received, status:', webhookResponse.status)

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('Webhook error:', webhookResponse.status, errorText)
      return NextResponse.json(
        { 
          success: false, 
          error: `Webhook returned ${webhookResponse.status}`,
          details: errorText
        },
        { status: webhookResponse.status }
      )
    }

    const responseData = await webhookResponse.json()
    
    return NextResponse.json({
      success: true,
      message: 'Data sent to webhook successfully',
      webhookResponse: responseData
    })

  } catch (error: any) {
    console.error('Error sending to webhook:', error)
    
    // Handle timeout specifically
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Webhook request timed out',
          message: 'The webhook endpoint did not respond in time, but your submission was saved.'
        },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send data to webhook',
        message: 'There was an error sending data to the webhook, but your submission was saved.'
      },
      { status: 500 }
    )
  }
}

