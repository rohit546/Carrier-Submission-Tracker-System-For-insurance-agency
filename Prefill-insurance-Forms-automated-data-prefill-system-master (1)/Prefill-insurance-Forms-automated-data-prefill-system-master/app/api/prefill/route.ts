import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Enhanced Prefill Service for Insurance Form using Smarty Street API + Google Maps
class InsuranceFormPrefillService {
  private smartyAuthId: string;
  private smartyAuthToken: string;
  private smartyBaseUrl: string;
  private googleMapsApiKey: string;
  private neonConnectionString: string;
  private addressStopWords = new Set<string>([
    'USA', 'UNITED', 'STATES', 'APT', 'APARTMENT', 'SUITE', 'STE', 'BLDG',
    'FLOOR', 'FL', 'UNIT', 'GA', 'GEORGIA', 'SC', 'SOUTH', 'CAROLINA'
  ]);
  private streetSuffixMap = new Map<string, string>([
    ['ROAD', 'RD'],
    ['RD', 'RD'],
    ['STREET', 'ST'],
    ['ST', 'ST'],
    ['AVENUE', 'AVE'],
    ['AVE', 'AVE'],
    ['DRIVE', 'DR'],
    ['DR', 'DR'],
    ['BOULEVARD', 'BLVD'],
    ['BLVD', 'BLVD'],
    ['HIGHWAY', 'HWY'],
    ['HWY', 'HWY'],
    ['COURT', 'CT'],
    ['CT', 'CT'],
    ['LANE', 'LN'],
    ['LN', 'LN'],
    ['PARKWAY', 'PKWY'],
    ['PKWY', 'PKWY'],
    ['TRACE', 'TRCE'],
    ['TRCE', 'TRCE'],
    ['TERRACE', 'TER'],
    ['TER', 'TER']
  ]);
  private businessSuffixes = [
    'LLC', 'L L C', 'INC', 'INC.', 'CORP', 'CORPORATION', 'COMPANY', 'CO', 'CO.', 'LTD',
    'LP', 'LLP', 'LIMITED', 'PLC', 'PC', 'GROUP', 'HOLDINGS'
  ];

  constructor() {
    this.smartyAuthId = process.env.SMARTY_AUTH_ID || '';
    this.smartyAuthToken = process.env.SMARTY_AUTH_TOKEN || '';
    this.smartyBaseUrl = "https://us-enrichment.api.smarty.com";
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    this.neonConnectionString = process.env.NEON_CONNECTION_STRING || '';
  }

  async prefillFormData(address: string): Promise<any> {
    try {
      console.log(`🔍 Analyzing address: ${address}`);
      
      // Fetch data from both Smarty and Google Maps in parallel
      const [propertyData, googleData] = await Promise.all([
        this._getPropertyData(address),
        this._getGoogleMapsData(address)
      ]);
      
      if (!propertyData) {
        console.log("❌ No property data found for address");
        return { success: false, data: {}, message: "Address not found or invalid" };
      }

      // Log complete raw data from Smarty API
      console.log('\n═══════════════════════ RAW SMARTY DATA ═══════════════════════');
      console.log(JSON.stringify(propertyData, null, 2));
      console.log('═══════════════════════════════════════════════════════════════\n');

      // Log Google Maps data
      if (googleData) {
        console.log('\n═══════════════════════ RAW GOOGLE MAPS DATA ═══════════════════════');
        console.log(JSON.stringify(googleData, null, 2));
        console.log('═══════════════════════════════════════════════════════════════════\n');
      }

      // Validate if this is actually a c-store/gas station
      const validation = this._validateProperty(propertyData, googleData);
      
      const mappedData = this._mapToInsuranceForm(propertyData, googleData, address);

      const neonData = await this._getNeonBusinessData(address, mappedData);

      if (neonData?.business) {
        // Enrich mapped data with key Neon insights for easy drag & drop
        if (neonData.business.registered_agent_name) {
          mappedData.registeredAgentName = neonData.business.registered_agent_name;
        }
        if (neonData.business.registered_agent_physical_address) {
          mappedData.registeredAgentAddress = neonData.business.registered_agent_physical_address;
        }
        if (neonData.business.naics_code) {
          mappedData.naicsCode = neonData.business.naics_code;
        }
        if (neonData.business.naics_sub_code) {
          mappedData.naicsSubCode = neonData.business.naics_sub_code;
        }
        if (neonData.business.yearsAtLocation !== null && neonData.business.yearsAtLocation !== undefined) {
          mappedData.yearsAtLocation = neonData.business.yearsAtLocation;
        }
      }

      if (neonData?.license?.list_format_name) {
        mappedData.neonBusinessName = neonData.license.list_format_name;
      }

      console.log(`✅ Successfully mapped ${Object.keys(mappedData).length} form fields`);
      
      return {
        success: true,
        data: mappedData,
        validation: validation,
        neon: neonData,
        ownership: neonData?.ownership || { status: 'unknown', matchedName: null, neonBusinessName: null },
        message: `Auto-filled ${Object.keys(mappedData).length} fields from property data`,
        fieldsCount: Object.keys(mappedData).length
      };
      
    } catch (error: any) {
      console.error("💥 Prefill error:", error.message);
      return {
        success: false,
        data: {},
        message: `Error fetching property data: ${error.message}`
      };
    }
  }

