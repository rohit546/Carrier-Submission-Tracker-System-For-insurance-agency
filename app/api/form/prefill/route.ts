import { NextRequest, NextResponse } from 'next/server';

// Enhanced Prefill Service for Insurance Form using Smarty Street API + Google Maps
class InsuranceFormPrefillService {
  private smartyAuthId: string;
  private smartyAuthToken: string;
  private smartyBaseUrl: string;
  private googleMapsApiKey: string;

  constructor() {
    this.smartyAuthId = process.env.SMARTY_AUTH_ID || '';
    this.smartyAuthToken = process.env.SMARTY_AUTH_TOKEN || '';
    this.smartyBaseUrl = "https://us-enrichment.api.smarty.com";
    this.googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
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

      // Validate if this is actually a c-store/gas station
      const validation = this._validateProperty(propertyData, googleData);
      
      const mappedData = this._mapToInsuranceForm(propertyData, googleData, address);

      console.log(`✅ Successfully mapped ${Object.keys(mappedData).length} form fields`);
      
      return {
        success: true,
        data: mappedData,
        validation: validation,
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
        features: 'financial'
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

      // Fetch financial dataset
      const datasetUrl = `${this.smartyBaseUrl}/lookup/${smartyKey}/property/financial`;
      const datasetParams = new URLSearchParams({
        'auth-id': this.smartyAuthId,
        'auth-token': this.smartyAuthToken
      });

      let financialData = null;
      try {
        const datasetResponse = await fetch(`${datasetUrl}?${datasetParams.toString()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (datasetResponse.ok) {
          financialData = await datasetResponse.json();
        }
      } catch (error) {
        console.log('Financial dataset not available');
      }

      const allData: any = {
        principal: principalData[0],
        smarty_key: smartyKey,
        datasets: {
          property_financial: financialData && financialData.length > 0 ? financialData[0] : null
        }
      };

      console.log(`✅ Successfully fetched property data`);
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

      // Geocode the address to get coordinates and place_id
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.googleMapsApiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
        console.log('⚠️ Google Geocoding failed:', geocodeData.status);
        return null;
      }

      const location = geocodeData.results[0].geometry.location;
      const addressPlaceId = geocodeData.results[0].place_id;

      // Get business details
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${addressPlaceId}&fields=name,formatted_phone_number,opening_hours,types,business_status,rating,user_ratings_total,website,editorial_summary&key=${this.googleMapsApiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      let business = null;
      let isGasStation = false;

      if (detailsData.status === 'OK' && detailsData.result) {
        business = detailsData.result;
        isGasStation = business.types?.some((t: string) => 
          t === 'gas_station' || t === 'convenience_store'
        ) || false;
      }

      return {
        location: location,
        placeId: addressPlaceId,
        business: business,
        isGasStation: isGasStation
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
      info: [] as string[],
      propertyType: 'unknown',
      confidence: 'high'
    };

    const principalAttributes = propertyData.principal?.attributes || {};
    const buildingSqft = principalAttributes.building_sqft || 0;
    const landUse = principalAttributes.land_use_standard || '';

    if (buildingSqft <= 10) {
      validation.warnings.push('⚠️ Very low square footage detected - this may be vacant land');
      validation.confidence = 'low';
    }

    if (landUse.toLowerCase().includes('vacant')) {
      validation.warnings.push('⚠️ Property classified as VACANT - not an operating business');
      validation.propertyType = 'vacant_land';
      validation.confidence = 'low';
    }

    if (googleData) {
      if (googleData.isGasStation) {
        validation.propertyType = 'gas_station';
        validation.confidence = 'high';
      } else if (googleData.business) {
        validation.warnings.push(`🚨 CRITICAL: Google Maps shows "${googleData.business.name}" - NOT a gas station/convenience store!`);
        validation.propertyType = 'wrong_business_type';
        validation.confidence = 'high';
        validation.isValid = false;
      }
    }

    return validation;
  }

  _mapToInsuranceForm(propertyData: any, googleData: any, originalAddress: string): Record<string, any> {
    const principalAttributes = propertyData.principal?.attributes || {};
    const matchedAddress = propertyData.principal?.matched_address || {};
    
    const mappedData: Record<string, any> = {};

    // Address Information
    if (matchedAddress.street) {
      mappedData.matchedAddress = {
        street: matchedAddress.street || '',
        city: matchedAddress.city || '',
        state: matchedAddress.state || '',
        zipcode: matchedAddress.zipcode || ''
      };
      mappedData.address = `${matchedAddress.street || ''}, ${matchedAddress.city || ''}, ${matchedAddress.state || ''} ${matchedAddress.zipcode || ''}`.trim();
    }

    // Owner Information
    mappedData.deedOwnerFullName = principalAttributes.deed_owner_full_name || '';
    mappedData.deedOwnerLastName = principalAttributes.deed_owner_last_name || '';
    mappedData.ownerFullName = principalAttributes.owner_full_name || '';
    
    const corporationName = this._extractCorporationName(principalAttributes);
    if (corporationName) {
      mappedData.corporationName = corporationName;
    }

    mappedData.ownerOccupancyStatus = principalAttributes.owner_occupancy_status || '';
    mappedData.ownershipType = principalAttributes.ownership_type || '';
    mappedData.companyFlag = principalAttributes.company_flag || '';

    // Property Details
    mappedData.buildingSqft = principalAttributes.building_sqft || '';
    mappedData.assessedValue = principalAttributes.assessed_value || '';
    mappedData.yearBuilt = principalAttributes.year_built || '';
    mappedData.storiesNumber = principalAttributes.stories_number || '';
    mappedData.numberOfBuildings = principalAttributes.number_of_buildings || '';
    mappedData.exteriorWalls = principalAttributes.exterior_walls || '';
    mappedData.flooring = principalAttributes.flooring || '';
    mappedData.canopy = principalAttributes.canopy || '';
    mappedData.canopySqft = principalAttributes.canopy_sqft || '';
    mappedData.landUseGroup = principalAttributes.land_use_group || '';
    mappedData.landUseStandard = principalAttributes.land_use_standard || '';
    mappedData.legalDescription = principalAttributes.legal_description || '';
    mappedData.construction_type = principalAttributes.construction_type || '';
    mappedData.latitude = principalAttributes.latitude || '';
    mappedData.longitude = principalAttributes.longitude || '';

    // Mortgage Information
    mappedData.lenderName = principalAttributes.lender_name || '';
    mappedData.mortgageAmount = principalAttributes.mortgage_amount || '';
    mappedData.mortgageDueDate = principalAttributes.mortgage_due_date || '';
    mappedData.mortgageRecordingDate = principalAttributes.mortgage_recording_date || '';
    mappedData.mortgageTerm = principalAttributes.mortgage_term || '';
    mappedData.mortgageType = principalAttributes.mortgage_type || '';

    // Mailing Address
    if (principalAttributes.contact_full_address) {
      mappedData.mailingAddress = {
        fullAddress: principalAttributes.contact_full_address || '',
        city: principalAttributes.contact_city || '',
        state: principalAttributes.contact_state || '',
        zipcode: principalAttributes.contact_zip || '',
        county: principalAttributes.contact_mailing_county || ''
      };
      const mailingParts = [
        principalAttributes.contact_full_address,
        principalAttributes.contact_city,
        principalAttributes.contact_state,
        principalAttributes.contact_zip
      ].filter(Boolean);
      mappedData.fullMailingAddress = mailingParts.join(', ');
    }

    // Google Maps Business Data
    if (googleData && googleData.business) {
      const business = googleData.business;
      
      if (business.name) {
        mappedData.dba = business.name;
        mappedData.businessName = business.name;
      }
      
      if (business.formatted_phone_number) {
        mappedData.contactNumber = business.formatted_phone_number;
      }
      
      if (business.opening_hours) {
        if (business.opening_hours.weekday_text) {
          mappedData.hoursOfOperationFull = business.opening_hours.weekday_text.join(', ');
        }
      }
      
      if (business.types && business.types.length > 0) {
        const types = business.types
          .filter((t: string) => !['point_of_interest', 'establishment'].includes(t))
          .map((t: string) => t.replace(/_/g, ' ').toUpperCase())
          .join(', ');
        if (types) {
          mappedData.businessTypes = types;
          mappedData.operationDescription = types;
        }
      }
    }

    // Add coordinates for map embedding
    if (googleData && googleData.location) {
      mappedData.coordinates = {
        lat: googleData.location.lat,
        lng: googleData.location.lng
      };
      mappedData.mapEmbedUrl = `https://www.google.com/maps/embed/v1/streetview?key=${this.googleMapsApiKey}&location=${googleData.location.lat},${googleData.location.lng}&heading=0&pitch=0&fov=100`;
    }

    // Include all other attributes dynamically
    Object.entries(principalAttributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && !mappedData[key]) {
        mappedData[key] = value;
      }
    });

    return mappedData;
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
