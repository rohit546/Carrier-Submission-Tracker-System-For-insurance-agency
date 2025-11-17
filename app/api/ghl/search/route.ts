import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GHL_API_URL = 'https://services.leadconnectorhq.com';
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
// Two target stages to fetch opportunities from
const TARGET_STAGE_IDS = [
  'b4af66e5-16be-4608-9921-83f466a52dec',
  '14abfa41-d94f-4d92-b14b-bdaf8fbbb4ce'
];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    return NextResponse.json(
      { error: 'GoHighLevel not configured. Please set GHL_API_KEY and GHL_LOCATION_ID in .env.local' },
      { status: 500 }
    );
  }

  try {
    const { query = '' } = await request.json();
    const searchQuery = typeof query === 'string' ? query.trim() : '';

    const authHeader = GHL_API_KEY.startsWith('Bearer ') ? GHL_API_KEY : `Bearer ${GHL_API_KEY}`;

    console.log('🔍 Searching GHL opportunities from two target stages...', { 
      locationId: GHL_LOCATION_ID,
      targetStageIds: TARGET_STAGE_IDS,
      query: searchQuery 
    });

    console.log(`🎯 Fetching opportunities from stages: ${TARGET_STAGE_IDS.join(', ')} (no date filter - fetching ALL opportunities)`);

    // Fetch opportunities directly from each target stage (much more efficient!)
    // This way we only fetch what we need, not the entire pipeline
    let stageOpportunitiesFound: any[] = [];

    // Helper function to fetch all opportunities from a single stage
    async function fetchOpportunitiesFromStage(stageId: string): Promise<any[]> {
      const stageOpportunities: any[] = [];
      let nextPageUrl: string | null = null;
      let currentPage = 1;
      const maxPages = 20; // Allow more pages per stage since we're filtering at API level

      do {
        // Fetch directly from the specific stage using pipeline_stage_id filter
        let opportunitiesUrl = `${GHL_API_URL}/opportunities/search?location_id=${GHL_LOCATION_ID}&pipeline_stage_id=${stageId}&limit=100`;
        if (nextPageUrl) {
          // For pagination, use nextPageUrl as-is
          opportunitiesUrl = nextPageUrl;
        }

        console.log(`📡 Fetching Stage ${stageId.substring(0, 8)}... page ${currentPage}...`);

        const searchResponse = await fetch(opportunitiesUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Version': '2021-07-28',
          },
        });

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error(`❌ GHL API Error for stage ${stageId.substring(0, 8)}:`, {
            status: searchResponse.status,
            statusText: searchResponse.statusText,
            error: errorText
          });
          // Continue with other stage instead of failing completely
          break;
        }

        const data = await searchResponse.json();
        const pageOpportunities = data.opportunities || [];
        
        // Log first opportunity structure to see all available fields
        if (pageOpportunities.length > 0 && currentPage === 1) {
          console.log('📋 Sample Opportunity Object (all available fields):', JSON.stringify(pageOpportunities[0], null, 2));
        }
        
        // All opportunities from this API call are already in the target stage
        stageOpportunities.push(...pageOpportunities);
        
        console.log(`   Page ${currentPage}: Found ${pageOpportunities.length} opportunities from stage (${stageOpportunities.length} total so far)`);

        // Check for pagination
        nextPageUrl = data.meta?.nextPageUrl || null;
        currentPage++;

      } while (nextPageUrl && currentPage <= maxPages);

      return stageOpportunities;
    }

    // Fetch opportunities from both stages in parallel (faster!)
    console.log(`🚀 Fetching opportunities from ${TARGET_STAGE_IDS.length} stages in parallel...`);
    const [stage1Opportunities, stage2Opportunities] = await Promise.all([
      fetchOpportunitiesFromStage(TARGET_STAGE_IDS[0]),
      fetchOpportunitiesFromStage(TARGET_STAGE_IDS[1])
    ]);

    // Combine opportunities from both stages
    stageOpportunitiesFound = [...stage1Opportunities, ...stage2Opportunities];
    
    console.log(`📊 Fetched ${stage1Opportunities.length} from Stage 1, ${stage2Opportunities.length} from Stage 2`);
    console.log(`🎯 Total: ${stageOpportunitiesFound.length} opportunities from target stages`);

    // Count by stage (for logging)
    const stage1Total = stageOpportunitiesFound.filter((opp: any) => 
      opp.pipelineStageId === TARGET_STAGE_IDS[0]
    ).length;
    const stage2Total = stageOpportunitiesFound.filter((opp: any) => 
      opp.pipelineStageId === TARGET_STAGE_IDS[1]
    ).length;
    
    console.log(`✅ Found ${stageOpportunitiesFound.length} opportunities (Stage 1: ${stage1Total}, Stage 2: ${stage2Total})`);

    // Use the stage opportunities we already found
    const opportunities = stageOpportunitiesFound;

    console.log(`✅ Ready to return ${opportunities.length} opportunities (contact details will be fetched on selection)`);

    // Return only opportunity data (no contact fetching)
    // Contact details will be fetched when user selects an opportunity
    const opportunitiesData = opportunities.map((opp: any) => ({
      id: opp.id,
      opportunityId: opp.id,
      opportunityName: opp.name || 'Unnamed Opportunity',
      dateAdded: opp.dateAdded || opp.createdAt || opp.dateCreated,
      contactId: opp.contactId, // Include contactId so frontend can fetch contact details when needed
      pipelineStageId: opp.pipelineStageId, // Include stage ID for reference
    }));

    console.log(`✅ Returning ${opportunitiesData.length} opportunities (without contact details)`);

    return NextResponse.json({ 
      opportunities: opportunitiesData,
      totalOpportunities: opportunities.length
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('GHL search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search opportunities' },
      { status: 500 }
    );
  }
}