  async _getPropertyData(address: string): Promise<any> {
    try {
      // First, get the principal data with financial features to get the SmartyKey
      const principalUrl = `${this.smartyBaseUrl}/lookup/search/property/principal`;
      const principalParams = new URLSearchParams({
        freeform: address,
        'auth-id': this.smartyAuthId,
        'auth-token': this.smartyAuthToken,
        features: 'financial'  // Include financial history in principal data
      });

      console.log(`📡 Making Smarty API request for principal data: ${address}`);
      
      const principalResponse = await fetch(`${principalUrl}?${principalParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!principalResponse.ok) {
        if (principalResponse.status === 401) {
          throw new Error('Invalid Smarty API credentials');
        }
        throw new Error(`Smarty API error: ${principalResponse.status} ${principalResponse.statusText}`);
      }

      const principalData = await principalResponse.json();
      
      if (!principalData || principalData.length === 0) {
        return null;
      }

      const smartyKey = principalData[0].smarty_key;
      console.log(`🔑 Found SmartyKey: ${smartyKey}`);

      // Only fetch essential datasets that we actually use
      const datasets = [
        { name: 'property_financial', url: 'property/financial' }
      ];

      const allData: any = {
        principal: principalData[0],
        smarty_key: smartyKey,
        datasets: {}
      };

      // Fetch additional datasets in parallel
      const datasetPromises = datasets.map(async (dataset) => {
        try {
          const datasetUrl = `${this.smartyBaseUrl}/lookup/${smartyKey}/${dataset.url}`;
          const datasetParams = new URLSearchParams({
            'auth-id': this.smartyAuthId,
            'auth-token': this.smartyAuthToken
          });

          const datasetResponse = await fetch(`${datasetUrl}?${datasetParams.toString()}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (datasetResponse.ok) {
            const datasetData = await datasetResponse.json();
            return { name: dataset.name, data: datasetData };
          } else {
            return { name: dataset.name, data: null };
          }
        } catch (error) {
          return { name: dataset.name, data: null };
        }
      });

      const datasetResults = await Promise.all(datasetPromises);
      
      // Organize the results
      datasetResults.forEach(result => {
        if (result.data && result.data.length > 0) {
          allData.datasets[result.name] = result.data[0];
        } else if (result.data) {
          // For datasets that might return objects instead of arrays
          allData.datasets[result.name] = result.data;
        }
      });

      console.log(`✅ Successfully fetched property data with ${Object.keys(allData.datasets).length} datasets`);

