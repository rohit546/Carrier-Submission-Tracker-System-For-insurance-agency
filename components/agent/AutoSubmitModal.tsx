'use client';

import { useState, useEffect } from 'react';
import { InsuredInformation } from '@/lib/types';
import { X, CheckCircle, AlertCircle, Rocket } from 'lucide-react';

interface AutoSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  insuredInfo: InsuredInformation | null;
  submitting?: boolean;
}

// Construction type options - user can provide these
const CONSTRUCTION_TYPES = [
  'Frame',
  'Masonry',
  'Fire Resistive',
  'Non-Combustible',
  'Heavy Timber',
  'Other',
];

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

// Helper to validate FEIN format (XX-XXXXXXX)
function validateFEIN(fein: string | null | undefined): { valid: boolean; error?: string } {
  if (!fein || !fein.trim()) {
    return { valid: false, error: 'FEIN is required' };
  }

  // Remove any spaces
  const cleaned = fein.trim().replace(/\s+/g, '');
  
  // Check format: XX-XXXXXXX (2 digits, hyphen, 7 digits)
  const feinPattern = /^\d{2}-\d{7}$/;
  
  if (!feinPattern.test(cleaned)) {
    return { 
      valid: false, 
      error: 'FEIN must be in format XX-XXXXXXX (e.g., 58-3247891)' 
    };
  }

  return { valid: true };
}

// Helper to format FEIN (add hyphen if missing, ensure correct format)
function formatFEIN(fein: string | null | undefined): string {
  if (!fein) return '';
  
  // Remove all non-digit characters
  const digits = fein.replace(/\D/g, '');
  
  // Must be exactly 9 digits
  if (digits.length !== 9) {
    return fein; // Return original if invalid length
  }
  
  // Format as XX-XXXXXXX
  return `${digits.substring(0, 2)}-${digits.substring(2)}`;
}

