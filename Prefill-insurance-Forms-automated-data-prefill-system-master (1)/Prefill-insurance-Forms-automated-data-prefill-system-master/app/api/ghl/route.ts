import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()

    const GHL_API_KEY = process.env.GHL_API_KEY
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID

    // Check if this is a resumed form (update existing opportunity)
    const resumedOpportunityId = formData._resumedOpportunityId
    const resumedContactId = formData._resumedContactId
    const agentName = formData._agentName

    // Remove internal fields from formData
    delete formData._resumedOpportunityId
    delete formData._resumedContactId
    delete formData._agentName

    // Validate required fields for contact creation
    if (!formData.corporationName || !formData.contactName || !formData.contactEmail || !formData.contactNumber || !formData.leadSource) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: Corporation Name, Contact Name, Contact Email, Contact Number, and Lead Source are required' 
        },
        { status: 400 }
      )
    }

    // Get lead source from formData (not localStorage)
    const leadSource = formData.leadSource?.trim() || ''
    
    // Validate lead source is provided
    if (!leadSource) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Lead Source is required' 
        },
        { status: 400 }
      )
    }

    // If resuming, update existing opportunity instead of creating new
    if (resumedOpportunityId && resumedContactId) {
      console.log('🔄 Updating existing opportunity:', resumedOpportunityId)
      console.log('   Contact ID:', resumedContactId)
      
      // Validate required environment variables
      if (!GHL_API_KEY || !GHL_LOCATION_ID) {
        console.error('❌ GoHighLevel API credentials not configured')
        return NextResponse.json(
          { success: false, error: 'GoHighLevel not configured - API key or location ID missing' },
          { status: 400 }
        )
      }
      
      // Type assertion: we've validated these exist above
      const apiKey: string = GHL_API_KEY!
      const locationId: string = GHL_LOCATION_ID!
      
      // Update opportunity with new data
      const updatedOpportunityId = await updateOpportunityWithData(resumedOpportunityId, resumedContactId, formData, apiKey, leadSource, locationId, agentName || undefined)
      
      // Add updated JSON as new note
      await addFormDataAsNote(resumedContactId, formData, apiKey, resumedOpportunityId)
      
      return NextResponse.json({
        success: true,
        message: 'Opportunity updated successfully. Complete JSON saved in contact note.',
        contactId: resumedContactId,
        opportunityId: updatedOpportunityId || resumedOpportunityId
      })
    }

    console.log('🔍 Environment Check:', {
      hasApiKey: !!GHL_API_KEY,
      hasLocationId: !!GHL_LOCATION_ID,
      apiKeyType: GHL_API_KEY?.substring(0, 20),
      apiKeyLength: GHL_API_KEY?.length,
      locationId: GHL_LOCATION_ID
    })

    if (!GHL_API_KEY) {
      console.error('❌ GoHighLevel API key not configured')
      return NextResponse.json(
        { success: false, error: 'GoHighLevel not configured - GHL_API_KEY missing' },
        { status: 400 }
      )
    }

    console.log('📤 Sending data to GoHighLevel CRM...')
    console.log('Form data received:', {
      contactName: formData.contactName,
      email: formData.contactEmail,
      phone: formData.contactNumber,
      address: formData.address
    })

    // Create contact with basic matching fields
    const contactData: any = {
      firstName: formData.contactName?.split(' ')[0] || '',
      lastName: formData.contactName?.split(' ').slice(1).join(' ') || '',
      name: formData.contactName || '',
      email: formData.contactEmail || '',
      phone: formData.contactNumber || '',
      address1: formData.address || '',
      companyName: formData.dba || '',
      source: 'Insurance Application Form',
      tags: ['insurance-lead', 'c-store']
    }

    // REQUIRED: locationId must be in the request
    if (!GHL_LOCATION_ID) {
      console.error('❌ Location ID is required but not configured')
      return NextResponse.json(
        { success: false, error: 'Location ID not configured' },
        { status: 400 }
      )
    }

    contactData.locationId = GHL_LOCATION_ID

    console.log('📡 Making API request to GoHighLevel...')
    console.log('API Key type:', GHL_API_KEY?.substring(0, 20) + '...')
    console.log('API Key length:', GHL_API_KEY?.length)
    console.log('Location ID:', GHL_LOCATION_ID)
    
    // Ensure Authorization header format is correct (no double "Bearer Bearer")
    let authHeader = GHL_API_KEY
    if (authHeader && !authHeader.startsWith('Bearer ')) {
      authHeader = `Bearer ${authHeader}`
    }
    
    console.log('Request headers:', {
      'Authorization': authHeader.substring(0, 30) + '...',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Version': '2021-07-28'
    })
    
    const ghlResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(contactData)
    })

    const ghlData = await ghlResponse.json()
    
    console.log('📡 GoHighLevel Response:', {
      status: ghlResponse.status,
      statusText: ghlResponse.statusText,
      data: ghlData
    })
    
    // Check if token is expired
    if (ghlResponse.status === 401 && ghlData.message === 'Invalid JWT') {
      console.error('❌ Invalid JWT Error - Possible causes:')
      console.error('1. Token is expired')
      console.error('2. Token was revoked')
      console.error('3. Wrong API key type (need Private App Key, not OAuth token)')
      console.error('4. Location ID mismatch')
      console.error('💡 SOLUTION: Generate a new API key from Settings → API Keys in GoHighLevel')
    }

    if (ghlResponse.ok) {
      console.log('✅ Contact created in GoHighLevel:', ghlData.contact?.id)
      
      let opportunityId: string | null = null
      if (ghlData.contact?.id) {
        opportunityId = await createOpportunityWithJSON(ghlData.contact.id, formData, GHL_API_KEY, leadSource, GHL_LOCATION_ID, agentName || undefined)
        
        // Add complete JSON as note to contact (more reliable than opportunity notes)
        await addFormDataAsNote(ghlData.contact.id, formData, GHL_API_KEY, opportunityId || undefined)
      }

      return NextResponse.json({
        success: true,
        message: 'Lead saved to GoHighLevel CRM. Complete JSON saved in contact note.',
        contactId: ghlData.contact?.id,
        opportunityId: opportunityId || null
      })
    } else {
      console.error('❌ GoHighLevel API error:', ghlData)
      console.error('Request that failed:', {
        url: 'https://services.leadconnectorhq.com/contacts/',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY?.substring(0, 10)}...`,
          'Content-Type': 'application/json'
        },
        body: contactData
      })

      return NextResponse.json(
        { success: false, error: ghlData.message || `Failed to create contact: ${ghlResponse.statusText}` },
        { status: ghlResponse.status }
      )
    }
  } catch (error: any) {
    console.error('Error sending to GoHighLevel:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Build complete JSON data structure
function buildCompleteJSONData(formData: any) {
  return {
    submissionDate: new Date().toISOString(),
    formType: 'C-Store Insurance Application',
    
    personalInfo: {
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactNumber: formData.contactNumber,
      corporationName: formData.corporationName,
      leadSource: formData.leadSource,
    },
    
    companyInfo: {
      address: formData.address,
      dba: formData.dba,
      applicantType: formData.applicantType,
      yearsInBusiness: formData.yearsInBusiness,
      ownershipType: formData.ownershipType,
      operationDescription: formData.operationDescription,
    },
    
    propertyDetails: {
      hoursOfOperation: formData.hoursOfOperation,
      numberOfMPDs: formData.noOfMPDs,
      constructionType: formData.constructionType,
      totalSqFootage: formData.totalSqFootage,
      yearBuilt: formData.yearBuilt,
      yearsInCurrentLocation: formData.yearsAtLocation,
      leasedSpace: formData.anyLeasedOutSpace,
      protectionClass: formData.protectionClass,
      additionalInterests: formData.additionalInterests || [],
      burglarAlarm: formData.burglarAlarm?.centralStation || formData.burglarAlarm?.local ? 'Yes' : 'No',
      fireAlarm: formData.fireAlarm?.centralStation || formData.fireAlarm?.local ? 'Yes' : 'No',
      acres: formData.acres,
    },
    
    salesData: {
      inside: { monthly: formData.insideSalesMonthly, yearly: formData.insideSalesYearly },
      liquor: { monthly: formData.liquorSalesMonthly, yearly: formData.liquorSalesYearly },
      gasoline: { monthly: formData.gasolineSalesMonthly || formData.gasSalesMonthly, yearly: formData.gasolineSalesYearly || formData.gasSalesYearly },
      propane: { monthly: formData.propaneFillingExchangeMonthly || formData.propaneSalesMonthly, yearly: formData.propaneFillingExchangeYearly || formData.propaneSalesYearly },
      carwash: { monthly: formData.carwashMonthly, yearly: formData.carwashYearly },
      cooking: { monthly: formData.cookingMonthly, yearly: formData.cookingYearly },
    },
    
    coverage: {
      building: formData.building,
      bpp: formData.bpp,
      bi: formData.bi,
      canopy: formData.canopy,
      pumps: formData.pumps,
      signsLighting: formData.ms,
    },
    
    businessDetails: {
      fein: formData.fein,
      numberOfEmployees: formData.noOfEmployees,
      annualPayroll: formData.payroll,
      officers: formData.officersInclExcl,
      ownershipPercentage: formData.ownership,
      primaryLender: formData.primaryLender,
      mortgageAmount: formData.mortgageAmount,
    },
    
    metadata: {
      applicationStatus: formData.applicationStatus || 'Submitted',
      lastSavedStep: formData.lastSavedStep,
      lastSavedDate: formData.lastSavedDate,
    }
  }
}

// Create opportunity with mapped fields
async function createOpportunityWithJSON(contactId: string, formData: any, apiKey: string, leadSource: string, locationId?: string, agentName?: string) {
  try {
    // Use the specific pipeline and stage IDs provided
    const pipelineId = 'eognXr6blkaNJne4dTvs'
    const pipelineStageId = '1d2218ac-d2ac-4ef2-8dc3-46e76b9d9b4c'
    
    console.log('📊 Creating opportunity with:')
    console.log('   Pipeline:', pipelineId)
    console.log('   Stage:', pipelineStageId)
    console.log('   Contact:', contactId)
    console.log('   Lead Source:', leadSource)
    
    const buildingCoverage = parseFloat(formData.building?.replace(/[^0-9.]/g, '') || '0')
    const bppCoverage = parseFloat(formData.bpp?.replace(/[^0-9.]/g, '') || '0')
    const biCoverage = parseFloat(formData.bi?.replace(/[^0-9.]/g, '') || '0')
    const totalCoverage = buildingCoverage + bppCoverage + biCoverage
    const estimatedValue = Math.round(totalCoverage * 0.01)
    
    console.log('💰 Coverage calculation:', { buildingCoverage, bppCoverage, biCoverage, totalCoverage, estimatedValue })
    
    // Build complete JSON data
    const completeJSONData = buildCompleteJSONData(formData)
    const jsonString = JSON.stringify(completeJSONData, null, 2)
    
    console.log('📋 Complete JSON data prepared:', {
      size: jsonString.length,
      keys: Object.keys(completeJSONData)
    })
    
    // Create opportunity without leadSource first (GHL doesn't accept leadSource during creation)
    const opportunityData: any = {
      contactId: contactId,
      name: formData.corporationName || '',
      pipelineId: pipelineId,
      pipelineStageId: pipelineStageId,
      status: 'open',
      monetaryValue: estimatedValue > 0 ? estimatedValue : 0,
    }

    if (locationId) {
      opportunityData.locationId = locationId
    }
    
    console.log('📤 Opportunity data (without leadSource):', opportunityData)
    // Ensure Authorization header has Bearer prefix for pit- tokens
    const oppAuthHeader = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`
    
    const oppResponse = await fetch('https://services.leadconnectorhq.com/opportunities/', {
      method: 'POST',
      headers: {
        'Authorization': oppAuthHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(opportunityData)
    })

    if (oppResponse.ok) {
      const oppData = await oppResponse.json()
      const opportunityId = oppData.opportunity?.id
      console.log('✅ Opportunity created successfully!')
      console.log('   Opportunity ID:', opportunityId)
      
      // Update opportunity with lead source (must be done after creation)
      if (opportunityId && leadSource) {
        await updateOpportunityLeadSource(opportunityId, leadSource.trim(), apiKey)
      }
      
      // Update opportunity with assigned agent (opp_assigned_to) if provided
      if (opportunityId && agentName) {
        await updateOpportunityAssignedTo(opportunityId, agentName, apiKey)
      }
      
      return opportunityId
    } else {
      const errorText = await oppResponse.text()
      console.error('❌ Failed to create opportunity!')
      console.error('   Status:', oppResponse.status, oppResponse.statusText)
      console.error('   Error response:', errorText)
      console.error('   Request data sent:', opportunityData)
      return null
    }
  } catch (error) {
    console.error('Error creating opportunity:', error)
    return null
  }
}

// Update existing opportunity with new form data
async function updateOpportunityWithData(opportunityId: string, contactId: string, formData: any, apiKey: string, leadSource: string, locationId?: string, agentName?: string) {
  try {
    console.log('🔄 Updating opportunity with new data...')
    console.log('   Opportunity ID:', opportunityId)
    console.log('   Contact ID:', contactId)
    console.log('   Lead Source:', leadSource)
    
    const pipelineId = 'eognXr6blkaNJne4dTvs'
    const pipelineStageId = '1d2218ac-d2ac-4ef2-8dc3-46e76b9d9b4c'
    
    const buildingCoverage = parseFloat(formData.building?.replace(/[^0-9.]/g, '') || '0')
    const bppCoverage = parseFloat(formData.bpp?.replace(/[^0-9.]/g, '') || '0')
    const biCoverage = parseFloat(formData.bi?.replace(/[^0-9.]/g, '') || '0')
    const totalCoverage = buildingCoverage + bppCoverage + biCoverage
    const estimatedValue = Math.round(totalCoverage * 0.01)
    
    const opportunityUpdate: any = {
      name: formData.corporationName || '',
      pipelineId: pipelineId,
      pipelineStageId: pipelineStageId,
      status: 'open',
      monetaryValue: estimatedValue > 0 ? estimatedValue : 0,
    }
    
    // Note: Do NOT include locationId or leadSource in update requests (must be done separately)
    console.log('📤 Updating opportunity with:', opportunityUpdate)
    
    const oppAuthHeader = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`
    
    const updateResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
      method: 'PUT',
      headers: {
        'Authorization': oppAuthHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(opportunityUpdate)
    })

    if (updateResponse.ok) {
      const oppData = await updateResponse.json()
      console.log('✅ Opportunity updated successfully!')
      console.log('   Opportunity ID:', opportunityId)
      
      // Update opportunity with lead source (must be done separately)
      if (leadSource) {
        await updateOpportunityLeadSource(opportunityId, leadSource.trim(), apiKey)
      }
      
      // Update opportunity with assigned agent (opp_assigned_to) if provided
      if (agentName) {
        await updateOpportunityAssignedTo(opportunityId, agentName, apiKey)
      }
      
      return opportunityId
    } else {
      const errorText = await updateResponse.text()
      console.error('❌ Failed to update opportunity!')
      console.error('   Status:', updateResponse.status, updateResponse.statusText)
      console.error('   Error response:', errorText)
      return null
    }
  } catch (error) {
    console.error('Error updating opportunity:', error)
    return null
  }
}

// Update opportunity with assigned agent (opp_assigned_to custom field)
async function updateOpportunityAssignedTo(opportunityId: string, agentName: string, apiKey: string) {
  try {
    console.log('👤 Updating opportunity assigned to:', agentName)
    console.log('   Opportunity ID:', opportunityId)
    console.log('   Custom Field Key: opp_assigned_to')
    
    // Use customFields array format for custom field {{ opportunity.opp_assigned_to }}
    const updateData = {
      customFields: [
        {
          key: 'opp_assigned_to', // GoHighLevel custom field: {{ opportunity.opp_assigned_to }}
          value: agentName
        }
      ]
    }
    
    const oppAuthHeader = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`
    
    const updateResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
      method: 'PUT',
      headers: {
        'Authorization': oppAuthHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(updateData)
    })
    
    if (updateResponse.ok) {
      console.log('✅ Opportunity assigned to updated successfully')
      return true
    } else {
      const errorText = await updateResponse.text()
      console.error('❌ Failed to update opportunity assigned to!')
      console.error('   Status:', updateResponse.status, updateResponse.statusText)
      console.error('   Error response:', errorText)
      
      // Try alternative format (object instead of array)
      console.log('🔄 Trying alternative customFields format...')
      const altUpdateData = {
        customFields: {
          opp_assigned_to: agentName
        }
      }
      
      const altResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: {
          'Authorization': oppAuthHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify(altUpdateData)
      })
      
      if (altResponse.ok) {
        console.log('✅ Opportunity assigned to updated with alternative format')
        return true
      } else {
        const altErrorText = await altResponse.text()
        console.error('❌ Alternative format also failed:', altErrorText)
        return false
      }
    }
  } catch (error) {
    console.error('Error updating opportunity assigned to:', error)
    return false
  }
}

