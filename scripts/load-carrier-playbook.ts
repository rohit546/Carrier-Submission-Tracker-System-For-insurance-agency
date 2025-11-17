import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

interface CarrierData {
  name: string;
  comments: string;
  contact?: string;
}

interface BusinessTypeData {
  name: string;
  carriers: CarrierData[];
}

const playbookData: BusinessTypeData[] = [
  {
    name: 'Grocery Stores',
    carriers: [
      { name: 'Vintage', comments: 'pumps and canopies. TX and LA only' },
      { name: 'Evergreen Gen Agency', comments: 'yr blt after 2000. GL is offered by Century (TX an LA only)' },
      { name: 'RPS', comments: 'restricts coverage on. silent. Trisura Origion gives GL A&B 100k' },
      { name: 'Burns & Wilcox', comments: 'restricts coverage on. silent' },
      { name: 'Amwins', comments: 'unresponsive. A&B and firearm exclusion' },
      { name: 'USG', comments: 'Less compeitive with RPS and BnW. responses to her standard questions' },
      { name: 'Bass', comments: 'Firearms are usually excluded. Vintage/BnW/RPS. Firearms are mostly excluded. A&B is offered with 100K/100K or 100K/200K' },
      { name: 'MGT', comments: 'rejection not known. declined.' },
      { name: 'US Risk', comments: 'Not a market for C Stores' },
      { name: 'Covenant', comments: 'approach Raabel for submission. owners LR and property. improvement updates after purchasing are required.' },
      { name: 'Encova', comments: 'ownership for a minimum of three years in order to be eligible bldgs' },
      { name: 'Guard', comments: '' },
    ],
  },
  {
    name: 'C-Stores without Gas (lottery and tobacco)',
    carriers: [
      { name: 'Coterie', comments: 'Very specific on location and state' },
      { name: 'Vintage', comments: 'TX and LA only. All C Stores: but usually restricts coverages on pumps and canopies.' },
      { name: 'Evergreen Gen Agency', comments: 'TX and LA only. Seneca offers Property only to store considering yr blt after 2000. GL is offered by Century (TX an LA only)' },
      { name: 'RPS', comments: 'Offers to all types. Offers GL via Evanston that restricts coverage on Contamination of fuel to 1K/5K: AnB and FA are silent' },
      { name: 'Burns & Wilcox', comments: 'Offers to all types. Offers pkg via Evanston that restricts coverage on Contamination of fuel to 1K/5K: AnB and FA are silent' },
      { name: 'Amwins', comments: 'Kinsale for GL is preferred; usually goes unresponsive. not competitive with RPS/BnW and 25K/50K A&B and firearm exclusion' },
      { name: 'USG', comments: 'Less compeitive with RPS and BnW. Needs a comprehensive submission with responses to her standard questions' },
      { name: 'Bass', comments: 'Mostly responsive, GA has more markets; Firearms are usually excluded. TX markets are less competitive as compared to Vintage/BnW/RPS. Firearms are mostly excluded. A&B is offered with 100K/100K or 100K/200K' },
      { name: 'MGT', comments: 'Offers with restrictions to C store. Critieria for rejection not known. 24 hours not approved; Less than 2000 sq ft declined.' },
      { name: 'US Risk', comments: 'Not a market for C Stores' },
      { name: 'Covenant', comments: 'submission. property. improvement updates after purchasing' },
      { name: 'Encova', comments: 'Limited scope; better housekeeping and updates are required. new business accounts be under the same ownership for a minimum of three years in order to be eligible' },
      { name: 'Guard', comments: 'Does all categories; excludes A&B and Older bldgs' },
    ],
  },
  {
    name: 'C-Stores with Gas (18 hours and 24 hours)',
    carriers: [
      { name: 'Vintage', comments: 'All C Stores: but usually restricts coverages on pumps and canopies. TX and LA only' },
      { name: 'Evergreen Gen Agency', comments: 'Seneca offers Property only to store considering yr blt after 2000. GL is offered by Century (TX an LA only)' },
      { name: 'RPS', comments: 'Offers to all types. Offers GL via Evanston that restricts coverage on Contamination of fuel to 1K/5K: AnB and FA are silent' },
      { name: 'Burns & Wilcox', comments: 'Offers to all types. Offers pkg via Evanston that restricts coverage on Contamination of fuel to 1K/5K: AnB and FA are silent' },
      { name: 'Amwins', comments: 'Kinsale for GL is preferred; usually goes unresponsive. not competitive with RPS/BnW and 25K/50K A&B and firearm exclusion' },
      { name: 'USG', comments: 'Less compeitive with RPS and BnW. Needs a comprehensive submission with responses to her standard questions' },
      { name: 'Bass', comments: 'Mostly responsive, GA has more markets; Firearms are usually excluded. TX markets are less competitive as compared to Vintage/BnW/RPS. Firearms are mostly excluded. A&B is offered with 100K/100K or 100K/200K' },
      { name: 'MGT', comments: 'Offers with restrictions to C store. Critieria for rejection not known. 24 hours not approved; Less than 2000 sq ft declined.' },
      { name: 'US Risk', comments: 'Not a market for C Stores' },
      { name: 'Covenant', comments: 'C stores 18 and 24 hours: very selective: To approach Raabel for submission. Requires 3 yrs loss runs. New venture\'s previous owners LR and property. improvement updates after purchasing' },
      { name: 'Encova', comments: 'Limited scope; better housekeeping and updates are required. new business accounts be under the same ownership for a minimum of three years in order to be eligible' },
      { name: 'Guard', comments: 'Does all categories; excludes A&B and Older bldgs' },
    ],
  },
  {
    name: 'Offices (occupied or LRO)/1 story or more',
    carriers: [
      { name: 'Amtrust', comments: '' },
      { name: 'Chubb', comments: '' },
    ],
  },
  {
    name: 'Laundromat',
    carriers: [
      { name: 'Travelers', comments: 'With and without plant /coin laundry as well' },
      { name: 'USRISK-brenda', comments: 'Has liberty and Hanover', contact: 'brenda' },
      { name: 'Amtrust', comments: 'no more writes' },
    ],
  },
  {
    name: 'Hotel/Motel',
    carriers: [
      { name: 'Three', comments: '-interior and exterior' },
      { name: 'Guard', comments: '-interior only' },
      { name: 'Travelers-interior only', comments: 'GL-if loss runs clean will be approved' },
      { name: 'Jencap', comments: 'above 5M TIV' },
      { name: 'Covenant', comments: '3 years loss history' },
      { name: 'Umbrella Pro', comments: 'GA property only' },
      { name: 'AIU', comments: 'Christina hunter - Amber send email piz', contact: 'Christina Hunter - Amber' },
      { name: 'Authentic', comments: 'Umbrella' },
      { name: 'Distinguish', comments: 'Admiral' },
      { name: 'Non Standard', comments: 'RPS, B&W and SIU' },
      { name: 'Non standard Motel', comments: '' },
    ],
  },
  {
    name: 'Restaurants',
    carriers: [
      { name: 'Utica', comments: 'we are not a market for fast food chains, both local and national franchises,' },
    ],
  },
  {
    name: 'Day Spa and Incidental Med Spa',
    carriers: [
      { name: 'Amwins', comments: 'Hiscox PL and Abuse/Canopy-Palms Insurance Company. Hand and Stone franchisees do not fall within our appetite at this time.', contact: 'karen.mack@amwins.com, jenny.driskell@amwins.com' },
      { name: 'PPIB', comments: '100k Abuse', contact: 'david.bell@ppibcorp.com' },
      { name: 'NEXT', comments: 'doesnot have Spa classcode' },
      { name: 'Thimble', comments: 'No appetite' },
      { name: 'Charityfirst', comments: 'Kinsale/Great American/Hiscox/LLoyds. Promont' },
      { name: 'Gateway specialty', comments: '', contact: 'chris.sondej@gatewayspecialty.com' },
      { name: 'USrisk', comments: 'PL is included in GL limits. declines if heavy massage - they check website' },
      { name: 'Three', comments: 'BOP/NO PL/No Abuse & Molestation' },
      { name: 'Admiral', comments: 'BOP/PL/Abuse & Molestation' },
      { name: 'Travelers', comments: 'No Cryotherapy/Enter BOp and reserve' },
      { name: 'Biberk', comments: 'Only EPLI' },
      { name: 'Hartford', comments: 'Only EPLI' },
      { name: 'Scottsdale', comments: 'Only EPLI' },
      { name: 'Philadelphia', comments: 'Only EPLI' },
      { name: 'Chubb', comments: '/Crime/Cyber/WC/Accident/Fiduacialry/D&O' },
      { name: 'Travelers', comments: 'WC & EPLI' },
      { name: 'Employers', comments: 'WC' },
      { name: 'Brownyard', comments: 'No Abuse', contact: 'klopez@brownyard.com SASSI' },
      { name: 'Landimark', comments: 'No Cryo' },
      { name: 'Westchester', comments: 'No medspa exposure' },
      { name: 'Guard', comments: 'is not a market for Masseuse/Massage Services. Ineligible for this class code "DAY SPAS"' },
      { name: 'Attune', comments: 'Unfortunately, we are not a market for cryotherapy risks per underwriting guidelines.' },
      { name: 'Amtrust', comments: 'I see this insured does offer Hair Removal and therefore is properly classed 9586 and no action is needed. If your future clients do not offer hair services, code 9603 will be the best fit. 9603-Health Spa or Steam Bath NOC & Clerical' },
    ],
  },
  {
    name: 'Child Day Care',
    carriers: [
      { name: 'Thimble', comments: 'No appetite. Cyber/provides GL and (100k/300k-PL and Abuse) - to write com auto they need package' },
      { name: 'Amtrust', comments: 'Abuse & Molestation/MESA and Cap specialty for GL and PL' },
      { name: 'RT', comments: 'Property only' },
      { name: 'Hartford', comments: 'Commercial Auto' },
      { name: 'Progressive & Breeze', comments: '' },
      { name: 'CRC', comments: 'Employment Practices Liability' },
      { name: 'Philadelphia', comments: 'Only Accident Medical Insurance. non-profit daycares, only. We can write K-12 schools-not pre-schools, in our Hanover program,' },
      { name: 'Charity First', comments: 'GL and PL/Maxum Indemnity & Nautilus' },
      { name: 'AmWins', comments: 'Active shooter/Samphire' },
      { name: 'Macgowan/RT', comments: 'No more Day care center' },
      { name: 'Utica', comments: 'No com auto so declines when transportation provided. No more Day care center' },
      { name: 'Three', comments: 'No more Day care center' },
      { name: 'Lio Insurance', comments: 'No more Day care center' },
      { name: 'Berkshire Hathaway', comments: 'No more Day care center' },
      { name: 'Attune/Liquor Liability', comments: 'No more Day care center' },
      { name: 'Grange', comments: 'No more Day care center' },
      { name: 'CNA', comments: 'No more Day care center' },
      { name: 'Next', comments: 'No more than 50 kids' },
      { name: 'Travelers', comments: 'Declined - sometimes allow property only' },
      { name: 'Nationwide', comments: 'no appetite' },
      { name: 'Jimcor', comments: 'Abuse & Molestation/MESA and Cap specialty for GL and PL' },
      { name: 'USG Thomas', comments: 'Monoline PL ///also give liability and property' },
      { name: 'Covington Speciality', comments: 'writes property' },
      { name: 'RPS', comments: 'Has Umbrella markets/scottsdale' },
      { name: 'Bass', comments: 'Has Umbrella markets/Nautilus' },
    ],
  },
];

