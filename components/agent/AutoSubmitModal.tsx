'use client';

import { useState, useEffect } from 'react';
import { InsuredInformation } from '@/lib/types';
import { X, CheckCircle, AlertCircle, Rocket, Building2, Shield } from 'lucide-react';

// Carrier types
export type CarrierType = 'encova' | 'guard';

interface AutoSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedCarriers: CarrierType[]) => Promise<void>;
  insuredInfo: InsuredInformation | null;
  submitting?: boolean;
}

// Helper to parse name into firstName and lastName
function parseName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

// Helper to extract zip code from address
function extractZipCode(address: string | null | undefined): string {
  if (!address) return '';
  const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
  return zipMatch ? zipMatch[1] : '';
}

// Helper to extract city from address
function extractCity(address: string | null | undefined): string {
  if (!address) return '';
  // Try to find city before state abbreviation
  const match = address.match(/,\s*([^,]+?)\s*,?\s*[A-Z]{2}\s*\d{5}/i);
  if (match) return match[1].trim();
  // Fallback: split by commas and get second-to-last part
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Remove state and zip from the potential city
    const potentialCity = parts[parts.length - 2] || parts[parts.length - 1];
    return potentialCity.replace(/\s*[A-Z]{2}\s*\d{5}.*$/i, '').trim();
  }
  return '';
}

// Helper to extract state from address
function extractState(address: string | null | undefined): string {
  if (!address) return '';
  const stateAbbreviations = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  const addressUpper = address.toUpperCase();
  for (const state of stateAbbreviations) {
    const regex = new RegExp(`\\b${state}\\b`);
    if (regex.test(addressUpper)) {
      return state;
    }
  }
  return '';
}

// Helper to validate FEIN format (XX-XXXXXXX) - optional field
function validateFEIN(fein: string | null | undefined): { valid: boolean; error?: string } {
  if (!fein || !fein.trim()) {
    return { valid: true };
  }
  const cleaned = fein.trim().replace(/\s+/g, '');
  const feinPattern = /^\d{2}-\d{7}$/;
  if (!feinPattern.test(cleaned)) {
    return { 
      valid: false, 
      error: 'FEIN must be in format XX-XXXXXXX (e.g., 58-3247891)' 
    };
  }
  return { valid: true };
}

// Helper to format FEIN
function formatFEIN(fein: string | null | undefined): string {
  if (!fein) return '';
  const digits = fein.replace(/\D/g, '');
  if (digits.length !== 9) {
    return fein;
  }
  return `${digits.substring(0, 2)}-${digits.substring(2)}`;
}

// Helper to parse phone number into parts
function parsePhone(phone: string | null | undefined): { area: string; prefix: string; suffix: string } {
  if (!phone) return { area: '', prefix: '', suffix: '' };
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return {
      area: digits.substring(0, 3),
      prefix: digits.substring(3, 6),
      suffix: digits.substring(6, 10),
    };
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return {
      area: digits.substring(1, 4),
      prefix: digits.substring(4, 7),
      suffix: digits.substring(7, 11),
    };
  }
  return { area: '', prefix: '', suffix: '' };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

// Validate phone number - must be 10 digits
function validatePhone(phone: string | null | undefined): { valid: boolean; error?: string; formatted?: string } {
  if (!phone || !phone.trim()) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle 11 digits starting with 1 (US country code)
  const normalizedDigits = digits.length === 11 && digits.startsWith('1') 
    ? digits.substring(1) 
    : digits;
  
  if (normalizedDigits.length !== 10) {
    return { 
      valid: false, 
      error: `Phone must be 10 digits (got ${normalizedDigits.length})` 
    };
  }
  
  // Check for invalid patterns (all same digit, sequential)
  if (/^(\d)\1{9}$/.test(normalizedDigits)) {
    return { valid: false, error: 'Invalid phone number (all same digits)' };
  }
  
  // Area code cannot start with 0 or 1
  if (normalizedDigits[0] === '0' || normalizedDigits[0] === '1') {
    return { valid: false, error: 'Invalid area code (cannot start with 0 or 1)' };
  }
  
  // Format as (XXX) XXX-XXXX
  const formatted = `(${normalizedDigits.substring(0, 3)}) ${normalizedDigits.substring(3, 6)}-${normalizedDigits.substring(6)}`;
  
  return { valid: true, formatted };
}