// Update opportunity with lead source (must be done separately as custom field)
async function updateOpportunityLeadSource(opportunityId: string, leadSource: string, apiKey: string) {
  try {
    console.log('📝 Updating opportunity lead source as custom field...')
    console.log('   Opportunity ID:', opportunityId)
    console.log('   Lead Source:', leadSource)
    console.log('   Custom Field Key: lead_source')
    
    // Use customFields array format for custom field {{ opportunity.lead_source }}
    const updateData = {
      customFields: [
        {
          key: 'lead_source', // GoHighLevel custom field: {{ opportunity.lead_source }}
          value: leadSource
        }
      ]
    }
    
    const oppAuthHeader = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`
    
    const updateResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
      method: 'PUT',
      headers: {
        'Authorization': oppAuthHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(updateData)
    })
    
    if (updateResponse.ok) {
      console.log('✅ Opportunity lead source updated successfully')
      return true
    } else {
      const errorText = await updateResponse.text()
      console.error('❌ Failed to update opportunity lead source!')
      console.error('   Status:', updateResponse.status, updateResponse.statusText)
      console.error('   Error response:', errorText)
      
      // Try alternative format (object instead of array)
      console.log('🔄 Trying alternative customFields format...')
      const altUpdateData = {
        customFields: {
          lead_source: leadSource
        }
      }
      
      const altResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: {
          'Authorization': oppAuthHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify(altUpdateData)
      })
      
      if (altResponse.ok) {
        console.log('✅ Opportunity lead source updated with alternative format')
        return true
      } else {
        const altErrorText = await altResponse.text()
        console.error('❌ Alternative format also failed:', altErrorText)
        return false
      }
    }
  } catch (error) {
    console.error('Error updating opportunity lead source:', error)
    return false
  }
}

// Update opportunity with JSON custom field
async function updateOpportunityWithJSONField(opportunityId: string, jsonString: string, apiKey: string, locationId?: string) {
  try {
    console.log('📝 Updating opportunity with JSON custom field...')
    console.log('   Field key: json_file')
    console.log('   JSON size:', jsonString.length, 'characters')
    
    // Try different formats - GoHighLevel might accept customFields as array or object
    // NOTE: Do NOT include locationId in update requests - it causes 422 error
    const customFieldUpdate: any = {
      customFields: [
        {
          key: 'json_file', // GoHighLevel custom field: {{ opportunity.json_file }}
          value: jsonString
        }
      ]
    }
    
    const oppAuthHeader = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`
    
    console.log('📤 Updating opportunity with:', {
      opportunityId,
      customFieldsCount: customFieldUpdate.customFields.length,
      fieldKey: customFieldUpdate.customFields[0].key,
      valueLength: customFieldUpdate.customFields[0].value.length
    })
    
    const updateResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
      method: 'PUT',
      headers: {
        'Authorization': oppAuthHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(customFieldUpdate)
    })
    
    if (updateResponse.ok) {
      const responseData = await updateResponse.json()
      console.log('✅ Opportunity updated with JSON custom field successfully')
      console.log('   Response:', responseData)
    } else {
      let errorText = ''
      try {
        const errorData = await updateResponse.json()
        errorText = JSON.stringify(errorData, null, 2)
      } catch {
        errorText = await updateResponse.text()
      }
      
      console.error('❌ Failed to update opportunity custom field')
      console.error('   Status:', updateResponse.status, updateResponse.statusText)
      console.error('   Error response:', errorText)
      console.error('   Request sent:', JSON.stringify(customFieldUpdate, null, 2))
      
      // Try alternative format - object instead of array
      // NOTE: Do NOT include locationId in update requests
      console.log('🔄 Trying alternative format (object instead of array)...')
      const altUpdate: any = {
        customFields: {
          json_file: jsonString
        }
      }
      
      const altResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: {
          'Authorization': oppAuthHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify(altUpdate)
      })
      
      if (altResponse.ok) {
        console.log('✅ Opportunity updated with alternative format')
      } else {
        const altError = await altResponse.text()
        console.error('❌ Alternative format also failed:', altError)
      }
    }
  } catch (error) {
    console.error('Error updating opportunity custom field:', error)
  }
}