async function parseComments(comments: string) {
  const exclusions: string[] = [];
  const restrictions: string[] = [];
  const coverage: any = {};
  const operational: any = {};
  let status = 'active';
  const notes: string[] = [];

  const commentLower = comments.toLowerCase();

  // Status detection
  if (commentLower.includes('no appetite') || commentLower.includes('not a market') || commentLower.includes('declined') || commentLower.includes('no more')) {
    status = 'no_appetite';
  } else if (commentLower.includes('unresponsive')) {
    status = 'unresponsive';
  } else if (commentLower.includes('restricts') || commentLower.includes('limited') || commentLower.includes('selective')) {
    status = 'limited';
  }

  // Geographic restrictions
  const stateMatches = comments.match(/\b(TX|LA|CA|GA|NY|FL|IL|PA|OH|MI|NC|NJ|VA|WA|AZ|MA|TN|IN|MO|MD|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|IA|AR|MS|KS|UT|NV|NM|WV|NE|ID|HI|ME|NH|RI|MT|DE|SD|ND|AK|VT|WY|DC)\b/g);
  if (stateMatches) {
    restrictions.push(...stateMatches);
  }

  // Exclusions
  if (commentLower.includes('firearm')) exclusions.push('firearms');
  if (commentLower.includes('fast food')) exclusions.push('fast food chains');
  if (commentLower.includes('cryotherapy')) exclusions.push('cryotherapy');
  if (commentLower.includes('heavy massage')) exclusions.push('heavy massage');
  if (commentLower.includes('medspa')) exclusions.push('medspa exposure');
  if (commentLower.includes('abuse')) exclusions.push('abuse & molestation');
  if (commentLower.includes('a&b') || commentLower.includes('a and b')) {
    if (commentLower.includes('excludes a&b') || commentLower.includes('excludes a and b')) {
      exclusions.push('A&B');
    }
  }

  // Coverage details
  const glMatch = comments.match(/(\d+k\/\d+k|\d+k)/i);
  if (glMatch) {
    coverage.glLimit = glMatch[0];
  }
  if (commentLower.includes('property')) coverage.property = true;
  if (commentLower.includes('liability') || commentLower.includes('gl')) coverage.liability = true;
  if (commentLower.includes('pl')) coverage.professionalLiability = true;
  if (commentLower.includes('abuse') && !commentLower.includes('no abuse')) coverage.abuse = true;
  if (commentLower.includes('a&b') || commentLower.includes('a and b')) {
    if (!commentLower.includes('excludes')) coverage.aAndB = true;
  }

  // Operational criteria
  const hoursMatch = comments.match(/(\d+)\s*hours?/i);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1]);
    if (comments.includes('24 hours')) {
      operational.maxHours = 24;
    } else if (comments.includes('18 hours')) {
      operational.minHours = 18;
    }
  }
  if (commentLower.includes('2000 sq ft') || commentLower.includes('2000 sqft')) {
    operational.minSqFt = 2000;
  }
  if (commentLower.includes('3 years') || commentLower.includes('3 yrs')) {
    operational.minOwnershipYears = 3;
  }

  // Notes
  if (comments.trim()) {
    notes.push(comments.trim());
  }

  return {
    exclusions: [...new Set(exclusions)],
    geographicRestrictions: [...new Set(restrictions)],
    coverageDetails: coverage,
    operationalCriteria: operational,
    status,
    notes: notes.join(' '),
  };
}