// Validate email - RFC 5322 compliant (simplified)
function validateEmail(email: string | null | undefined): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic structure check: something@something.something
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format (must be like name@domain.com)' };
  }
  
  // More detailed validation
  const [localPart, domain] = trimmedEmail.split('@');
  
  // Local part validation
  if (localPart.length === 0 || localPart.length > 64) {
    return { valid: false, error: 'Invalid email: local part too short or long' };
  }
  
  // Cannot start or end with dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, error: 'Invalid email: cannot start or end with dot' };
  }
  
  // No consecutive dots
  if (localPart.includes('..')) {
    return { valid: false, error: 'Invalid email: consecutive dots not allowed' };
  }
  
  // Domain validation
  if (domain.length === 0 || domain.length > 255) {
    return { valid: false, error: 'Invalid email: domain too short or long' };
  }
  
  // Domain must have at least one dot
  if (!domain.includes('.')) {
    return { valid: false, error: 'Invalid email: domain must include extension' };
  }
  
  // TLD must be at least 2 characters
  const tld = domain.split('.').pop() || '';
  if (tld.length < 2) {
    return { valid: false, error: 'Invalid email: domain extension too short' };
  }
  
  // TLD must be letters only
  if (!/^[a-z]+$/.test(tld)) {
    return { valid: false, error: 'Invalid email: domain extension must be letters' };
  }
  
  return { valid: true };
}

// Validate zip code - 5 digits or 5+4 format
function validateZipCode(zip: string | null | undefined): { valid: boolean; error?: string } {
  if (!zip || !zip.trim()) {
    return { valid: false, error: 'Zip code is required' };
  }
  
  const zipPattern = /^\d{5}(-\d{4})?$/;
  if (!zipPattern.test(zip.trim())) {
    return { valid: false, error: 'Zip must be 5 digits (XXXXX) or 5+4 (XXXXX-XXXX)' };
  }
  
  return { valid: true };
}

// Validate years in business - reasonable range
function validateYearsInBusiness(years: number | string | null | undefined): { valid: boolean; error?: string } {
  if (years === null || years === undefined || years === '') {
    return { valid: false, error: 'Years in business is required' };
  }
  
  const num = typeof years === 'string' ? parseInt(years, 10) : years;
  
  if (isNaN(num)) {
    return { valid: false, error: 'Years in business must be a number' };
  }
  
  if (num < 0 || num > 150) {
    return { valid: false, error: 'Years in business must be between 0 and 150' };
  }
  
  return { valid: true };
}

// Validate corporation name
function validateCorporationName(name: string | null | undefined): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Corporation name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: 'Corporation name must be at least 2 characters' };
  }
  
  if (name.trim().length > 200) {
    return { valid: false, error: 'Corporation name is too long (max 200 characters)' };
  }
  
  return { valid: true };
}

// Validate contact name - must have first and last name
function validateContactName(name: string | null | undefined): { valid: boolean; error?: string; firstName?: string; lastName?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Contact name is required' };
  }
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length < 2) {
    return { valid: false, error: 'Contact must have first and last name' };
  }
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  if (firstName.length < 1) {
    return { valid: false, error: 'First name is required' };
  }
  
  if (lastName.length < 1) {
    return { valid: false, error: 'Last name is required' };
  }
  
  return { valid: true, firstName, lastName };
}

// Validate description - minimum length
function validateDescription(desc: string | null | undefined): { valid: boolean; error?: string } {
  if (!desc || !desc.trim()) {
    return { valid: false, error: 'Description of operations is required' };
  }
  
  if (desc.trim().length < 10) {
    return { valid: false, error: 'Description must be at least 10 characters' };
  }
  
  return { valid: true };
}