// Helper to normalize insured info (handle both camelCase and snake_case)
function normalizeInsuredInfo(data: any): InsuredInformation | null {
  if (!data) return null;
  
  // If already normalized (has camelCase), return as is
  if (data.corporationName) return data;
  
  // Convert snake_case to camelCase
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [completeness, setCompleteness] = useState(0);

  // Normalize the insured info to handle both formats
  const normalizedInfo = normalizeInsuredInfo(insuredInfo);

  useEffect(() => {
    if (isOpen && normalizedInfo) {
      validateAndCalculateCompleteness();
    }
  }, [isOpen, normalizedInfo]);

  function validateAndCalculateCompleteness() {
    if (!normalizedInfo) {
      setValidationErrors(['Insured information is not available']);
      setCompleteness(0);
      return;
    }

    const errors: string[] = [];
    let completeFields = 0;
    let totalFields = 0;

    // Required fields
    totalFields += 5;
    if (!normalizedInfo.corporationName?.trim()) {
      errors.push('Corporation name is required');
    } else {
      completeFields++;
    }

    const { firstName, lastName } = parseName(normalizedInfo.contactName);
    if (!firstName?.trim() || !lastName?.trim()) {
      errors.push('Contact first and last name are required');
    } else {
      completeFields++;
    }

    // FEIN - check if exists and validate format
    const fein = normalizedInfo.fein || '';
    const feinValidation = validateFEIN(fein);
    if (!feinValidation.valid) {
      errors.push(feinValidation.error || 'FEIN ID is required');
    } else {
      completeFields++;
    }

    if (!normalizedInfo.address?.trim()) {
      errors.push('Address is required');
    } else {
      const zipCode = extractZipCode(normalizedInfo.address);
      if (!zipCode) {
        errors.push('Address must include a valid zip code');
      } else {
        completeFields++;
      }
    }

    if (!normalizedInfo.contactNumber?.trim()) {
      errors.push('Office phone is required');
    } else {
      completeFields++;
    }

    // Optional fields (for completeness calculation)
    totalFields += 12;
    if (normalizedInfo.contactEmail?.trim()) completeFields++;
    if (normalizedInfo.dba?.trim()) completeFields++;
    if (normalizedInfo.ownershipType?.trim()) completeFields++;
    if (normalizedInfo.yearsAtLocation) completeFields++;
    if ((normalizedInfo.generalLiability as any)?.gasolineSalesYearly) completeFields++;
    if ((normalizedInfo.generalLiability as any)?.insideSalesYearly) completeFields++;
    if (normalizedInfo.constructionType?.trim()) completeFields++;
    // No of stories - might not be in schema
    if ((normalizedInfo as any)?.noOfStories) completeFields++;
    if (normalizedInfo.totalSqFootage) completeFields++;
    if (normalizedInfo.yearBuilt) completeFields++;
    if ((normalizedInfo.propertyCoverage as any)?.bi) completeFields++;
    if ((normalizedInfo.propertyCoverage as any)?.bpp) completeFields++;

    setValidationErrors(errors);
    setCompleteness(Math.round((completeFields / totalFields) * 100));
  }

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
  const gasolineSales = (normalizedInfo.generalLiability as any)?.gasolineSalesYearly || null;
  const insideSales = (normalizedInfo.generalLiability as any)?.insideSalesYearly || null;
  const bi = (normalizedInfo.propertyCoverage as any)?.bi || null;
  const bpp = (normalizedInfo.propertyCoverage as any)?.bpp || null;
  const noOfStories = (normalizedInfo as any)?.noOfStories || 'N/A';

  const isValid = validationErrors.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
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
          {/* Validation Status */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-2">Required Fields Missing:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Corporation Name</label>
                <p className={`text-black font-medium ${!normalizedInfo.corporationName?.trim() ? 'text-red-600' : ''}`}>
                  {normalizedInfo.corporationName || 'Missing'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Contact First Name</label>
                <p className={`text-black ${!firstName?.trim() ? 'text-red-600' : ''}`}>
                  {firstName || 'Missing'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Contact Last Name</label>
                <p className={`text-black ${!lastName?.trim() ? 'text-red-600' : ''}`}>
                  {lastName || 'Missing'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">FEIN ID</label>
                <p className={`text-black ${!feinValidation.valid || fein === 'N/A' ? 'text-red-600' : ''}`}>
                  {fein}
                </p>
                {!feinValidation.valid && fein !== 'N/A' && (
                  <p className="text-xs text-red-600 mt-1">
                    Format: XX-XXXXXXX (e.g., 58-3247891)
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className={`text-black ${!normalizedInfo.address?.trim() ? 'text-red-600' : ''}`}>
                  {normalizedInfo.address || 'Missing'}
                </p>
                {zipCode && (
                  <p className="text-xs text-gray-500 mt-1">Zip Code: {zipCode}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Office Phone</label>
                <p className={`text-black ${!normalizedInfo.contactNumber?.trim() ? 'text-red-600' : ''}`}>
                  {normalizedInfo.contactNumber || 'Missing'}
                </p>
              </div>
            </div>
          </div>

          {/* Optional Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Optional Information (For Complete Automation)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Email Address</label>
                <p className="text-black">{normalizedInfo.contactEmail || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">DBA</label>
                <p className="text-black">{normalizedInfo.dba || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Org Type</label>
                <p className="text-black">{normalizedInfo.ownershipType || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Years at Location</label>
                <p className="text-black">{normalizedInfo.yearsAtLocation || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Gasoline Gallon Annual</label>
                <p className="text-black">
                  {gasolineSales ? `$${gasolineSales.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Inside Sales (Annual)</label>
                <p className="text-black">
                  {insideSales ? `$${insideSales.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Construction Type</label>
                <p className="text-black">{normalizedInfo.constructionType || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">No. of Stories</label>
                <p className="text-black">{noOfStories}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Square Footage</label>
                <p className="text-black">{normalizedInfo.totalSqFootage?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Year Built</label>
                <p className="text-black">{normalizedInfo.yearBuilt || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">BI (Business Income)</label>
                <p className="text-black">
                  {bi ? `$${bi.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">BPP (Business Personal Property)</label>
                <p className="text-black">
                  {bpp ? `$${bpp.toLocaleString()}` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
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
  );
}

