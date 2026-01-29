// Prefill Service for Insurance Form using Smarty Street API
const fetch = require('node-fetch');

class InsuranceFormPrefillService {
  constructor() {
    this.smartyAuthId = process.env.SMARTY_AUTH_ID;
    this.smartyAuthToken = process.env.SMARTY_AUTH_TOKEN;
    this.baseUrl = "https://us-enrichment.api.smarty.com";
  }

  /**
   * Main method to fetch and map data for insurance form prefill
   * @param {string} address - The property address to analyze
   * @returns {Promise<Object>} - Mapped form data ready for prefill
   */
  async prefillFormData(address) {
    try {
      console.log(`🔍 Analyzing address: ${address}`);
      
      // Get comprehensive property data from Smarty API
      const propertyData = await this._getPropertyData(address);
      
      if (!propertyData) {
        console.log("❌ No property data found for address");
        return { success: false, data: {}, message: "Address not found or invalid" };
      }

      // Map Smarty data to our insurance form fields
      const mappedData = this._mapToInsuranceForm(propertyData, address);
      
      console.log(`✅ Successfully mapped ${Object.keys(mappedData).length} form fields`);
      
      return {
        success: true,
        data: mappedData,
        message: `Auto-filled ${Object.keys(mappedData).length} fields from property data`,
        rawData: propertyData // Include raw data for debugging
      };
      
    } catch (error) {
      console.error("💥 Prefill error:", error.message);
      return {
        success: false,
        data: {},
        message: `Error fetching property data: ${error.message}`
      };
    }
  }

