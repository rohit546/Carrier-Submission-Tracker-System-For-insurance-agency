'use client';

import { InsuredInformation } from '@/lib/types';
import { Building2, User, Mail, Phone, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';

interface InsuredInfoSectionProps {
  insuredInfo: InsuredInformation | null;
  isEditable?: boolean;
  onUpdate?: (data: Partial<InsuredInformation>) => void;
}

export default function InsuredInfoSection({ insuredInfo, isEditable = false, onUpdate }: InsuredInfoSectionProps) {
  if (!insuredInfo) {
    return null;
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="w-6 h-6 text-black" />
        <h2 className="text-2xl font-bold text-black">Insured Information</h2>
        {insuredInfo.source === 'eform' && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">From Eform</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Basic Information</h3>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Corporation Name</label>
            <p className="text-black font-medium">{insuredInfo.corporationName || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">DBA (Doing Business As)</label>
            <p className="text-black">{insuredInfo.dba || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Ownership Type</label>
            <p className="text-black">{insuredInfo.ownershipType || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Applicant Type</label>
            <p className="text-black">{insuredInfo.applicantIs || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Operation Description</label>
            <p className="text-black text-sm">{insuredInfo.operationDescription || 'N/A'}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Contact Information</h3>
          
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <label className="text-sm font-medium text-gray-600">Contact Name</label>
              <p className="text-black">{insuredInfo.contactName || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <label className="text-sm font-medium text-gray-600">Contact Number</label>
              <p className="text-black">{insuredInfo.contactNumber || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <label className="text-sm font-medium text-gray-600">Contact Email</label>
              <p className="text-black">{insuredInfo.contactEmail || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <label className="text-sm font-medium text-gray-600">Address</label>
              <p className="text-black">{insuredInfo.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Property Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Hours of Operation</label>
              <p className="text-black text-sm">{insuredInfo.hoursOfOperation || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">No. of MPOs</label>
              <p className="text-black text-sm">{insuredInfo.noOfMPOs || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Construction Type</label>
              <p className="text-black text-sm">{insuredInfo.constructionType || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Total Sq. Footage</label>
              <p className="text-black text-sm">{insuredInfo.totalSqFootage || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Year Built</label>
              <p className="text-black text-sm">{insuredInfo.yearBuilt || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Year of Latest Update</label>
              <p className="text-black text-sm">{insuredInfo.yearLatestUpdate || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Years Exp. in Business</label>
              <p className="text-black text-sm">{insuredInfo.yearsExpInBusiness || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Years at This Location</label>
              <p className="text-black text-sm">{insuredInfo.yearsAtLocation || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Protection Class</label>
              <p className="text-black text-sm">{insuredInfo.protectionClass || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Leased Out Space</label>
              <p className="text-black text-sm">{insuredInfo.leasedOutSpace || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Additional Information</h3>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Lead Source</label>
            <p className="text-black text-sm">{insuredInfo.leadSource || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Prior Carrier</label>
            <p className="text-black text-sm">{insuredInfo.priorCarrier || 'N/A'}</p>
          </div>

          {insuredInfo.targetPremium && (
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <label className="text-sm font-medium text-gray-600">Target Premium</label>
                <p className="text-black">${insuredInfo.targetPremium.toLocaleString()}</p>
              </div>
            </div>
          )}

          {insuredInfo.proposedEffectiveDate && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <label className="text-sm font-medium text-gray-600">Proposed Effective Date</label>
                <p className="text-black text-sm">
                  {new Date(insuredInfo.proposedEffectiveDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {insuredInfo.additionalInsured && (
            <div>
              <label className="text-sm font-medium text-gray-600">Additional Insured</label>
              <p className="text-black text-sm">{insuredInfo.additionalInsured}</p>
            </div>
          )}

          {/* Security Systems */}
          {(insuredInfo.alarmInfo || insuredInfo.fireInfo) && (
            <div>
              <label className="text-sm font-medium text-gray-600">Security Systems</label>
              <div className="mt-2 space-y-1">
                {insuredInfo.alarmInfo && Object.keys(insuredInfo.alarmInfo).length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">Alarm: </span>
                    <span className="text-xs text-black">
                      {Object.entries(insuredInfo.alarmInfo)
                        .filter(([_, v]) => v === true)
                        .map(([k]) => k)
                        .join(', ')}
                    </span>
                  </div>
                )}
                {insuredInfo.fireInfo && Object.keys(insuredInfo.fireInfo).length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">Fire: </span>
                    <span className="text-xs text-black">
                      {Object.entries(insuredInfo.fireInfo)
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
      {(insuredInfo.propertyCoverage || insuredInfo.generalLiability || insuredInfo.workersCompensation) && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <details className="group">
            <summary className="cursor-pointer text-lg font-semibold text-black flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Coverage Details
            </summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              {insuredInfo.propertyCoverage && Object.keys(insuredInfo.propertyCoverage).length > 0 && (
                <div>
                  <h4 className="font-semibold text-black mb-2">Property Coverage</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(insuredInfo.propertyCoverage).map(([key, value]) => (
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

              {insuredInfo.generalLiability && Object.keys(insuredInfo.generalLiability).length > 0 && (
                <div>
                  <h4 className="font-semibold text-black mb-2">General Liability</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(insuredInfo.generalLiability).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-600">{key}:</span>
                        {typeof value === 'object' && value !== null ? (
                          <div className="ml-4">
                            {value.monthly && <div>Monthly: ${value.monthly.toLocaleString()}</div>}
                            {value.yearly && <div>Yearly: ${value.yearly.toLocaleString()}</div>}
                          </div>
                        ) : (
                          <span className="text-black ml-2">{String(value)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insuredInfo.workersCompensation && Object.keys(insuredInfo.workersCompensation).length > 0 && (
                <div>
                  <h4 className="font-semibold text-black mb-2">Worker's Compensation</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(insuredInfo.workersCompensation).map(([key, value]) => (
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

