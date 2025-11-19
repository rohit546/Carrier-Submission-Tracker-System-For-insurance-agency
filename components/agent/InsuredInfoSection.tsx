'use client';

import { InsuredInformation } from '@/lib/types';
import { Building2, User, Mail, Phone, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';

// Helper function to format dates consistently (prevents hydration errors)
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Format as MM/DD/YYYY consistently (US format)
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (e) {
    return 'N/A';
  }
}

interface InsuredInfoSectionProps {
  insuredInfo: InsuredInformation | null;
  isEditable?: boolean;
  onUpdate?: (data: Partial<InsuredInformation>) => void;
}

// Helper function to normalize insured info (handle both camelCase and snake_case)
function normalizeInsuredInfo(data: any): InsuredInformation {
  if (!data) return data;
  
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

export default function InsuredInfoSection({ insuredInfo, isEditable = false, onUpdate }: InsuredInfoSectionProps) {
  if (!insuredInfo) {
    return null;
  }

  // Normalize the data to handle both formats
  const normalizedInfo = normalizeInsuredInfo(insuredInfo);
  
  // Debug: Log what we have
  console.log('📋 Insured Info Data:', {
    hasCorporationName: !!normalizedInfo.corporationName,
    hasContactName: !!normalizedInfo.contactName,
    hasContactEmail: !!normalizedInfo.contactEmail,
    hasAddress: !!normalizedInfo.address,
    corporationName: normalizedInfo.corporationName,
    contactName: normalizedInfo.contactName,
    contactEmail: normalizedInfo.contactEmail,
    address: normalizedInfo.address,
  });

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="w-6 h-6 text-black" />
        <h2 className="text-2xl font-bold text-black">Insured Information</h2>
        {normalizedInfo.source === 'eform' && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">From Eform</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Basic Information</h3>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Corporation Name</label>
            <p className="text-black font-medium">{normalizedInfo.corporationName || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">DBA (Doing Business As)</label>
            <p className="text-black">{normalizedInfo.dba || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Ownership Type</label>
            <p className="text-black">{normalizedInfo.ownershipType || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Applicant Type</label>
            <p className="text-black">{normalizedInfo.applicantIs || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Operation Description</label>
            <p className="text-black text-sm">{normalizedInfo.operationDescription || 'N/A'}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Contact Information</h3>
          
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <label className="text-sm font-medium text-gray-600">Contact Name</label>
              <p className="text-black">{normalizedInfo.contactName || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <label className="text-sm font-medium text-gray-600">Contact Number</label>
              <p className="text-black">{normalizedInfo.contactNumber || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <label className="text-sm font-medium text-gray-600">Contact Email</label>
              <p className="text-black">{normalizedInfo.contactEmail || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <label className="text-sm font-medium text-gray-600">Address</label>
              <p className="text-black">{normalizedInfo.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Property Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Hours of Operation</label>
              <p className="text-black text-sm">{normalizedInfo.hoursOfOperation || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">No. of MPOs</label>
              <p className="text-black text-sm">{normalizedInfo.noOfMPOs || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Construction Type</label>
              <p className="text-black text-sm">{normalizedInfo.constructionType || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Total Sq. Footage</label>
              <p className="text-black text-sm">{normalizedInfo.totalSqFootage || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Year Built</label>
              <p className="text-black text-sm">{normalizedInfo.yearBuilt || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Year of Latest Update</label>
              <p className="text-black text-sm">{normalizedInfo.yearLatestUpdate || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Years Exp. in Business</label>
              <p className="text-black text-sm">{normalizedInfo.yearsExpInBusiness || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Years at This Location</label>
              <p className="text-black text-sm">{normalizedInfo.yearsAtLocation || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Protection Class</label>
              <p className="text-black text-sm">{normalizedInfo.protectionClass || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Leased Out Space</label>
              <p className="text-black text-sm">{normalizedInfo.leasedOutSpace || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Additional Information</h3>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Lead Source</label>
            <p className="text-black text-sm">{normalizedInfo.leadSource || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Prior Carrier</label>
            <p className="text-black text-sm">{normalizedInfo.priorCarrier || 'N/A'}</p>
          </div>

          {normalizedInfo.targetPremium && (
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <label className="text-sm font-medium text-gray-600">Target Premium</label>
                <p className="text-black">${normalizedInfo.targetPremium.toLocaleString()}</p>
              </div>
            </div>
          )}

          {normalizedInfo.proposedEffectiveDate && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <label className="text-sm font-medium text-gray-600">Proposed Effective Date</label>
                <p className="text-black text-sm">
                  {formatDate(normalizedInfo.proposedEffectiveDate)}
                </p>
              </div>
            </div>
          )}

          {normalizedInfo.additionalInsured && (
            <div>
              <label className="text-sm font-medium text-gray-600">Additional Insured</label>
              <p className="text-black text-sm">{normalizedInfo.additionalInsured}</p>
            </div>
          )}

          {/* Security Systems */}
          {(normalizedInfo.alarmInfo || normalizedInfo.fireInfo) && (
            <div>
              <label className="text-sm font-medium text-gray-600">Security Systems</label>
              <div className="mt-2 space-y-1">
                {normalizedInfo.alarmInfo && Object.keys(normalizedInfo.alarmInfo).length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">Alarm: </span>
                    <span className="text-xs text-black">
                      {Object.entries(normalizedInfo.alarmInfo)
                        .filter(([_, v]) => v === true)
                        .map(([k]) => k)
                        .join(', ')}
                    </span>
                  </div>
                )}
                {normalizedInfo.fireInfo && Object.keys(normalizedInfo.fireInfo).length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">Fire: </span>
                    <span className="text-xs text-black">
                      {Object.entries(normalizedInfo.fireInfo)
                        .filter(([_, v]) => v === true)
                        .map(([k]) => k)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coverage Information (Collapsible) */}
      {(normalizedInfo.propertyCoverage || normalizedInfo.generalLiability || normalizedInfo.workersCompensation) && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <details className="group">
            <summary className="cursor-pointer text-lg font-semibold text-black flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Coverage Details
            </summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              {normalizedInfo.propertyCoverage && Object.keys(normalizedInfo.propertyCoverage).length > 0 && (
                <div>
                  <h4 className="font-semibold text-black mb-2">Property Coverage</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(normalizedInfo.propertyCoverage).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="text-black">
                          {typeof value === 'number' ? `$${value.toLocaleString()}` : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {normalizedInfo.generalLiability && Object.keys(normalizedInfo.generalLiability).length > 0 && (
                <div>
                  <h4 className="font-semibold text-black mb-2">General Liability</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(normalizedInfo.generalLiability).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-600">{key}:</span>
                        {typeof value === 'object' && value !== null ? (
                          <div className="ml-4">
                            {(value as any).monthly && <div>Monthly: ${(value as any).monthly.toLocaleString()}</div>}
                            {(value as any).yearly && <div>Yearly: ${(value as any).yearly.toLocaleString()}</div>}
                          </div>
                        ) : (
                          <span className="text-black ml-2">{String(value)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {normalizedInfo.workersCompensation && Object.keys(normalizedInfo.workersCompensation).length > 0 && (
                <div>
                  <h4 className="font-semibold text-black mb-2">Worker's Compensation</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(normalizedInfo.workersCompensation).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="text-black">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

