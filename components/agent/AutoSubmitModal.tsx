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
    totalFields += 4;
    
    // Corporation Name - required for both
    if (!normalizedInfo.corporationName?.trim()) {
      eErrors.push('Corporation name is required');
      gErrors.push('Applicant name is required');
    } else {
      completeFields++;
    }

    // Contact Name - required for both
    const { firstName, lastName } = parseName(normalizedInfo.contactName);
    if (!normalizedInfo.contactName?.trim()) {
      eErrors.push('Contact name is required');
      gErrors.push('Contact name is required');
    } else {
      if (!firstName?.trim() || !lastName?.trim()) {
        eErrors.push('Contact first and last name are required');
      }
      completeFields++;
    }

    // Address with Zip - required for both
    if (!normalizedInfo.address?.trim()) {
      eErrors.push('Address is required');
      gErrors.push('Mailing address is required');
    } else {
      const zipCode = extractZipCode(normalizedInfo.address);
      const city = extractCity(normalizedInfo.address);
      const state = extractState(normalizedInfo.address);
      
      if (!zipCode) {
        eErrors.push('Address must include a valid zip code');
        gErrors.push('Zip code is required');
      }
      if (!city) {
        gErrors.push('City is required in address');
      }
      if (!state) {
        gErrors.push('State is required in address');
      }
      if (zipCode) completeFields++;
    }

    // Phone - required for both
    if (!normalizedInfo.contactNumber?.trim()) {
      eErrors.push('Office phone is required');
      gErrors.push('Contact phone is required');
    } else {
      const phone = parsePhone(normalizedInfo.contactNumber);
      if (!phone.area || !phone.prefix || !phone.suffix) {
        gErrors.push('Phone must be a valid 10-digit number');
      }
      completeFields++;
    }

    // === GUARD-SPECIFIC REQUIRED FIELDS ===
    totalFields += 3;

    // Years in Business - required for Guard
    const yearsInBusiness = normalizedInfo.yearsExpInBusiness || normalizedInfo.yearsAtLocation;
    if (!yearsInBusiness) {
      gErrors.push('Years in business is required');
    } else {
      completeFields++;
    }

    // Description of Operations - required for Guard
    if (!normalizedInfo.operationDescription?.trim()) {
      gErrors.push('Description of operations is required');
    } else {
      completeFields++;
    }

    // Policy Inception Date - required for Guard
    if (!normalizedInfo.proposedEffectiveDate?.trim()) {
      gErrors.push('Policy inception date is required');
    } else {
      completeFields++;
    }

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

  const { firstName, lastName } = parseName(normalizedInfo.contactName);
  const feinRaw = normalizedInfo.fein || '';
  const feinValidation = validateFEIN(feinRaw);
  const fein = feinRaw ? (feinValidation.valid ? formatFEIN(feinRaw) : feinRaw) : 'N/A';
  const zipCode = extractZipCode(normalizedInfo.address || '');
  const city = extractCity(normalizedInfo.address || '');
  const state = extractState(normalizedInfo.address || '');
  const phone = parsePhone(normalizedInfo.contactNumber);
  const gasolineSales = (normalizedInfo.generalLiability as any)?.gasolineSalesYearly || null;
  const insideSales = (normalizedInfo.generalLiability as any)?.insideSalesYearly || null;
  const bi = (normalizedInfo.propertyCoverage as any)?.bi || null;
  const bpp = (normalizedInfo.propertyCoverage as any)?.bpp || null;
  const yearsInBusiness = normalizedInfo.yearsExpInBusiness || normalizedInfo.yearsAtLocation;

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
              <div>
                <label className="text-sm font-medium text-gray-600">Corporation Name *</label>
                <p className={`text-black font-medium ${!normalizedInfo.corporationName?.trim() ? 'text-red-600' : ''}`}>
                  {normalizedInfo.corporationName || 'Missing'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Contact Name *</label>
                <p className={`text-black ${!normalizedInfo.contactName?.trim() ? 'text-red-600' : ''}`}>
                  {normalizedInfo.contactName || 'Missing'}
                </p>
                {normalizedInfo.contactName && (
                  <p className="text-xs text-gray-500">First: {firstName || 'N/A'} | Last: {lastName || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Office Phone *</label>
                <p className={`text-black ${!normalizedInfo.contactNumber?.trim() ? 'text-red-600' : ''}`}>
                  {normalizedInfo.contactNumber || 'Missing'}
                </p>
                {phone.area && (
                  <p className="text-xs text-gray-500">({phone.area}) {phone.prefix}-{phone.suffix}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Address *</label>
                <p className={`text-black ${!normalizedInfo.address?.trim() ? 'text-red-600' : ''}`}>
                  {normalizedInfo.address || 'Missing'}
                </p>
                <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-500">
                  <span className={!city ? 'text-red-500' : ''}>City: {city || 'Missing'}</span>
                  <span className={!state ? 'text-red-500' : ''}>State: {state || 'Missing'}</span>
                  <span className={!zipCode ? 'text-red-500' : ''}>Zip: {zipCode || 'Missing'}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">FEIN ID <span className="text-gray-400 text-xs">(Optional)</span></label>
                <p className={`text-black ${!feinValidation.valid && fein !== 'N/A' ? 'text-red-600' : ''}`}>
                  {fein}
                </p>
                {!feinValidation.valid && fein !== 'N/A' && (
                  <p className="text-xs text-red-600 mt-1">Format: XX-XXXXXXX</p>
                )}
              </div>
            </div>

            {/* Guard-specific required fields */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-orange-600 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Guard-Specific Required Fields
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Years in Business *</label>
                  <p className={`text-black ${!yearsInBusiness ? 'text-red-600' : ''}`}>
                    {yearsInBusiness || 'Missing'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Policy Inception *</label>
                  <p className={`text-black ${!normalizedInfo.proposedEffectiveDate?.trim() ? 'text-red-600' : ''}`}>
                    {normalizedInfo.proposedEffectiveDate || 'Missing'}
                  </p>
                </div>
                <div className="md:col-span-1">
                  <label className="text-sm font-medium text-gray-600">Description of Operations *</label>
                  <p className={`text-black text-sm ${!normalizedInfo.operationDescription?.trim() ? 'text-red-600' : ''}`}>
                    {normalizedInfo.operationDescription?.substring(0, 100) || 'Missing'}
                    {(normalizedInfo.operationDescription?.length || 0) > 100 && '...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Optional Information (For Complete Automation)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Email Address</label>
                <p className="text-black">{normalizedInfo.contactEmail || 'N/A'}</p>
              </div>
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
                  {gasolineSales ? gasolineSales.toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Inside Sales (Annual)</label>
                <p className="text-black">
                  {insideSales ? `$${insideSales.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Combined Sales</label>
                <p className="text-black">
                  {(gasolineSales || insideSales) 
                    ? `$${((gasolineSales || 0) + (insideSales || 0)).toLocaleString()}` 
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
                  Submit to RPA
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