async function loadPlaybookData() {
  try {
    console.log('🌱 Loading carrier playbook data into database...\n');

    // Create all business types
    const businessTypeMap = new Map<string, string>();
    for (const bt of playbookData) {
      const result = await sql`
        INSERT INTO business_types (name)
        VALUES (${bt.name})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name
      `;
      businessTypeMap.set(bt.name, result[0].id);
      console.log(`✅ Business Type: ${bt.name}`);
    }

    // Create all unique carriers
    const carrierMap = new Map<string, string>();
    const allCarriers = new Set<string>();
    
    playbookData.forEach(bt => {
      bt.carriers.forEach(c => {
        // Clean carrier name (remove contact info, etc.)
        const cleanName = c.name.split('-')[0].split('/')[0].trim();
        allCarriers.add(cleanName);
      });
    });

    for (const carrierName of allCarriers) {
      const result = await sql`
        INSERT INTO carriers (name)
        VALUES (${carrierName})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name
      `;
      carrierMap.set(carrierName, result[0].id);
    }
    console.log(`✅ Created ${carrierMap.size} carriers\n`);

    // Load carrier appetite for each business type
    let totalAppetites = 0;
    for (const bt of playbookData) {
      const businessTypeId = businessTypeMap.get(bt.name)!;
      console.log(`\n📋 Loading appetite for: ${bt.name}`);

      for (const carrier of bt.carriers) {
        const cleanCarrierName = carrier.name.split('-')[0].split('/')[0].trim();
        const carrierId = carrierMap.get(cleanCarrierName);

        if (!carrierId) {
          console.log(`⚠️  Carrier not found: ${cleanCarrierName}`);
          continue;
        }

        const parsed = await parseComments(carrier.comments);
        
        // Extract contact info
        const contactInfo: any = {};
        if (carrier.contact) {
          contactInfo.name = carrier.contact;
        }
        const emailMatch = carrier.comments.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          contactInfo.email = emailMatch[0];
        }

        // Create playbook data structure
        const playbookData = {
          geographicRestrictions: parsed.geographicRestrictions,
          exclusions: parsed.exclusions,
          coverageDetails: parsed.coverageDetails,
          operationalCriteria: parsed.operationalCriteria,
          contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
          notes: parsed.notes,
        };

        await sql`
          INSERT INTO carrier_appetite (
            carrier_id, business_type_id,
            playbook_data, geographic_restrictions, exclusions, status,
            coverage_details, operational_criteria, contact_info, notes
          )
          VALUES (
            ${carrierId}, ${businessTypeId},
            ${JSON.stringify(playbookData)}::jsonb,
            ${parsed.geographicRestrictions},
            ${parsed.exclusions},
            ${parsed.status},
            ${JSON.stringify(parsed.coverageDetails)}::jsonb,
            ${JSON.stringify(parsed.operationalCriteria)}::jsonb,
            ${JSON.stringify(contactInfo)}::jsonb,
            ${parsed.notes || carrier.comments}
          )
          ON CONFLICT (carrier_id, business_type_id)
          DO UPDATE SET
            playbook_data = EXCLUDED.playbook_data,
            geographic_restrictions = EXCLUDED.geographic_restrictions,
            exclusions = EXCLUDED.exclusions,
            status = EXCLUDED.status,
            coverage_details = EXCLUDED.coverage_details,
            operational_criteria = EXCLUDED.operational_criteria,
            contact_info = EXCLUDED.contact_info,
            notes = EXCLUDED.notes,
            updated_at = NOW()
        `;
        totalAppetites++;
      }
      console.log(`   ✅ Loaded ${bt.carriers.length} carrier appetites`);
    }

    console.log(`\n🎉 Successfully loaded ${totalAppetites} carrier appetite records!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Business Types: ${businessTypeMap.size}`);
    console.log(`   - Carriers: ${carrierMap.size}`);
    console.log(`   - Carrier Appetites: ${totalAppetites}`);
  } catch (error) {
    console.error('❌ Error loading playbook data:', error);
    throw error;
  }
}

loadPlaybookData()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