// Add complete form data as formatted note with JSON (to contact)
async function addFormDataAsNote(contactId: string, formData: any, apiKey: string, opportunityId?: string) {
  try {
    console.log('📝 Adding complete form data as JSON note to contact...')
    
    // Use the shared JSON builder function
    const completeData = buildCompleteJSONData(formData)
    
    const noteBody = `## 📋 Complete Insurance Application Data

**Submission Date:** ${new Date().toISOString()}

**Status:** ${formData.applicationStatus || 'Submitted'}

${opportunityId ? `**Opportunity ID:** ${opportunityId}\n` : ''}

### Quick Summary

- **Contact:** ${formData.contactName} - ${formData.contactEmail} - ${formData.contactNumber}
- **Business:** ${formData.dba || 'N/A'} (${formData.corporationName || 'N/A'})
- **Property:** ${formData.address}
- **Hours:** ${formData.hoursOfOperation || 'N/A'} hours/day
- **Coverage Total:** $${(parseFloat(formData.building?.replace(/[^0-9.]/g, '') || '0') + parseFloat(formData.bpp?.replace(/[^0-9.]/g, '') || '0') + parseFloat(formData.bi?.replace(/[^0-9.]/g, '') || '0')).toLocaleString()}

---

### 📎 Complete Application JSON

\`\`\`json
${JSON.stringify(completeData, null, 2)}
\`\`\`

> **Note:** Complete form data saved as JSON. Copy and use as needed.`
    
    // Add note to contact (more reliable than opportunity notes)
    const noteData = {
      body: noteBody,
      userId: contactId // Using contact ID
    }
    
    // Ensure Authorization header has Bearer prefix
    const noteAuthHeader = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`
    
    // Try contact notes endpoint first
    const contactNoteResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': noteAuthHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(noteData)
    })
    
    if (contactNoteResponse.ok) {
      console.log('✅ JSON data added as note to contact')
      return
    }
    
    // If contact notes fail, try alternative format
    const altNoteData = {
      body: noteBody
    }
    
    const altNoteResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': noteAuthHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(altNoteData)
    })
    
    if (altNoteResponse.ok) {
      console.log('✅ JSON data added as note to contact (alternative format)')
    } else {
      const errorText = await altNoteResponse.text()
      console.warn('⚠️ Note creation failed:', errorText)
      console.log('💡 Note: Complete JSON is still available in the response. The JSON data structure is:')
      console.log(JSON.stringify(completeData, null, 2))
    }
  } catch (error) {
    console.error('Error adding note:', error)
    console.log('💡 Note: Complete JSON data structure:')
    console.log(JSON.stringify(buildCompleteJSONData(formData), null, 2))
  }
}

