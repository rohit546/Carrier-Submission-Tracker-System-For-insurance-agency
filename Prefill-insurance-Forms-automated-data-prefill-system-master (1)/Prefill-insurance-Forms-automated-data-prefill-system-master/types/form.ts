
export interface Building {
  id: string
  address: string
  sqFootage: string
  construction: string
  yearBuilt: string
  businessIncome: string
  businessPersonalProperty: string
  sales: string
  description: string
}

export interface AdditionalInterest {
  id: string
  type: string
  name: string
  address: string
}

export interface FormData {
  // Address (top field)
  address: string
  mailingAddress: string
  
  // Company Information
  corporationName: string
  contactName: string
  contactNumber: string
  contactEmail: string
  leadSource: string
  proposedEffectiveDate: string
  priorCarrier: string
  targetPremium: string
  
  // Applicant Type
  applicantType: 'individual' | 'partnership' | 'corporation' | 'jointVenture' | 'llc' | 'other' | string
  
  // Security Systems
  burglarAlarm: {
    centralStation: boolean
    local: boolean
  }
  fireAlarm: {
    centralStation: boolean
    local: boolean
  }
  
  // Operations
  operationDescription: string
  
  // Ownership
  ownershipType: 'owner' | 'tenant' | 'lessorsRisk' | 'tripleNetLease' | string
  
  // Property Information (from Smarty data)
  yearBuilt: string
  totalSqFootage: string
  constructionType: string
  acres: string
  
  // Financial Information
  assessedValue: string
  marketValue: string
  primaryLender: string
  mortgageAmount: string
  
  // Location Information
  county: string
  municipality: string
  metroArea: string
  
  // Property Details
  bedrooms: string
  bathrooms: string
  stories: string
  garageSize: string
  lotSize: string
  
  // Construction Details
  roofType: string
  exteriorWalls: string
  foundation: string
  
  // Safety Features
  safetyFeatures: string[]
  riskFactors: string[]
  
  // Secondary Units
  hasSecondaryUnits: boolean
  secondaryUnitsCount: string
  
  // Property Coverage
  building: string
  bpp: string
  bi: string
  canopy: string
  pumps: string
  ms: string
  
  // General Liability Sales (with monthly/yearly)
  insideSalesMonthly: string
  insideSalesYearly: string
  liquorSalesMonthly: string
  liquorSalesYearly: string
  gasolineSalesMonthly: string
  gasolineSalesYearly: string
  gasSalesMonthly: string  // Alternative name
  gasSalesYearly: string    // Alternative name
  propaneFillingExchangeMonthly: string
  propaneFillingExchangeYearly: string
  propaneSalesMonthly: string  // Alternative name
  propaneSalesYearly: string    // Alternative name
  carwash: string
  carwashMonthly: string
  carwashYearly: string
  cooking: string
  cookingMonthly: string
  cookingYearly: string
  
  // Business Details
  coverageLimits: string
  fein: string
  dba: string
  hoursOfOperation: string
  noOfMPDs: string
  yearsInBusiness: string
  yearsAtLocation: string
  yearOfLatestUpdate: string
  anyLeasedOutSpace: string
  protectionClass: string
  additionalInterests: AdditionalInterest[]
  alarm: string
  noOfEmployees: string
  payroll: string
  officersInclExcl: string
  ownership: string
  businessType: 'renewal' | 'newBusiness' | string
  businessDescription: string
  buildings: Building[]
}