// Helper to normalize insured info (handle both camelCase and snake_case)
function normalizeInsuredInfo(data: any): InsuredInformation | null {
  if (!data) return null;
  
  if (data.corporationName) return data;
  
  return {
    id: data.id,
    uniqueIdentifier: data.unique_identifier || data.uniqueIdentifier,
    ownershipType: data.ownership_type || data.ownershipType,
    corporationName: data.corporation_name || data.corporationName,
    contactName: data.contact_name || data.contactName,
    contactNumber: data.contact_number || data.contactNumber,
    contactEmail: data.contact_email || data.contactEmail,
    leadSource: data.lead_source || data.leadSource,
    proposedEffectiveDate: data.proposed_effective_date || data.proposedEffectiveDate,
    priorCarrier: data.prior_carrier || data.priorCarrier,
    targetPremium: data.target_premium ? parseFloat(data.target_premium) : (data.targetPremium || null),
    applicantIs: data.applicant_is || data.applicantIs,
    operationDescription: data.operation_description || data.operationDescription,
    dba: data.dba,
    address: data.address,
    hoursOfOperation: data.hours_of_operation || data.hoursOfOperation,
    noOfMPOs: data.no_of_mpos || data.noOfMPOs,
    constructionType: data.construction_type || data.constructionType,
    yearsExpInBusiness: data.years_exp_in_business || data.yearsExpInBusiness,
    yearsAtLocation: data.years_at_location || data.yearsAtLocation,
    yearBuilt: data.year_built || data.yearBuilt,
    yearLatestUpdate: data.year_latest_update || data.yearLatestUpdate,
    totalSqFootage: data.total_sq_footage || data.totalSqFootage,
    leasedOutSpace: data.leased_out_space || data.leasedOutSpace,
    protectionClass: data.protection_class || data.protectionClass,
    additionalInsured: data.additional_insured || data.additionalInsured,
    fein: data.fein || data.fein_id || data.federal_employer_id || data.feinId,
    alarmInfo: data.alarm_info || data.alarmInfo,
    fireInfo: data.fire_info || data.fireInfo,
    propertyCoverage: data.property_coverage || data.propertyCoverage,
    generalLiability: data.general_liability || data.generalLiability,
    workersCompensation: data.workers_compensation || data.workersCompensation,
    source: data.source,
    eformSubmissionId: data.eform_submission_id || data.eformSubmissionId,
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
  };
}

