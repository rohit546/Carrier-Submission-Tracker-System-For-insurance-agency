import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const GHL_API_KEY = process.env.GHL_API_KEY
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID
    const pipelineId = 'eognXr6blkaNJne4dTvs'
    const pipelineStageId = '1d2218ac-d2ac-4ef2-8dc3-46e76b9d9b4c'
    

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      return NextResponse.json(
        { success: false, error: 'GoHighLevel not configured' },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }

    console.log('📋 Fetching opportunities from unfilled stage...')
    console.log('   Pipeline ID:', pipelineId)
    console.log('   Stage ID:', pipelineStageId)
    console.log('   Location ID:', GHL_LOCATION_ID)
    
    const authHeader = GHL_API_KEY.startsWith('Bearer ') ? GHL_API_KEY : `Bearer ${GHL_API_KEY}`

    // Note: GHL API's pipeline_stage_id filter doesn't work correctly, so we fetch all pipeline opportunities
    // and filter by stage client-side. Also handle pagination to get all opportunities.
    let allOpportunities: any[] = []
    let nextPageUrl: string | null = null
    let currentPage = 1
    const maxPages = 10 // Safety limit to prevent infinite loops
    
    do {
      let opportunitiesUrl = `https://services.leadconnectorhq.com/opportunities/search?location_id=${GHL_LOCATION_ID}&pipeline_id=${pipelineId}&limit=100`
      if (nextPageUrl) {
        opportunitiesUrl = nextPageUrl
      }
      
      console.log(`📡 Fetching opportunities page ${currentPage} (will filter by stage client-side)...`)
      
      const opportunitiesResponse = await fetch(opportunitiesUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Version': '2021-07-28'
        }
      })

      if (!opportunitiesResponse.ok) {
        const errorText = await opportunitiesResponse.text()
        console.error('❌ Failed to fetch opportunities:', errorText)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch opportunities', details: errorText },
          { status: opportunitiesResponse.status }
        )
      }

      const opportunitiesData = await opportunitiesResponse.json()
      const pageOpportunities = opportunitiesData.opportunities || []
      allOpportunities = allOpportunities.concat(pageOpportunities)
      
      console.log(`   Page ${currentPage}: Found ${pageOpportunities.length} opportunities (${allOpportunities.length} total so far)`)
      
      // Check for pagination
      nextPageUrl = opportunitiesData.meta?.nextPageUrl || null
      currentPage++
      
    } while (nextPageUrl && currentPage <= maxPages)
    
    console.log(`📊 Found ${allOpportunities.length} total opportunities in pipeline (across ${currentPage - 1} pages)`)
    
    // Debug: Show all unique stages and their counts
    const stageCounts: { [key: string]: number } = {}
    const stageOpportunities: { [key: string]: any[] } = {}
    
    allOpportunities.forEach((opp: any) => {
      const stageId = opp.pipelineStageId || 'NO_STAGE'
      stageCounts[stageId] = (stageCounts[stageId] || 0) + 1
      if (!stageOpportunities[stageId]) {
        stageOpportunities[stageId] = []
      }
      stageOpportunities[stageId].push(opp)
    })
    
    console.log(`\n📊 Stage distribution in pipeline:`)
    Object.entries(stageCounts)
      .sort(([, a], [, b]) => b - a) // Sort by count descending
      .forEach(([stageId, count]) => {
        const isTargetStage = stageId === pipelineStageId
        console.log(`   ${isTargetStage ? '👉' : '  '} Stage ${stageId.substring(0, 8)}...: ${count} opportunities ${isTargetStage ? '(TARGET)' : ''}`)
      })
    
    // Debug: Show ALL opportunities in target stage with full details
    const targetStageOpps = stageOpportunities[pipelineStageId] || []
    if (targetStageOpps.length > 0) {
      console.log(`\n🔍 Detailed info for ALL ${targetStageOpps.length} opportunities in target stage:`)
      targetStageOpps.forEach((opp: any, index: number) => {
        console.log(`   ${index + 1}. ID: ${opp.id}`)
        console.log(`      Name: ${opp.name || 'N/A'}`)
        console.log(`      Status: ${opp.status || 'N/A'}`)
        console.log(`      Contact ID: ${opp.contactId || 'N/A'}`)
        console.log(`      Pipeline Stage ID: ${opp.pipelineStageId || 'N/A'}`)
        console.log(`      Location ID: ${opp.locationId || 'N/A'}`)
        console.log(`      Date Added: ${opp.dateAdded || 'N/A'}`)
      })
    }
    
    // Debug: Search for specific contact IDs from Excel export
    // Expected contact IDs: CM2Q2XPI..., hYp4aDuT..., mHzkucpI...
    const expectedContactPrefixes = ['CM2Q2XPI', 'hYp4aDuT', 'mHzkucpI']
    console.log(`\n🔍 Searching for opportunities with expected contact ID prefixes from Excel:`)
    expectedContactPrefixes.forEach(prefix => {
      const matchingOpps = allOpportunities.filter((opp: any) => 
        opp.contactId && opp.contactId.startsWith(prefix)
      )
      if (matchingOpps.length > 0) {
        console.log(`   Found ${matchingOpps.length} opportunity(ies) with contact ID starting with "${prefix}":`)
        matchingOpps.forEach((opp: any) => {
          console.log(`      - Opportunity ID: ${opp.id}`)
          console.log(`        Name: ${opp.name || 'N/A'}`)
          console.log(`        Contact ID: ${opp.contactId}`)
          console.log(`        Stage ID: ${opp.pipelineStageId || 'N/A'}`)
          console.log(`        Status: ${opp.status || 'N/A'}`)
          console.log(`        Location ID: ${opp.locationId || 'N/A'}`)
          const isTargetStage = opp.pipelineStageId === pipelineStageId
          const isTargetLocation = !opp.locationId || opp.locationId === GHL_LOCATION_ID
          console.log(`        ✓ In target stage: ${isTargetStage}`)
          console.log(`        ✓ In target location: ${isTargetLocation}`)
        })
      } else {
        console.log(`   ❌ No opportunities found with contact ID starting with "${prefix}"`)
      }
    })
    
    // Debug: Check for opportunities with similar stage IDs (partial match)
    console.log(`\n🔍 Checking for opportunities with similar stage IDs (partial match on first 10 chars):`)
    const targetStagePrefix = pipelineStageId.substring(0, 10)
    const similarStageOpps = allOpportunities.filter((opp: any) => 
      opp.pipelineStageId && opp.pipelineStageId.substring(0, 10) === targetStagePrefix && opp.pipelineStageId !== pipelineStageId
    )
    if (similarStageOpps.length > 0) {
      console.log(`   Found ${similarStageOpps.length} opportunity(ies) with similar stage ID prefix "${targetStagePrefix}":`)
      const similarStages: { [key: string]: any[] } = {}
      similarStageOpps.forEach((opp: any) => {
        const stageId = opp.pipelineStageId
        if (!similarStages[stageId]) {
          similarStages[stageId] = []
        }
        similarStages[stageId].push(opp)
      })
      Object.entries(similarStages).forEach(([stageId, opps]) => {
        console.log(`      Stage ID: ${stageId} (${opps.length} opportunities):`)
        opps.forEach((opp: any) => {
          console.log(`        - ${opp.id}: ${opp.name || 'Unnamed'} (Contact: ${opp.contactId?.substring(0, 10)}...)`)
        })
      })
    } else {
      console.log(`   ❌ No opportunities found with similar stage ID prefix`)
    }
    
    // First, check all opportunities in the target stage (regardless of status)
    // Use the pre-calculated list from stageOpportunities to ensure we get all
    const allStageOpportunities = stageOpportunities[pipelineStageId] || []
    
    // Also do a direct filter as a double-check
    const directFiltered = allOpportunities.filter((opp: any) => 
      opp.pipelineStageId === pipelineStageId
    )
    
    if (allStageOpportunities.length !== directFiltered.length) {
      console.log(`⚠️ Mismatch: stageOpportunities has ${allStageOpportunities.length}, directFiltered has ${directFiltered.length}`)
      // Use the larger set
      if (directFiltered.length > allStageOpportunities.length) {
        console.log(`   Using directFiltered set with ${directFiltered.length} opportunities`)
        allStageOpportunities.splice(0, allStageOpportunities.length, ...directFiltered)
      }
    }
    
    console.log(`\n📊 Found ${allStageOpportunities.length} opportunities in target stage ${pipelineStageId} (regardless of status)`)
    if (allStageOpportunities.length > 0) {
      console.log('📋 All opportunities in target stage:')
      allStageOpportunities.forEach((opp: any, index: number) => {
        console.log(`   ${index + 1}. ID: ${opp.id}, Status: ${opp.status}, Name: ${opp.name}`)
      })
    } else {
      console.log('⚠️ No opportunities found in target stage. Checking for similar stage IDs...')
      // Check if there are any opportunities with stage IDs that partially match
      const similarStages = Object.keys(stageCounts).filter(stageId => 
        stageId.substring(0, 10) === pipelineStageId.substring(0, 10) ||
        stageId.includes(pipelineStageId.substring(0, 8))
      )
      if (similarStages.length > 0) {
        console.log('   Found similar stage IDs:')
        similarStages.forEach(stageId => {
          const count = stageCounts[stageId]
          console.log(`   - ${stageId}: ${count} opportunities`)
        })
      }
    }
    
    // Filter by stage AND status (but we'll also check all statuses later)
    const opportunities = allStageOpportunities.filter((opp: any) => 
      opp.status === 'open'
    )
    
    console.log(`✅ Found ${opportunities.length} opportunities in stage ${pipelineStageId} with status 'open' (filtered from ${allStageOpportunities.length} total in stage)`)
    
    // If we have fewer opportunities than expected, include all statuses
    if (allStageOpportunities.length > opportunities.length) {
      console.log(`⚠️ Some opportunities in stage have non-open status. Processing all ${allStageOpportunities.length} opportunities in stage...`)
      // Use all stage opportunities, not just open ones
      const tempOpportunities = allStageOpportunities
      // We'll process all of them, but log which ones aren't 'open'
      opportunities.splice(0, opportunities.length, ...tempOpportunities)
    }

    // Fetch notes and parse JSON for each opportunity
    const formsList = []
    
    console.log(`\n🔍 Processing ${opportunities.length} opportunities to find forms with JSON data...`)

         for (const opportunity of opportunities) {
       try {
         console.log(`\n🔍 Processing opportunity: ${opportunity.id} (${opportunity.name || 'Unnamed'})`)
         console.log(`   Status: ${opportunity.status}`)
         console.log(`   Stage: ${opportunity.pipelineStageId}`)
         
         const contactId = opportunity.contactId
         if (!contactId) {
           console.log(`   ⚠️ No contactId found, skipping`)
           continue
         }
         
         console.log(`   Contact ID: ${contactId}`)

         // Fetch notes for this contact
         const notesResponse = await fetch(
           `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
           {
             method: 'GET',
             headers: {
               'Authorization': authHeader,
               'Content-Type': 'application/json',
               'Accept': 'application/json',
               'Version': '2021-07-28'
             }
           }
         )

         if (!notesResponse.ok) {
           console.log(`   ⚠️ Failed to fetch notes (${notesResponse.status}), skipping`)
           continue
         }

         const notesData = await notesResponse.json()
         const notes = notesData.notes || []
         console.log(`   Found ${notes.length} notes`)

        // Find note with JSON data
        let formData = null
        let opportunityIdFromNote = null
        let status = 'Draft'
        let submissionDate = null

        for (const note of notes) {
          const noteBody = note.body || ''
          
          // Extract Opportunity ID from note header
          const oppIdMatch = noteBody.match(/\*\*Opportunity ID:\*\* (.+)/)
          if (oppIdMatch) {
            opportunityIdFromNote = oppIdMatch[1].trim()
          }

          // Extract Status from note
          const statusMatch = noteBody.match(/\*\*Status:\*\* (.+)/)
          if (statusMatch) {
            status = statusMatch[1].trim()
          }

          // Extract JSON from code block
          const jsonMatch = noteBody.match(/```json\n([\s\S]*?)\n```/)
          if (jsonMatch) {
            try {
              formData = JSON.parse(jsonMatch[1])
              submissionDate = formData.submissionDate || formData.metadata?.submissionDate
              
              // Use opportunity ID from note if available, otherwise use from query
              if (!opportunityIdFromNote) {
                opportunityIdFromNote = opportunity.id
              }
              
              // Get status from JSON metadata if not in note header
              if (!statusMatch && formData.metadata?.applicationStatus) {
                status = formData.metadata.applicationStatus
              }
              
              break // Found JSON, stop searching
            } catch (e) {
              console.error('Error parsing JSON from note:', e)
              continue
            }
          }
        }

                 // Include forms with JSON data (show all forms regardless of status for now)
         if (formData && opportunityIdFromNote) {
           console.log(`   ✅ Found JSON data for opportunity ${opportunity.id}`)
          // Calculate completion percentage
          const requiredFields = ['corporationName', 'contactName', 'contactEmail', 'contactNumber']
          const allFields = Object.keys(formData.personalInfo || {}).concat(
            Object.keys(formData.companyInfo || {}),
            Object.keys(formData.propertyDetails || {}),
            Object.keys(formData.coverage || {}),
            Object.keys(formData.businessDetails || {})
          )
          
          const filledFields = allFields.filter(key => {
            const value = formData.personalInfo?.[key] || 
                         formData.companyInfo?.[key] || 
                         formData.propertyDetails?.[key] ||
                         formData.coverage?.[key] ||
                         formData.businessDetails?.[key]
            return value !== null && value !== undefined && value !== '' && value !== 'No'
          }).length
          
          const totalFields = allFields.length
          const completionPercent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0

          // Include all forms (user can filter in UI if needed)
          // Show all forms regardless of status so they can be resumed
          formsList.push({
            opportunityId: opportunityIdFromNote,
            contactId: contactId,
            contactName: formData.personalInfo?.contactName || 'Unknown',
            corporationName: formData.personalInfo?.corporationName || formData.companyInfo?.dba || 'Unknown',
            dateSaved: submissionDate || opportunity.dateAdded || new Date().toISOString(),
            status: status,
            completionPercent: completionPercent,
            formData: formData
          })
                 } else {
           // Debug: Log when opportunity has no JSON data
           console.log(`   ❌ Opportunity ${opportunity.id} (${opportunity.name || 'Unnamed'}) excluded:`)
           if (formData) {
             console.log(`      Reason: Has formData but no opportunityIdFromNote`)
           } else {
             console.log(`      Reason: No JSON data found in notes`)
             console.log(`      Note: Checked ${notes.length} notes, none contained JSON code block`)
           }
         }
      } catch (error) {
        console.error(`Error processing opportunity ${opportunity.id}:`, error)
        continue
      }
    }

    // Sort by date (most recent first)
    formsList.sort((a, b) => {
      const dateA = new Date(a.dateSaved).getTime()
      const dateB = new Date(b.dateSaved).getTime()
      return dateB - dateA
    })

    console.log(`✅ Returning ${formsList.length} incomplete forms`)

    return NextResponse.json({
      success: true,
      forms: formsList,
      count: formsList.length
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: any) {
    console.error('Error fetching resume forms:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}