  /**
   * Get property data from Smarty Street API
   * @param {string} address - Property address
   * @returns {Promise<Object|null>} - Property data or null
   */
  async _getPropertyData(address) {
    try {
      const url = `${this.baseUrl}/lookup/search/property/principal`;
      const params = new URLSearchParams({
        freeform: address,
        'auth-id': this.smartyAuthId,
        'auth-token': this.smartyAuthToken
      });

      console.log(`📡 Making Smarty API request for: ${address}`);
      
      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        timeout: 10000
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Smarty API credentials');
        }
        throw new Error(`Smarty API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data && data.length > 0 ? data[0] : null;
      
    } catch (error) {
      console.error("❌ Smarty API error:", error.message);
      throw error;
    }
  }

  /**
   * Map Smarty property data to insurance form fields
   * @param {Object} propertyData - Raw Smarty API data
   * @param {string} originalAddress - Original input address
   * @returns {Object} - Mapped form data
   */
  _mapToInsuranceForm(propertyData, originalAddress) {
    const attributes = propertyData.attributes || {};
    const matchedAddress = propertyData.matched_address || {};
    
    const mappedData = {};

    // 1. Address (formatted from Smarty)
    if (matchedAddress.street && matchedAddress.city && matchedAddress.state) {
      mappedData.address = `${matchedAddress.street}, ${matchedAddress.city}, ${matchedAddress.state} ${matchedAddress.zipcode || ''}`.trim();
    }

    // 2. Corporation Name (from deed owner name)
    const corporationName = this._extractCorporationName(attributes);
    if (corporationName) {
      mappedData.corporationName = corporationName;
    }

    // 3. Applicant Type (determined from ownership structure)
    const applicantType = this._determineApplicantType(attributes);
    if (applicantType) {
      mappedData.applicantType = applicantType;
    }

    // 4. Operation Description (business type detection)
    const operationDescription = this._determineOperationType(attributes);
    if (operationDescription) {
      mappedData.operationDescription = operationDescription;
    }

    // 5. Year Built
    if (attributes.year_built) {
      mappedData.yearBuilt = attributes.year_built.toString();
    }

    // 6. Total Square Footage
    const sqFootage = this._getBestSquareFootage(attributes);
    if (sqFootage) {
      mappedData.totalSqFootage = sqFootage.toString();
    }

    // 7. Construction Type (inferred from property data)
    const constructionType = this._determineConstructionType(attributes);
    if (constructionType) {
      mappedData.constructionType = constructionType;
    }

    // 8. Ownership Type
    const ownershipType = this._determineOwnershipType(attributes);
    if (ownershipType) {
      mappedData.ownershipType = ownershipType;
    }

    // 9. Property Use/Zoning information
    if (attributes.land_use_standard || attributes.zoning) {
      mappedData.propertyUse = attributes.land_use_standard || attributes.zoning;
    }

    // 10. Additional business-related fields (if available)
    
    // FEIN - Not typically available in property records
    // DBA - Not typically available in property records
    // Hours of Operation - Not available in property records
    // No. of MPDs - Not available in property records
    
    // Additional property details that might be useful
    if (attributes.acres) {
      mappedData.acres = attributes.acres.toString();
    }

    if (attributes.lot_sqft) {
      mappedData.lotSize = this._formatNumber(attributes.lot_sqft);
    }

    // County information
    if (attributes.situs_county || matchedAddress.county) {
      mappedData.county = attributes.situs_county || matchedAddress.county;
    }

    // Protection Class (fire district info if available)
    if (attributes.fire_district) {
      mappedData.protectionClass = attributes.fire_district;
    }

    return mappedData;
  }

  /**
   * Extract corporation name from various owner name fields
   */
  _extractCorporationName(attributes) {
    const ownerFields = [
      'deed_owner_full_name',
      'owner_full_name',
      'deed_owner_last_name'
    ];

    for (const field of ownerFields) {
      const name = attributes[field];
      if (name && typeof name === 'string') {
        // Check if it contains business entity indicators
        const businessIndicators = ['LLC', 'INC', 'CORP', 'CORPORATION', 'COMPANY', 'LP', 'LTD'];
        const upperName = name.toUpperCase();
        
        if (businessIndicators.some(indicator => upperName.includes(indicator))) {
          return name;
        }
      }
    }
    
    return null;
  }

  /**
   * Determine applicant type based on ownership structure
   */
  _determineApplicantType(attributes) {
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

  /**
   * Determine operation type based on property characteristics
   */
  _determineOperationType(attributes) {
    const landUse = (attributes.land_use_standard || attributes.land_use_code || '').toLowerCase();
    const zoning = (attributes.zoning || '').toLowerCase();
    
    // Gas station / convenience store indicators
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
    
    // Default to commercial if we have any commercial indicators
    if (landUse.includes('commercial') || zoning.includes('commercial')) {
      return 'Commercial Business';
    }
    
    return null;
  }

  /**
   * Get the best available square footage measurement
   */
  _getBestSquareFootage(attributes) {
    // Prefer building square footage, fall back to gross, then total
    return attributes.building_sqft || 
           attributes.gross_sqft || 
           attributes.total_sqft ||
           null;
  }

  /**
   * Determine construction type from available data
   */
  _determineConstructionType(attributes) {
    // This is more challenging to determine from property records
    // We can make educated guesses based on year built and property type
    
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
    
    // Default guesses based on year and use
    if (yearBuilt && yearBuilt > 1990 && landUse.includes('commercial')) {
      return 'Non-Combustible';
    } else if (yearBuilt && yearBuilt < 1960) {
      return 'Frame';
    }
    
    return null;
  }

  /**
   * Determine ownership type
   */
  _determineOwnershipType(attributes) {
    const ownerOccupancy = attributes.owner_occupancy_status;
    
    if (ownerOccupancy === 'OWNER OCCUPIED') {
      return 'owned';
    } else if (ownerOccupancy === 'ABSENTEE OWNER' || ownerOccupancy === 'NON-OWNER OCCUPIED') {
      return 'leased';
    }
    
    // Default assumption for commercial properties
    return 'owned';
  }

  /**
   * Format number with commas
   */
  _formatNumber(value) {
    if (!value || isNaN(value)) return null;
    return parseInt(value).toLocaleString();
  }

  /**
   * Test the prefill service with sample addresses
   */
  async testPrefillService() {
    console.log("🧪 Testing Insurance Form Prefill Service");
    console.log("=" * 50);
    
    const testAddresses = [
      "1600 Amphitheatre Parkway, Mountain View, CA",
      "350 5th Ave, New York, NY 10118",
      "123 Main St, Atlanta, GA 30309"
    ];

    for (const address of testAddresses) {
      console.log(`\n🏢 Testing address: ${address}`);
      console.log("-" * 40);
      
      const result = await this.prefillFormData(address);
      
      if (result.success) {
        console.log("✅ SUCCESS");
        console.log(`📊 Fields filled: ${Object.keys(result.data).length}`);
        console.log("📋 Mapped data:");
        
        Object.entries(result.data).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      } else {
        console.log("❌ FAILED");
        console.log(`📝 Message: ${result.message}`);
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("\n🏁 Test completed");
  }
}

module.exports = { InsuranceFormPrefillService };

// Run test if this file is executed directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  const service = new InsuranceFormPrefillService();
  service.testPrefillService().catch(console.error);
}