      return allData;
      
    } catch (error: any) {
      console.error("❌ Smarty API error:", error.message);
      throw error;
    }
  }

  async _getGoogleMapsData(address: string): Promise<any> {
    try {
      if (!this.googleMapsApiKey) {
        console.log('⚠️ Google Maps API key not configured');
        return null;
      }

      console.log(`📍 Fetching Google Maps data for: ${address}`);

      // Step 1: Geocode the address to get coordinates and place_id
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.googleMapsApiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
        console.log('⚠️ Google Geocoding failed:', geocodeData.status);
        return null;
      }

      const location = geocodeData.results[0].geometry.location;
      const addressPlaceId = geocodeData.results[0].place_id;

      console.log(`📍 Address coordinates: ${location.lat}, ${location.lng}`);
      console.log(`📍 Address Place ID: ${addressPlaceId}`);

      // Step 2: Get the PRIMARY business at this exact address using Place Details
      const primaryDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${addressPlaceId}&fields=name,formatted_phone_number,opening_hours,types,business_status,rating,user_ratings_total,website,editorial_summary&key=${this.googleMapsApiKey}`;
      const primaryDetailsResponse = await fetch(primaryDetailsUrl);
      const primaryDetailsData = await primaryDetailsResponse.json();

      let primaryBusiness = null;
      let isPrimaryGasStation = false;

      if (primaryDetailsData.status === 'OK' && primaryDetailsData.result) {
        primaryBusiness = primaryDetailsData.result;
        isPrimaryGasStation = primaryBusiness.types?.some((t: string) => 
          t === 'gas_station' || t === 'convenience_store'
        ) || false;
        
        console.log(`✅ Primary business at address: ${primaryBusiness.name}`);
        console.log(`📋 Primary business types: ${primaryBusiness.types?.join(', ')}`);
        console.log(`⛽ Is gas station: ${isPrimaryGasStation}`);
      }

      // Step 3: Search for nearby places to find ALL businesses at this location
      const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=25&key=${this.googleMapsApiKey}`;
      const nearbyResponse = await fetch(nearbyUrl);
      const nearbyData = await nearbyResponse.json();

      let allBusinessesAtLocation: any[] = [];
      let gasStationAtLocation = null;

      if (nearbyData.status === 'OK' && nearbyData.results.length > 0) {
        allBusinessesAtLocation = nearbyData.results;
        
        // Find if there's a gas station at this exact location
        gasStationAtLocation = nearbyData.results.find((place: any) => 
          (place.types.includes('gas_station') || place.types.includes('convenience_store')) &&
          Math.abs(place.geometry.location.lat - location.lat) < 0.0001 &&
          Math.abs(place.geometry.location.lng - location.lng) < 0.0001
        );

        console.log(`📊 Found ${allBusinessesAtLocation.length} businesses nearby`);
        if (gasStationAtLocation) {
          console.log(`⛽ Found gas station at location: ${gasStationAtLocation.name}`);
        }
      }

      // Step 4: Decide which business data to return
      // Priority: 
      // 1. If primary business is a gas station, use it
      // 2. If there's a gas station at exact location, use it
      // 3. Otherwise use primary business (and warn it's not a gas station)
      
      let finalBusiness = primaryBusiness;
      let finalIsGasStation = isPrimaryGasStation;
      let dataSource = 'primary_address';

      if (isPrimaryGasStation) {
        // Primary business is a gas station - use it
        console.log('✅ Using primary business (it is a gas station)');
      } else if (gasStationAtLocation) {
        // Found a gas station at this location, but it's not the primary
        // Get detailed info for the gas station
        const gasStationDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${gasStationAtLocation.place_id}&fields=name,formatted_phone_number,opening_hours,types,business_status,rating,user_ratings_total,website,editorial_summary&key=${this.googleMapsApiKey}`;
        const gasStationDetailsResponse = await fetch(gasStationDetailsUrl);
        const gasStationDetailsData = await gasStationDetailsResponse.json();
        
        if (gasStationDetailsData.status === 'OK') {
          finalBusiness = gasStationDetailsData.result;
          finalIsGasStation = true;
          dataSource = 'nearby_gas_station';
          console.log(`⛽ Using nearby gas station: ${finalBusiness.name}`);
        }
      } else {
        // No gas station found - using primary business
        console.log(`⚠️ No gas station found - using primary business: ${primaryBusiness?.name || 'Unknown'}`);
      }

      return {
        location: location,
        placeId: finalBusiness ? (gasStationAtLocation?.place_id || addressPlaceId) : addressPlaceId,
        business: finalBusiness,
        isGasStation: finalIsGasStation,
        dataSource: dataSource,
        allBusinessesNearby: allBusinessesAtLocation.map(b => ({
          name: b.name,
          types: b.types,
          place_id: b.place_id
        }))
      };

    } catch (error: any) {
      console.error('❌ Google Maps API error:', error.message);
      return null;
    }
  }

  _validateProperty(propertyData: any, googleData: any): any {
    const validation = {
      isValid: true,
      warnings: [] as string[],
      info: [] as string[], // Add separate info messages
      propertyType: 'unknown',
      confidence: 'high'
    };

    const principalAttributes = propertyData.principal?.attributes || {};
    const buildingSqft = principalAttributes.building_sqft || 0;
    const landUse = principalAttributes.land_use_standard || '';
    const landUseGroup = principalAttributes.land_use_group || '';

    // Check 1: Building square footage validation
    if (buildingSqft <= 10) {
      validation.warnings.push('⚠️ Very low square footage detected - this may be vacant land');
      validation.confidence = 'low';
    }

    // Check 2: Land use classification
    if (landUse.toLowerCase().includes('vacant')) {
      validation.warnings.push('⚠️ Property classified as VACANT - not an operating business');
      validation.propertyType = 'vacant_land';
      validation.confidence = 'low';
    }

    // Check 3: Google Maps business verification with enhanced mismatch detection
    if (googleData) {
      const googleBusinessName = googleData.business?.name || 'Unknown';
      const googleBusinessTypes = googleData.business?.types || [];
      const dataSource = googleData.dataSource || 'unknown';
      const allBusinesses = googleData.allBusinessesNearby || [];
      
      if (googleData.isGasStation) {
        validation.propertyType = 'gas_station';
        validation.confidence = 'high';
        console.log('✅ Verified as gas station/convenience store via Google Maps');
        
        // This is just informational, not a warning - gas station is valid
        if (dataSource === 'nearby_gas_station') {
          validation.info.push(`ℹ️ Note: Using nearby gas station data (${googleBusinessName}) instead of primary address business`);
        }
      } else if (googleData.business) {
        // Business found but NOT a gas station - this is a critical mismatch
        validation.warnings.push(`🚨 CRITICAL: Google Maps shows "${googleBusinessName}" - NOT a gas station/convenience store!`);
        validation.warnings.push(`📍 Business types detected: ${googleBusinessTypes.slice(0, 5).join(', ')}`);
        
        // List all businesses found at this location
        if (allBusinesses.length > 0) {
          const businessList = allBusinesses.slice(0, 3).map((b: any) => b.name).join(', ');
          validation.warnings.push(`🏢 Businesses at this location: ${businessList}${allBusinesses.length > 3 ? '...' : ''}`);
        }
        
        validation.warnings.push(`⚠️ Property land use: ${landUseGroup || landUse || 'unknown type'}`);
        validation.propertyType = 'wrong_business_type';
        validation.confidence = 'high'; // High confidence it's NOT a gas station
        validation.isValid = false;
      } else {
        validation.warnings.push('⚠️ No business found at this location on Google Maps');
        validation.confidence = 'low';
      }
    } else {
      validation.warnings.push('⚠️ Unable to verify business information via Google Maps');
      validation.confidence = 'low';
    }

    // Check 4: Cross-reference validation
    if (buildingSqft <= 10 && !googleData?.isGasStation) {
      validation.isValid = false;
      validation.warnings.push('🚫 ALERT: This appears to be VACANT LAND, not a c-store or gas station');
      validation.propertyType = 'vacant_land';
    }

    if (landUse.toLowerCase().includes('vacant') && !googleData?.isGasStation) {
      validation.isValid = false;
      validation.warnings.push('🚫 ALERT: Property is classified as VACANT with no operating business');
    }

    // Check 5: Warn if land use is commercial/office but NOT a gas station
    if (landUseGroup === 'commercial' && landUse === 'office_building' && !googleData?.isGasStation) {
      validation.isValid = false;
      validation.warnings.push('🚫 WRONG PROPERTY TYPE: This is an OFFICE BUILDING, not a convenience store/gas station!');
      validation.propertyType = 'office_building';
      validation.confidence = 'high'; // High confidence that it's NOT a c-store
    }

    return validation;
  }

  _mapToInsuranceForm(propertyData: any, googleData: any, originalAddress: string): Record<string, any> {
    // Extract data from different datasets
    const principalAttributes = propertyData.principal?.attributes || {};
    const matchedAddress = propertyData.principal?.matched_address || {};
    const datasets = propertyData.datasets || {};
    
    const mappedData: Record<string, any> = {};

    // === ADDRESS INFORMATION ===
    // 1. Matched Address (from Smarty standardized address)
    if (matchedAddress.street) {
      mappedData.matchedAddress = {
        street: matchedAddress.street || '',
        city: matchedAddress.city || '',
        state: matchedAddress.state || '',
        zipcode: matchedAddress.zipcode || ''
      };
      // Also create a full address string
      mappedData.address = `${matchedAddress.street || ''}, ${matchedAddress.city || ''}, ${matchedAddress.state || ''} ${matchedAddress.zipcode || ''}`.trim();
    }

    // 2. Mailing Address (from contact fields)
    if (principalAttributes.contact_full_address) {
      mappedData.mailingAddress = {
        fullAddress: principalAttributes.contact_full_address || '',
        city: principalAttributes.contact_city || '',
        state: principalAttributes.contact_state || '',
        zipcode: principalAttributes.contact_zip || '',
        zip4: principalAttributes.contact_zip4 || '',
        county: principalAttributes.contact_mailing_county || ''
      };
      // Create full mailing address string
      const mailingParts = [
        principalAttributes.contact_full_address,
        principalAttributes.contact_city,
        principalAttributes.contact_state,
        principalAttributes.contact_zip
      ].filter(Boolean);
      mappedData.fullMailingAddress = mailingParts.join(', ');
    }

    // === OWNER INFORMATION ===
    // 3. Owner Names (both deed and current owner)
    mappedData.deedOwnerFullName = principalAttributes.deed_owner_full_name || '';
    mappedData.deedOwnerLastName = principalAttributes.deed_owner_last_name || '';
    mappedData.ownerFullName = principalAttributes.owner_full_name || '';
    
    // 4. Corporation Name (extract from owner names)
    const corporationName = this._extractCorporationName(principalAttributes);
    if (corporationName) {
      mappedData.corporationName = corporationName;
    }

    // 5. Ownership Details
    mappedData.ownerOccupancyStatus = principalAttributes.owner_occupancy_status || '';
    mappedData.ownershipType = principalAttributes.ownership_type || '';
    mappedData.companyFlag = principalAttributes.company_flag || '';

    // === PROPERTY DETAILS ===
    // 6. Building Information
    mappedData.buildingSqft = principalAttributes.building_sqft || '';
    mappedData.assessedValue = principalAttributes.assessed_value || '';
    mappedData.elevationFeet = principalAttributes.elevation_feet || '';
    mappedData.exteriorWalls = principalAttributes.exterior_walls || '';
    mappedData.flooring = principalAttributes.flooring || '';
    mappedData.storiesNumber = principalAttributes.stories_number || '';
    mappedData.yearBuilt = principalAttributes.year_built || '';
    mappedData.numberOfBuildings = principalAttributes.number_of_buildings || '';
    
    // 7. Canopy Information (for gas stations/convenience stores)
    mappedData.canopy = principalAttributes.canopy || '';
    mappedData.canopySqft = principalAttributes.canopy_sqft || '';

    // 8. Land Use Information
    mappedData.landUseGroup = principalAttributes.land_use_group || '';
    mappedData.landUseStandard = principalAttributes.land_use_standard || '';
    mappedData.legalDescription = principalAttributes.legal_description || '';

    // 9. Business Type Detection (for operation description)
    const operationDescription = this._determineOperationType(principalAttributes);
    if (operationDescription) {
      mappedData.operationDescription = operationDescription;
    }

    // 10. Applicant Type (determined from ownership structure)
    const applicantType = this._determineApplicantType(principalAttributes);
    if (applicantType) {
      mappedData.applicantType = applicantType;
    }

    // === MORTGAGE & LENDER INFORMATION ===
    // 11. Mortgage and Lender Details
    mappedData.mortgageAmount = principalAttributes.mortgage_amount || '';
    mappedData.mortgageDueDate = principalAttributes.mortgage_due_date || '';
    mappedData.mortgageRecordingDate = principalAttributes.mortgage_recording_date || '';
    mappedData.mortgageTerm = principalAttributes.mortgage_term || '';
    mappedData.mortgageTermType = principalAttributes.mortgage_term_type || '';
    mappedData.mortgageType = principalAttributes.mortgage_type || '';
    mappedData.lenderName = principalAttributes.lender_name || '';
    mappedData.lenderLastName = principalAttributes.lender_last_name || '';
    mappedData.mortgageLenderCode = principalAttributes.mortgage_lender_code || '';
    
    // Auto-generate Additional Insured text from lender info
    if (principalAttributes.lender_name && principalAttributes.mortgage_amount) {
      const lenderName = principalAttributes.lender_name;
      const mortgageAmount = principalAttributes.mortgage_amount;
      mappedData.additionalInsured = `${lenderName} - Mortgagee ($${parseInt(mortgageAmount).toLocaleString()})`;
      console.log(`✅ Auto-generated Additional Insured: ${mappedData.additionalInsured}`);
    }

    // === ADDITIONAL COMPREHENSIVE ATTRIBUTES ===
    // Make it dynamic - include all available attributes whether needed or not
    const allAttributes = {
      // Financial Information
      assessed_improvement_value: principalAttributes.assessed_improvement_value,
      assessed_land_value: principalAttributes.assessed_land_value,
      market_value_year: principalAttributes.market_value_year,
      deed_sale_price: principalAttributes.deed_sale_price,
      deed_sale_date: principalAttributes.deed_sale_date,
      
      // Property Size and Lot Information
      acres: principalAttributes.acres,
      lot_sqft: principalAttributes.lot_sqft,
      '1st_floor_sqft': principalAttributes['1st_floor_sqft'],
      '2nd_floor_sqft': principalAttributes['2nd_floor_sqft'],
      
      // Building Features
      bedrooms: principalAttributes.bedrooms,
      bathrooms_total: principalAttributes.bathrooms_total,
      bathrooms_partial: principalAttributes.bathrooms_partial,
      garage: principalAttributes.garage,
      garage_sqft: principalAttributes.garage_sqft,
      construction_type: principalAttributes.construction_type,
      roof_cover: principalAttributes.roof_cover,
      foundation: principalAttributes.foundation,
      
      // Utilities and Features
      air_conditioner: principalAttributes.air_conditioner,
      heat: principalAttributes.heat,
      heat_fuel_type: principalAttributes.heat_fuel_type,
      sewer_type: principalAttributes.sewer_type,
      water_service_type: principalAttributes.water_service_type,
      fireplace: principalAttributes.fireplace,
      fireplace_number: principalAttributes.fireplace_number,
      pool: principalAttributes.pool,
      pool_area: principalAttributes.pool_area,
      
      // Commercial/Business Features
      parking_spaces: principalAttributes.parking_spaces,
      loading_platform: principalAttributes.loading_platform,
      loading_platform_sqft: principalAttributes.loading_platform_sqft,
      overhead_door: principalAttributes.overhead_door,
      office_sqft: principalAttributes.office_sqft,
      
      // Security and Safety
      security_alarm: principalAttributes.security_alarm,
      fire_sprinklers_flag: principalAttributes.fire_sprinklers_flag,
      fire_resistance_code: principalAttributes.fire_resistance_code,
      sprinklers: principalAttributes.sprinklers,
      
      // Geographic and Location Data
      latitude: principalAttributes.latitude,
      longitude: principalAttributes.longitude,
      elevation_feet: principalAttributes.elevation_feet,
      congressional_district: principalAttributes.congressional_district,
      census_tract: principalAttributes.census_tract,
      census_block: principalAttributes.census_block,
      fips_code: principalAttributes.fips_code,
      
      // Zoning and Legal
      zoning: principalAttributes.zoning,
      legal_description: principalAttributes.legal_description,
      parcel_number_formatted: principalAttributes.parcel_number_formatted,
      
      // Owner Contact Information (Dynamic)
      contact_house_number: principalAttributes.contact_house_number,
      contact_street_name: principalAttributes.contact_street_name,
      contact_suffix: principalAttributes.contact_suffix,
      contact_unit_designator: principalAttributes.contact_unit_designator,
      contact_mail_info_format: principalAttributes.contact_mail_info_format,
      contact_mailing_fips: principalAttributes.contact_mailing_fips,
      contact_crrt: principalAttributes.contact_crrt,
      
      // Business/Commercial Specific
      land_use_code: principalAttributes.land_use_code,
      topography_code: principalAttributes.topography_code,
      view_description: principalAttributes.view_description
    };

    // Dynamically add all non-null/non-undefined attributes
    Object.entries(allAttributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        mappedData[key] = value;
      }
    });

    // === GEOGRAPHIC DATA ===
    const geoData = datasets.geo_reference?.attributes || datasets.geo_reference_2020?.attributes;
    if (geoData) {
      mappedData.geoReference = {
        place: geoData.place?.name || '',
        county: geoData.census_county_division?.name || '',
        metroArea: geoData.core_based_stat_area?.name || '',
        censusBlock: geoData.census_block?.geoid || '',
        censusTract: geoData.census_tract?.code || ''
      };
    }

    // === FINANCIAL HISTORY ===
    const financialData = datasets.property_financial?.attributes;
    if (financialData?.financial_history && Array.isArray(financialData.financial_history)) {
      mappedData.financialHistory = financialData.financial_history.map((record: any) => ({
        lenderName: record.lender_name || '',
        mortgageAmount: record.mortgage_amount || '',
        mortgageDueDate: record.mortgage_due_date || '',
        mortgageType: record.mortgage_type || '',
        documentType: record.document_type_description || '',
        recordingDate: record.mortgage_recording_date || ''
      }));
    }

    // === RISK DATA ===
    const riskData = datasets.risk?.attributes;
    if (riskData) {
      const riskFactors: string[] = [];
      if (riskData.CFLD_RISKR && riskData.CFLD_RISKR !== 'No Rating') {
        riskFactors.push(`Flood Risk: ${riskData.CFLD_RISKR}`);
      }
      if (riskData.HWAV_RISKR && riskData.HWAV_RISKR !== 'No Rating') {
        riskFactors.push(`Hurricane Risk: ${riskData.HWAV_RISKR}`);
      }
      if (riskData.LTNG_RISKR && riskData.LTNG_RISKR !== 'No Rating') {
        riskFactors.push(`Lightning Risk: ${riskData.LTNG_RISKR}`);
      }
      if (riskFactors.length > 0) {
        mappedData.riskFactors = riskFactors;
      }
    }

    // === GOOGLE MAPS BUSINESS DATA ===
    if (googleData && googleData.business) {
      const business = googleData.business;
      
      // DBA (Doing Business As) - Business Name
      if (business.name) {
        mappedData.dba = business.name;
        mappedData.businessName = business.name;
      }
      
      // Contact Number
      if (business.formatted_phone_number) {
        mappedData.contactNumber = business.formatted_phone_number;
        mappedData.phoneNumber = business.formatted_phone_number;
      }
      
      // Hours of Operation - Calculate total hours per day
      let operatingHours = null;
      if (business.opening_hours) {
        // Store full hours text for reference
        if (business.opening_hours.weekday_text) {
          mappedData.hoursOfOperationFull = business.opening_hours.weekday_text.join(', ');
        }
        
        // Calculate operating hours (simplified)
        if (business.opening_hours.periods) {
          // Check if 24 hours
          const is24Hours = business.opening_hours.periods.length === 1 && 
                           business.opening_hours.periods[0].open && 
                           !business.opening_hours.periods[0].close;
          
          if (is24Hours) {
            operatingHours = 24;
          } else if (business.opening_hours.weekday_text && business.opening_hours.weekday_text.length > 0) {
            // Parse typical format: "Monday: 6:00 AM – 11:00 PM"
            const firstDay = business.opening_hours.weekday_text[0];
            const timeMatch = firstDay.match(/(\d+):(\d+)\s*(AM|PM)\s*[–-]\s*(\d+):(\d+)\s*(AM|PM)/);
            
            if (timeMatch) {
              let openHour = parseInt(timeMatch[1]);
              const openMin = parseInt(timeMatch[2]);
              const openPeriod = timeMatch[3];
              let closeHour = parseInt(timeMatch[4]);
              const closeMin = parseInt(timeMatch[5]);
              const closePeriod = timeMatch[6];
              
              // Convert to 24-hour format
              if (openPeriod === 'PM' && openHour !== 12) openHour += 12;
              if (openPeriod === 'AM' && openHour === 12) openHour = 0;
              if (closePeriod === 'PM' && closeHour !== 12) closeHour += 12;
              if (closePeriod === 'AM' && closeHour === 12) closeHour = 0;
              
              // Calculate hours
              let hours = closeHour - openHour;
              if (hours < 0) hours += 24; // Handle overnight operations
              
              operatingHours = Math.round(hours);
            }
          }
        }
        
        // Set simplified hours
        if (operatingHours !== null) {
          mappedData.hoursOfOperation = operatingHours.toString();
        }
        
        if (business.opening_hours.open_now !== undefined) {
          mappedData.currentlyOpen = business.opening_hours.open_now;
        }
      }
      
      // Operation Description - Smart formatting for C-Store
      const isCStore = business.types?.some((t: string) => 
        t === 'convenience_store' || t === 'gas_station'
      );
      
      let operationDesc = '';
      
      if (isCStore) {
        // Start with "C-Store with X hours"
        if (operatingHours) {
          operationDesc = `C-Store with ${operatingHours} hours operation`;
        } else {
          operationDesc = 'C-Store';
        }
        
        // Add editorial summary if available
        if (business.editorial_summary?.overview) {
          operationDesc += `. ${business.editorial_summary.overview}`;
        } else if (business.types && business.types.length > 1) {
          // Add other business types as description
          const otherTypes = business.types
            .filter((t: string) => !['point_of_interest', 'establishment', 'convenience_store', 'gas_station'].includes(t))
            .map((t: string) => t.replace(/_/g, ' '))
            .join(', ');
          
          if (otherTypes) {
            operationDesc += ` with ${otherTypes}`;
          }
        }
      } else {
        // For non-c-stores, use types or editorial summary
        if (business.editorial_summary?.overview) {
          operationDesc = business.editorial_summary.overview;
        } else if (business.types && business.types.length > 0) {
          operationDesc = business.types
            .filter((t: string) => !['point_of_interest', 'establishment'].includes(t))
            .map((t: string) => t.replace(/_/g, ' ').toUpperCase())
            .join(', ');
        }
      }
      
      if (operationDesc) {
        mappedData.operationDescription = operationDesc;
      }
      
      // Store business types separately
      if (business.types && business.types.length > 0) {
        const types = business.types
          .filter((t: string) => !['point_of_interest', 'establishment'].includes(t))
          .map((t: string) => t.replace(/_/g, ' ').toUpperCase())
          .join(', ');
        if (types) {
          mappedData.businessTypes = types;
        }
      }
      
      // Editorial Summary
      if (business.editorial_summary?.overview) {
        mappedData.editorialSummary = business.editorial_summary.overview;
      }
      
      // Website
      if (business.website) {
        mappedData.website = business.website;
      }
      
      // Business Status
      if (business.business_status) {
        mappedData.businessStatus = business.business_status;
      }
      
      // Rating Information
      if (business.rating) {
        mappedData.googleRating = business.rating;
      }
      if (business.user_ratings_total) {
        mappedData.totalReviews = business.user_ratings_total;
      }
      
      console.log(`✅ Added Google Maps business data: ${business.name}`);
    }

    // Add coordinates for map embedding
    if (googleData && googleData.location) {
      mappedData.coordinates = {
        lat: googleData.location.lat,
        lng: googleData.location.lng
      };
      mappedData.mapEmbedUrl = `https://www.google.com/maps/embed/v1/streetview?key=${this.googleMapsApiKey}&location=${googleData.location.lat},${googleData.location.lng}&heading=0&pitch=0&fov=100`;
    }

    console.log('🎯 Mapped comprehensive data with', Object.keys(mappedData).length, 'attributes');
    return mappedData;
  }

  private _normalizeAddressTokens(address: string): string[] {
    const cleaned = address
      .toUpperCase()
      .replace(/[.,#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return [];

    return cleaned
      .split(' ')
      .filter(Boolean)
      .map(token => this.streetSuffixMap.get(token) || token)
      .filter(token => !this.addressStopWords.has(token));
  }

  private _buildAddressPatterns(address: string): string[] {
    const tokens = this._normalizeAddressTokens(address);
    if (tokens.length === 0) return [];

    const streetNumber = tokens[0];
    const significantTokens = tokens.length > 1 ? tokens.slice(1) : [];

    const fullPattern = `%${tokens.join('%')}%`;
    const streetTokens = significantTokens.slice(0, 2);
    const streetPattern = streetTokens.length ? `%${[streetNumber, ...streetTokens].join('%')}%` : null;

    return [fullPattern, streetPattern].filter((pattern): pattern is string => Boolean(pattern));
  }

  private async _queryTobaccoLicenses(client: Client, patterns: string[]) {
    const sql = `
      SELECT
        id,
        list_format_name,
        list_format_address,
        license_id,
        tbl_license_type,
        created_at
      FROM (
        SELECT *,
          CASE
            WHEN UPPER(list_format_address) LIKE $2 THEN 1
            WHEN UPPER(list_format_address) LIKE $3 THEN 2
            ELSE 3
          END AS match_priority,
          UPPER(list_format_address) AS normalized_address
        FROM tobacco_licenses
        WHERE UPPER(list_format_address) LIKE ANY($1)
      ) AS matches
      WHERE match_priority <= 2 AND normalized_address LIKE $4
      ORDER BY match_priority ASC, created_at DESC
      LIMIT 5;
    `;

    const uppercasePatterns = patterns.map(pattern => pattern.toUpperCase());
    const firstPattern = uppercasePatterns[0] || null;
    const secondPattern = uppercasePatterns[1] || uppercasePatterns[0] || null;

    const { rows } = await client.query(sql, [uppercasePatterns, firstPattern, secondPattern, uppercasePatterns[0]]);
    return rows;
  }

  private _normalizeBusinessName(name?: string | null): string {
    if (!name) return '';
    let upper = name.toUpperCase();
    this.businessSuffixes.forEach(suffix => {
      const regex = new RegExp(`\\b${suffix.replace('.', '\\.')}$`);
      upper = upper.replace(regex, '');
    });
    return upper.replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private _buildBusinessPatterns(name: string): string[] {
    const normalized = this._normalizeBusinessName(name);
    if (!normalized) return [];

    const tokens = normalized.split(' ').filter(Boolean);
    if (tokens.length === 0) return [];

    const fullPattern = `%${tokens.join('%')}%`;
    const partialPattern = tokens.length > 1 ? `%${tokens.slice(0, 2).join('%')}%` : fullPattern;

    return [fullPattern, partialPattern];
  }

  private async _queryGsosBusinessDetails(client: Client, patterns: string[]) {
    const sql = `
      SELECT
        business_name,
        business_status,
        business_type,
        naics_code,
        naics_sub_code,
        formation_date,
        registered_agent_name,
        registered_agent_physical_address,
        control_number
      FROM (
        SELECT *,
          CASE
            WHEN UPPER(business_name) LIKE $2 THEN 1
            WHEN UPPER(business_name) LIKE $3 THEN 2
            ELSE 3
          END AS match_priority,
          UPPER(business_name) AS normalized_name
        FROM gsos_business_details
        WHERE UPPER(business_name) LIKE ANY($1)
      ) AS matches
      WHERE match_priority <= 2
      ORDER BY match_priority ASC, formation_date DESC
      LIMIT 3;
    `;

    const uppercasePatterns = patterns.map(pattern => pattern.toUpperCase());
    const firstPattern = uppercasePatterns[0] || null;
    const secondPattern = uppercasePatterns[1] || uppercasePatterns[0] || null;

    const { rows } = await client.query(sql, [uppercasePatterns, firstPattern, secondPattern]);
    return rows;
  }

  private _calculateYearsAtLocation(formationDate?: string | Date | null): number | null {
    if (!formationDate) return null;
    const date = new Date(formationDate);
    if (Number.isNaN(date.getTime())) return null;
    const diffMs = Date.now() - date.getTime();
    const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(years);
  }

  private _determineOwnershipStatus(mappedData: Record<string, any>, neonBusinessName?: string | null) {
    if (!neonBusinessName) {
      return {
        status: 'unknown' as const,
        matchedName: null,
        neonBusinessName: null
      };
    }

    const propertyNames = [
      mappedData.corporationName,
      mappedData.ownerFullName,
      mappedData.deedOwnerFullName,
      mappedData.deedOwnerLastName
    ].filter(Boolean) as string[];

    const normalizedNeonName = this._normalizeBusinessName(neonBusinessName);

    for (const name of propertyNames) {
      const normalizedPropertyName = this._normalizeBusinessName(name);
      if (normalizedPropertyName && normalizedNeonName && (normalizedPropertyName === normalizedNeonName || normalizedNeonName.includes(normalizedPropertyName) || normalizedPropertyName.includes(normalizedNeonName))) {
        return {
          status: 'owner' as const,
          matchedName: name,
          neonBusinessName
        };
      }
    }

    return {
      status: propertyNames.length > 0 ? 'tenant' as const : 'unknown' as const,
      matchedName: propertyNames[0] || null,
      neonBusinessName
    };
  }

  private async _getNeonBusinessData(address: string, mappedData: Record<string, any>) {
    if (!this.neonConnectionString) {
      console.log('ℹ️ Neon connection string not configured. Skipping Neon lookup.');
      return null;
    }

    const patterns = this._buildAddressPatterns(address);
    if (patterns.length === 0) {
      console.log('ℹ️ Unable to build Neon search patterns for address');
      return null;
    }

    const client = new Client({
      connectionString: this.neonConnectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      const licenseRows = await this._queryTobaccoLicenses(client, patterns);

      if (!licenseRows || licenseRows.length === 0) {
        return null;
      }

      const licenseRecord = licenseRows[0];
      const businessNamePatterns = this._buildBusinessPatterns(licenseRecord.list_format_name);

      let businessRecord = null;
      if (businessNamePatterns.length > 0) {
        const businessRows = await this._queryGsosBusinessDetails(client, businessNamePatterns);
        if (businessRows && businessRows.length > 0) {
          const record = businessRows[0];
          businessRecord = {
            ...record,
            yearsAtLocation: this._calculateYearsAtLocation(record.formation_date)
          };
        }
      }

      const ownership = this._determineOwnershipStatus(mappedData, businessRecord?.business_name || licenseRecord.list_format_name);

      return {
        license: licenseRecord,
        business: businessRecord,
        ownership
      };
    } catch (error: any) {
      console.error('❌ Neon lookup failed:', error.message);
      return null;
    } finally {
      try {
        await client.end();
      } catch (endError) {
        console.error('❌ Failed to close Neon connection:', endError);
      }
    }
  }

  _calculateTotalSquareFootage(attributes: any): number | null {
    // Try different square footage fields in order of preference
    if (attributes.building_sqft) return parseInt(attributes.building_sqft);
    if (attributes.gross_sqft) return parseInt(attributes.gross_sqft);
    
    // Calculate from floor square footage
    let total = 0;
    if (attributes['1st_floor_sqft']) total += parseInt(attributes['1st_floor_sqft']);
    if (attributes['2nd_floor_sqft']) total += parseInt(attributes['2nd_floor_sqft']);
    if (attributes.upper_floors_sqft) total += parseInt(attributes.upper_floors_sqft);
    
    return total > 0 ? total : null;
  }

  _determineOwnershipType(attributes: any): string | null {
    if (attributes.ownership_type) {
      return attributes.ownership_type;
    }
    
    // Infer from corporation name
    const corporationName = this._extractCorporationName(attributes);
    if (corporationName) {
      if (corporationName.includes('LLC')) return 'LLC';
      if (corporationName.includes('CORP') || corporationName.includes('INC')) return 'Corporation';
      if (corporationName.includes('LP')) return 'Limited Partnership';
    }
    
    return 'Individual';
  }

  _extractCorporationName(attributes: any): string | null {
    const ownerFields = [
      'deed_owner_full_name',
      'owner_full_name',
      'deed_owner_last_name'
    ];

    for (const field of ownerFields) {
      const name = attributes[field];
      if (name && typeof name === 'string') {
        const businessIndicators = ['LLC', 'INC', 'CORP', 'CORPORATION', 'COMPANY', 'LP', 'LTD'];
        const upperName = name.toUpperCase();
        
        if (businessIndicators.some(indicator => upperName.includes(indicator))) {
          return name;
        }
      }
    }
    
    return null;
  }

  _determineApplicantType(attributes: any): string {
    const ownerName = attributes.deed_owner_full_name || attributes.owner_full_name || '';
    const upperName = ownerName.toUpperCase();

    if (upperName.includes('LLC')) {
      return 'llc';
    } else if (upperName.includes('CORP') || upperName.includes('CORPORATION') || upperName.includes('INC')) {
      return 'corporation';
    } else if (upperName.includes('PARTNERSHIP') || upperName.includes('LP')) {
      return 'partnership';
    } else if (upperName.includes('JOINT VENTURE')) {
      return 'jointVenture';
    } else if (attributes.owner_occupancy_status === 'OWNER OCCUPIED' || 
               (!upperName.includes('LLC') && !upperName.includes('CORP') && !upperName.includes('INC'))) {
      return 'individual';
    }
    
    return 'other';
  }

  _determineOperationType(attributes: any): string | null {
    const landUse = (attributes.land_use_standard || attributes.land_use_code || '').toLowerCase();
    const zoning = (attributes.zoning || '').toLowerCase();
    
    if (landUse.includes('gas') || landUse.includes('fuel') || landUse.includes('service station') ||
        zoning.includes('gas') || zoning.includes('fuel') || zoning.includes('service')) {
      return 'Gas Station with Convenience Store';
    }
    
    if (landUse.includes('retail') || landUse.includes('commercial') || landUse.includes('store')) {
      return 'Convenience Store';
    }
    
    if (landUse.includes('restaurant') || landUse.includes('food')) {
      return 'Food Service/Restaurant';
    }
    
    if (landUse.includes('office')) {
      return 'Office';
    }
    
    if (landUse.includes('warehouse') || landUse.includes('industrial')) {
      return 'Warehouse/Industrial';
    }
    
    if (landUse.includes('commercial') || zoning.includes('commercial')) {
      return 'Commercial Business';
    }
    
    return null;
  }

  _getBestSquareFootage(attributes: any): number | null {
    return attributes.building_sqft || 
           attributes.gross_sqft || 
           attributes.total_sqft ||
           null;
  }

  _determineConstructionType(attributes: any): string | null {
    const yearBuilt = parseInt(attributes.year_built);
    const landUse = (attributes.land_use_standard || '').toLowerCase();
    
    if (landUse.includes('frame') || landUse.includes('wood')) {
      return 'Frame';
    }
    
    if (landUse.includes('masonry') || landUse.includes('brick') || landUse.includes('block')) {
      return 'Masonry Non-Combustible';
    }
    
    if (landUse.includes('steel') || landUse.includes('metal')) {
      return 'Non-Combustible';
    }
    
    if (yearBuilt && yearBuilt > 1990 && landUse.includes('commercial')) {
      return 'Non-Combustible';
    } else if (yearBuilt && yearBuilt < 1960) {
      return 'Frame';
    }
    
    return null;
  }

  _formatNumber(value: any): string | null {
    if (!value || isNaN(value)) return null;
    return parseInt(value).toLocaleString();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    
    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Address is required' },
        { status: 400 }
      );
    }

    const prefillService = new InsuranceFormPrefillService();
    const result = await prefillService.prefillFormData(address);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
}