export default function AutoSubmitModal({
  isOpen,
  onClose,
  onConfirm,
  insuredInfo,
  submitting = false,
}: AutoSubmitModalProps) {
  const [selectedCarriers, setSelectedCarriers] = useState<CarrierType[]>(['encova', 'guard']);
  const [encovaErrors, setEncovaErrors] = useState<string[]>([]);
  const [guardErrors, setGuardErrors] = useState<string[]>([]);
  const [completeness, setCompleteness] = useState(0);

  const normalizedInfo = normalizeInsuredInfo(insuredInfo);

  useEffect(() => {
    if (isOpen && normalizedInfo) {
      validateAndCalculateCompleteness();
    }
  }, [isOpen, normalizedInfo]);

  function validateAndCalculateCompleteness() {
    if (!normalizedInfo) {
      setEncovaErrors(['Insured information is not available']);
      setGuardErrors(['Insured information is not available']);
      setCompleteness(0);
      return;
    }

    const eErrors: string[] = [];
    const gErrors: string[] = [];
    let completeFields = 0;
    let totalFields = 0;

    // === SHARED REQUIRED FIELDS ===
    totalFields += 5; // corp name, contact name, address, phone, email

    // 1. Corporation Name - required for both
    const corpValidation = validateCorporationName(normalizedInfo.corporationName);
    if (!corpValidation.valid) {
      eErrors.push(corpValidation.error || 'Corporation name is required');
      gErrors.push(corpValidation.error || 'Applicant name is required');
    } else {
      completeFields++;
    }

    // 2. Contact Name - required for both (must have first & last name)
    const contactValidation = validateContactName(normalizedInfo.contactName);
    if (!contactValidation.valid) {
      eErrors.push(contactValidation.error || 'Contact name is required');
      gErrors.push(contactValidation.error || 'Contact name is required');
    } else {
      completeFields++;
    }

    // 3. Phone Number - required for both (must be valid 10-digit)
    const phoneValidation = validatePhone(normalizedInfo.contactNumber);
    if (!phoneValidation.valid) {
      eErrors.push(phoneValidation.error || 'Valid phone number is required');
      gErrors.push(phoneValidation.error || 'Valid phone number is required');
    } else {
      completeFields++;
    }

    // 4. Email - required and must be valid format
    const emailValidation = validateEmail(normalizedInfo.contactEmail);
    if (!emailValidation.valid) {
      eErrors.push(emailValidation.error || 'Valid email is required');
      gErrors.push(emailValidation.error || 'Valid email is required');
    } else {
      completeFields++;
    }

    // 5. Address with Zip, City, State - required for both
    if (!normalizedInfo.address?.trim()) {
      eErrors.push('Address is required');
      gErrors.push('Mailing address is required');
    } else {
      const zipCode = extractZipCode(normalizedInfo.address);
      const city = extractCity(normalizedInfo.address);
      const state = extractState(normalizedInfo.address);
      
      // Validate zip code format
      const zipValidation = validateZipCode(zipCode);
      if (!zipValidation.valid) {
        eErrors.push(zipValidation.error || 'Valid zip code is required');
        gErrors.push(zipValidation.error || 'Valid zip code is required');
      }
      if (!city) {
        gErrors.push('City is required in address');
      }
      if (!state) {
        gErrors.push('State is required in address');
      }
      if (zipCode && zipValidation.valid) completeFields++;
    }

    // === GUARD-SPECIFIC REQUIRED FIELDS ===
    totalFields += 2;

    // Years in Business - required for Guard
    const yearsInBusiness = normalizedInfo.yearsExpInBusiness || normalizedInfo.yearsAtLocation;
    const yearsValidation = validateYearsInBusiness(yearsInBusiness);
    if (!yearsValidation.valid) {
      gErrors.push(yearsValidation.error || 'Years in business is required');
    } else {
      completeFields++;
    }

    // Description of Operations - required for Guard
    const descValidation = validateDescription(normalizedInfo.operationDescription);
    if (!descValidation.valid) {
      gErrors.push(descValidation.error || 'Description of operations is required');
    } else {
      completeFields++;
    }

    // Policy Inception Date - NOT required (auto-set by Guard automation)

    // === ENCOVA-SPECIFIC VALIDATION ===
    // FEIN - optional, but validate format if provided
    const fein = normalizedInfo.fein || '';
    const feinValidation = validateFEIN(fein);
    if (!feinValidation.valid) {
      eErrors.push(feinValidation.error || 'FEIN format is invalid');
    }

    // === OPTIONAL FIELDS (for completeness) ===
    totalFields += 10;
    if (normalizedInfo.contactEmail?.trim()) completeFields++;
    if (normalizedInfo.dba?.trim()) completeFields++;
    if (normalizedInfo.ownershipType?.trim()) completeFields++;
    if ((normalizedInfo.generalLiability as any)?.gasolineSalesYearly) completeFields++;
    if ((normalizedInfo.generalLiability as any)?.insideSalesYearly) completeFields++;
    if (normalizedInfo.constructionType?.trim()) completeFields++;
    if (normalizedInfo.totalSqFootage) completeFields++;
    if (normalizedInfo.yearBuilt) completeFields++;
    if ((normalizedInfo.propertyCoverage as any)?.bi) completeFields++;
    if ((normalizedInfo.propertyCoverage as any)?.bpp) completeFields++;

    setEncovaErrors(eErrors);
    setGuardErrors(gErrors);
    setCompleteness(Math.round((completeFields / totalFields) * 100));
  }

  const toggleCarrier = (carrier: CarrierType) => {
    setSelectedCarriers(prev => {
      if (prev.includes(carrier)) {
        return prev.filter(c => c !== carrier);
      }
      return [...prev, carrier];
    });
  };

  if (!isOpen) return null;

  if (!normalizedInfo) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-black mb-4">Error</h2>
          <p className="text-gray-600 mb-4">Insured information is not available.</p>
          <button onClick={onClose} className="btn-primary w-full">Close</button>
        </div>
      </div>
    );
  }

  // Validation results for display
  const corpValidation = validateCorporationName(normalizedInfo.corporationName);
  const contactValidation = validateContactName(normalizedInfo.contactName);
  const phoneValidation = validatePhone(normalizedInfo.contactNumber);
  const emailValidation = validateEmail(normalizedInfo.contactEmail);
  const feinRaw = normalizedInfo.fein || '';
  const feinValidation = validateFEIN(feinRaw);
  const fein = feinRaw ? (feinValidation.valid ? formatFEIN(feinRaw) : feinRaw) : 'N/A';
  const zipCode = extractZipCode(normalizedInfo.address || '');
  const city = extractCity(normalizedInfo.address || '');
  const state = extractState(normalizedInfo.address || '');
  const zipValidation = validateZipCode(zipCode);
  const phone = parsePhone(normalizedInfo.contactNumber);
  const gasolineSales = (normalizedInfo.generalLiability as any)?.gasolineSalesYearly || null;
  const insideSales = (normalizedInfo.generalLiability as any)?.insideSalesYearly || null;
  const bi = (normalizedInfo.propertyCoverage as any)?.bi || null;
  const bpp = (normalizedInfo.propertyCoverage as any)?.bpp || null;
  const yearsInBusiness = normalizedInfo.yearsExpInBusiness || normalizedInfo.yearsAtLocation;
  const yearsValidation = validateYearsInBusiness(yearsInBusiness);
  const descValidation = validateDescription(normalizedInfo.operationDescription);
  
  // Get first/last name from validation result
  const { firstName, lastName } = contactValidation.valid 
    ? { firstName: contactValidation.firstName, lastName: contactValidation.lastName }
    : parseName(normalizedInfo.contactName);

  // Check if any selected carrier has errors
  const hasEncovaErrors = selectedCarriers.includes('encova') && encovaErrors.length > 0;
  const hasGuardErrors = selectedCarriers.includes('guard') && guardErrors.length > 0;
  const isValid = selectedCarriers.length > 0 && !hasEncovaErrors && !hasGuardErrors;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Rocket className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Confirm Auto Submit</h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Carrier Selection */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Select Carriers to Submit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Encova Card */}
              <label 
                className={`relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCarriers.includes('encova')
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCarriers.includes('encova')}
                  onChange={() => toggleCarrier('encova')}
                  disabled={submitting}
                  className="mt-1 h-5 w-5 text-blue-600 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-black">Encova</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Account creation + Quote automation
                  </p>
                  {selectedCarriers.includes('encova') && encovaErrors.length > 0 && (
                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {encovaErrors.length} validation error{encovaErrors.length > 1 ? 's' : ''}
                    </div>
                  )}
                  {selectedCarriers.includes('encova') && encovaErrors.length === 0 && (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Ready to submit
                    </div>
                  )}
                </div>
              </label>

              {/* Guard Card */}
              <label 
                className={`relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCarriers.includes('guard')
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCarriers.includes('guard')}
                  onChange={() => toggleCarrier('guard')}
                  disabled={submitting}
                  className="mt-1 h-5 w-5 text-orange-600 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-black">Guard (BH)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Berkshire Hathaway GUARD
                  </p>
                  {selectedCarriers.includes('guard') && guardErrors.length > 0 && (
                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {guardErrors.length} validation error{guardErrors.length > 1 ? 's' : ''}
                    </div>
                  )}
                  {selectedCarriers.includes('guard') && guardErrors.length === 0 && (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Ready to submit
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Validation Errors */}
          {(hasEncovaErrors || hasGuardErrors) && (
            <div className="space-y-3">
              {hasEncovaErrors && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-800 mb-2">Encova - Required Fields Missing:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                        {encovaErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {hasGuardErrors && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-800 mb-2">Guard - Required Fields Missing:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
                        {guardErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completeness Indicator */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Automation Completeness</span>
              <span className="text-lg font-bold text-blue-600">{completeness}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="text-xs text-blue-700 mt-2">
              {completeness < 50
                ? 'Low completeness - automation may require manual intervention'
                : completeness < 80
                ? 'Moderate completeness - some fields may need manual entry'
                : 'High completeness - automation should run smoothly'}
            </p>
          </div>

          {/* Required Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Required Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Corporation Name */}
              <div>
                <label className="text-sm font-medium text-gray-600">Corporation Name *</label>
                <p className={`text-black font-medium ${!corpValidation.valid ? 'text-red-600' : ''}`}>
                  {normalizedInfo.corporationName || 'Missing'}
                </p>
                {!corpValidation.valid && corpValidation.error && (
                  <p className="text-xs text-red-600 mt-1">{corpValidation.error}</p>
                )}
              </div>

              {/* Contact Name */}
              <div>
                <label className="text-sm font-medium text-gray-600">Contact Name *</label>
                <p className={`text-black ${!contactValidation.valid ? 'text-red-600' : ''}`}>
                  {normalizedInfo.contactName || 'Missing'}
                </p>
                {contactValidation.valid ? (
                  <p className="text-xs text-green-600">✓ First: {firstName} | Last: {lastName}</p>
                ) : (
                  <p className="text-xs text-red-600 mt-1">{contactValidation.error}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-sm font-medium text-gray-600">Office Phone *</label>
                <p className={`text-black ${!phoneValidation.valid ? 'text-red-600' : ''}`}>
                  {normalizedInfo.contactNumber || 'Missing'}
                </p>
                {phoneValidation.valid ? (
                  <p className="text-xs text-green-600">✓ {phoneValidation.formatted}</p>
                ) : (
                  <p className="text-xs text-red-600 mt-1">{phoneValidation.error}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-600">Email Address *</label>
                <p className={`text-black ${!emailValidation.valid ? 'text-red-600' : ''}`}>
                  {normalizedInfo.contactEmail || 'Missing'}
                </p>
                {emailValidation.valid ? (
                  <p className="text-xs text-green-600">✓ Valid email format</p>
                ) : (
                  <p className="text-xs text-red-600 mt-1">{emailValidation.error}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Address *</label>
                <p className={`text-black ${!normalizedInfo.address?.trim() ? 'text-red-600' : ''}`}>
                  {normalizedInfo.address || 'Missing'}
                </p>
                <div className="flex flex-wrap gap-4 mt-1 text-xs">
                  <span className={!city ? 'text-red-500' : 'text-green-600'}>
                    {city ? `✓ City: ${city}` : '✗ City: Missing'}
                  </span>
                  <span className={!state ? 'text-red-500' : 'text-green-600'}>
                    {state ? `✓ State: ${state}` : '✗ State: Missing'}
                  </span>
                  <span className={!zipValidation.valid ? 'text-red-500' : 'text-green-600'}>
                    {zipValidation.valid ? `✓ Zip: ${zipCode}` : `✗ Zip: ${zipValidation.error || 'Missing'}`}
                  </span>
                </div>
              </div>

              {/* FEIN */}
              <div>
                <label className="text-sm font-medium text-gray-600">FEIN ID <span className="text-gray-400 text-xs">(Optional)</span></label>
                <p className={`text-black ${!feinValidation.valid && fein !== 'N/A' ? 'text-red-600' : ''}`}>
                  {fein}
                </p>
                {!feinValidation.valid && fein !== 'N/A' && (
                  <p className="text-xs text-red-600 mt-1">{feinValidation.error}</p>
                )}
              </div>
            </div>

            {/* Guard-specific required fields */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-orange-600 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Guard-Specific Required Fields
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Years in Business *</label>
                  <p className={`text-black ${!yearsValidation.valid ? 'text-red-600' : ''}`}>
                    {yearsInBusiness || 'Missing'}
                  </p>
                  {!yearsValidation.valid && (
                    <p className="text-xs text-red-600 mt-1">{yearsValidation.error}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Description of Operations *</label>
                  <p className={`text-black text-sm ${!descValidation.valid ? 'text-red-600' : ''}`}>
                    {normalizedInfo.operationDescription?.substring(0, 100) || 'Missing'}
                    {(normalizedInfo.operationDescription?.length || 0) > 100 && '...'}
                  </p>
                  {!descValidation.valid && (
                    <p className="text-xs text-red-600 mt-1">{descValidation.error}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Policy inception date is auto-set by Guard automation
              </p>
            </div>
          </div>

          {/* Optional Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Optional Information (For Complete Automation)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">DBA</label>
                <p className="text-black">{normalizedInfo.dba || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Legal Entity / Org Type</label>
                <p className="text-black">{normalizedInfo.ownershipType || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Year Built</label>
                <p className="text-black">{normalizedInfo.yearBuilt || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Square Footage</label>
                <p className="text-black">{normalizedInfo.totalSqFootage?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">No. of MPDs (Pumps)</label>
                <p className="text-black">{normalizedInfo.noOfMPOs || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Gasoline Gallons (Annual)</label>
                <p className="text-black">
                  {gasolineSales ? Number(gasolineSales).toLocaleString() : 'N/A'} gal
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Inside Sales (Annual)</label>
                <p className="text-black">
                  {insideSales ? `$${Number(insideSales).toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Combined Sales (excl. gallons)</label>
                <p className="text-black">
                  {insideSales 
                    ? `$${Number(insideSales).toLocaleString()}` 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="text-sm text-gray-600">
            {selectedCarriers.length === 0 
              ? 'Select at least one carrier'
              : `Submitting to: ${selectedCarriers.map(c => c === 'encova' ? 'Encova' : 'Guard').join(' & ')}`
            }
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedCarriers)}
              disabled={!isValid || submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {submitting ? (
              <>
                <span className="animate-spin">⏳</span>
                Submitting...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Submit
              </>
            )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
