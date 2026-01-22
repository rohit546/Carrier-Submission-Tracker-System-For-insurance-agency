'use client';

import { useState } from 'react';
import { InsuredInformation } from '@/lib/types';
import { Building2, User, Mail, Phone, MapPin, Calendar, DollarSign, FileText, Pencil, Check, X } from 'lucide-react';

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

// Helper to convert date string to input format (YYYY-MM-DD)
function dateToInput(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
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

interface InsuredInfoSectionProps {
  insuredInfo: InsuredInformation | null;
  insuredInfoId?: string | null; // Pass the ID separately in case it's not in the snapshot
  isEditable?: boolean;
  onUpdate?: (data: Partial<InsuredInformation>) => void;
  quotedBy?: string;
  setQuotedBy?: (value: string) => void;
  quotedByOptions?: string[];
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

export default function InsuredInfoSection({ 
  insuredInfo, 
  insuredInfoId, 
  isEditable = true, 
  onUpdate,
  quotedBy = '',
  setQuotedBy,
  quotedByOptions = []
}: InsuredInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<InsuredInformation>>({});

  if (!insuredInfo) {
    return null;
  }

  // Normalize the data to handle both formats
  const normalizedInfo = normalizeInsuredInfo(insuredInfo);
  
  // Get the ID - prefer the one from props (most reliable), then from normalizedInfo, then from insuredInfo
  // Filter out "undefined" string
  const actualId = (insuredInfoId && insuredInfoId !== 'undefined') 
    ? insuredInfoId 
    : (normalizedInfo.id && normalizedInfo.id !== 'undefined')
    ? normalizedInfo.id
    : ((insuredInfo as any).id && (insuredInfo as any).id !== 'undefined')
    ? (insuredInfo as any).id
    : null;
  
  if (!actualId) {
    console.error('No insured info ID available', { 
      insuredInfoId, 
      normalizedInfoId: normalizedInfo.id, 
      insuredInfoIdRaw: insuredInfoId,
      hasInsuredInfo: !!insuredInfo 
    });
    return (
      <div className="card p-6 mb-6 bg-red-50 border border-red-200">
        <p className="text-sm text-red-800">
          ⚠️ Error: Insured information ID is missing. Cannot edit this record.
        </p>
        <p className="text-xs text-red-600 mt-2">
          Debug: insuredInfoId={String(insuredInfoId)}, snapshotId={String(normalizedInfo.id)}
        </p>
      </div>
    );
  }

  // Initialize form data when entering edit mode
  const handleEdit = () => {
    setFormData({
      ownershipType: normalizedInfo.ownershipType || '',
      corporationName: normalizedInfo.corporationName || '',
      contactName: normalizedInfo.contactName || '',
      contactNumber: normalizedInfo.contactNumber || '',
      contactEmail: normalizedInfo.contactEmail || '',
      leadSource: normalizedInfo.leadSource || '',
      proposedEffectiveDate: normalizedInfo.proposedEffectiveDate || '',
      priorCarrier: normalizedInfo.priorCarrier || '',
      targetPremium: normalizedInfo.targetPremium || undefined,
      applicantIs: normalizedInfo.applicantIs || '',
      operationDescription: normalizedInfo.operationDescription || '',
      dba: normalizedInfo.dba || '',
      address: normalizedInfo.address || '',
      fein: normalizedInfo.fein || '',
      hoursOfOperation: normalizedInfo.hoursOfOperation || '',
      noOfMPOs: normalizedInfo.noOfMPOs || undefined,
      constructionType: normalizedInfo.constructionType || '',
      yearsExpInBusiness: normalizedInfo.yearsExpInBusiness || undefined,
      yearsAtLocation: normalizedInfo.yearsAtLocation || undefined,
      yearBuilt: normalizedInfo.yearBuilt || undefined,
      yearLatestUpdate: normalizedInfo.yearLatestUpdate || undefined,
      totalSqFootage: normalizedInfo.totalSqFootage || undefined,
      leasedOutSpace: normalizedInfo.leasedOutSpace || '',
      protectionClass: normalizedInfo.protectionClass || '',
      additionalInsured: normalizedInfo.additionalInsured || '',
      propertyCoverage: normalizedInfo.propertyCoverage || {},
      generalLiability: normalizedInfo.generalLiability || {},
      workersCompensation: normalizedInfo.workersCompensation || {},
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleSave = async () => {
    // Validate required field
    if (!formData.corporationName?.trim()) {
      alert('Corporation name is required');
      return;
    }

    // Validate FEIN format if provided
    if (formData.fein) {
      const feinValidation = validateFEIN(formData.fein);
      if (!feinValidation.valid) {
        alert(feinValidation.error || 'FEIN format is invalid');
        return;
      }
      // Format FEIN before saving
      formData.fein = formatFEIN(formData.fein);
    }

    // Double-check we have a valid ID (UUID format)
    if (!actualId || actualId === 'undefined' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actualId)) {
      console.error('Invalid ID format:', actualId);
      alert('Error: Invalid insured information ID. Please refresh the page.');
      return;
    }

    setSaving(true);
    try {
      console.log('Saving insured info:', { id: actualId, formData });
      const response = await fetch(`/api/insured-info/${actualId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      const updated = await response.json();
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate(updated);
      }
      
      setIsEditing(false);
      // Reload page to show updated data
      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof InsuredInformation, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parentField: 'propertyCoverage' | 'generalLiability' | 'workersCompensation', key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as any || {}),
        [key]: value === '' ? null : (isNaN(Number(value)) ? value : Number(value)),
      },
    }));
  };

  // Render field as input or text
  const renderField = (
    label: string,
    field: keyof InsuredInformation,
    type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'textarea' = 'text',
    placeholder?: string
  ) => {
    const value = isEditing ? (formData[field] ?? '') : (normalizedInfo[field] ?? '');
    
    if (isEditing) {
      if (type === 'textarea') {
        return (
          <textarea
            value={value as string}
            onChange={(e) => updateField(field, e.target.value)}
            className="input-field w-full"
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            rows={3}
          />
        );
      }
      return (
        <input
          type={type}
          value={type === 'date' ? dateToInput(value as string) : (value as string | number)}
          onChange={(e) => {
            const val = type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value;
            updateField(field, val);
          }}
          className="input-field w-full"
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        />
      );
    }
    
    if (type === 'date') {
      return <p className="text-black text-sm">{formatDate(value as string)}</p>;
    }
    if (type === 'number') {
      return <p className="text-black text-sm">{value || 'N/A'}</p>;
    }
    return <p className="text-black text-sm">{value || 'N/A'}</p>;
  };

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-black" />
          <h2 className="text-xl font-bold text-black">Insured Information</h2>
          {normalizedInfo.source === 'eform' && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">From Eform</span>
          )}
        </div>
        {/* Quoted by dropdown - highlighted */}
        {setQuotedBy && quotedByOptions.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border-2 border-yellow-400 rounded-lg px-4 py-2 shadow-sm">
            <label htmlFor="quoted-by" className="text-sm font-semibold text-gray-700">
              Quoted by:
            </label>
            <select
              id="quoted-by"
              value={quotedBy}
              onChange={(e) => setQuotedBy(e.target.value)}
              className="px-3 py-1.5 border border-yellow-300 rounded-md text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              {quotedByOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}
        {isEditable && (
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                  title="Save changes"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  title="Cancel editing"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                title="Edit insured information"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Basic Information */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-black border-b border-gray-200 pb-1">Basic Information</h3>
          
          <div>
            <label className="text-xs font-medium text-gray-600">Corporation Name *</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.corporationName || ''}
                onChange={(e) => updateField('corporationName', e.target.value)}
                className="input-field w-full"
                placeholder="Enter corporation name"
                required
              />
            ) : (
              <p className="text-black font-medium text-sm">{normalizedInfo.corporationName || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">DBA (Doing Business As)</label>
            {renderField('DBA', 'dba')}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">FEIN ID</label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.fein || ''}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Auto-format as user types (add hyphen after 2 digits)
                    const digits = value.replace(/\D/g, '');
                    if (digits.length <= 2) {
                      updateField('fein', digits);
                    } else if (digits.length <= 9) {
                      updateField('fein', `${digits.substring(0, 2)}-${digits.substring(2)}`);
                    } else {
                      // Limit to 9 digits
                      updateField('fein', `${digits.substring(0, 2)}-${digits.substring(2, 9)}`);
                    }
                  }}
                  onBlur={(e) => {
                    // Format on blur if not already formatted
                    const formatted = formatFEIN(e.target.value);
                    if (formatted !== e.target.value) {
                      updateField('fein', formatted);
                    }
                  }}
                  className="input-field w-full"
                  placeholder="58-3247891"
                  maxLength={10} // XX-XXXXXXX = 10 characters
                />
                {formData.fein && !validateFEIN(formData.fein).valid && (
                  <p className="text-xs text-red-600 mt-1">
                    Format: XX-XXXXXXX (e.g., 58-3247891)
                  </p>
                )}
              </div>
            ) : (
              <p className="text-black text-xs">
                {normalizedInfo.fein ? formatFEIN(normalizedInfo.fein) : 'N/A'}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Ownership Type</label>
            {renderField('Ownership Type', 'ownershipType')}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Applicant Type</label>
            {renderField('Applicant Type', 'applicantIs')}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Operation Description</label>
            {renderField('Operation Description', 'operationDescription', 'textarea')}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-black border-b border-gray-200 pb-1">Contact Information</h3>
          
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 mt-1" />
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600">Contact Name</label>
              {renderField('Contact Name', 'contactName')}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-gray-400 mt-1" />
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600">Contact Number</label>
              {renderField('Contact Number', 'contactNumber', 'tel')}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-gray-400 mt-1" />
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600">Contact Email</label>
              {renderField('Contact Email', 'contactEmail', 'email')}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600">Address</label>
              {renderField('Address', 'address', 'textarea')}
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-black border-b border-gray-200 pb-1">Property Details</h3>
          
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600">Hours of Operation</label>
              {renderField('Hours of Operation', 'hoursOfOperation')}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">No. of MPOs</label>
              {renderField('No. of MPOs', 'noOfMPOs', 'number')}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Construction Type</label>
              {renderField('Construction Type', 'constructionType')}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Total Sq. Footage</label>
              {renderField('Total Sq. Footage', 'totalSqFootage', 'number')}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Year Built</label>
              {renderField('Year Built', 'yearBuilt', 'number')}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Year of Latest Update</label>
              {renderField('Year of Latest Update', 'yearLatestUpdate', 'number')}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Years Exp. in Business</label>
              {renderField('Years Exp. in Business', 'yearsExpInBusiness', 'number')}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Years at This Location</label>
              {renderField('Years at This Location', 'yearsAtLocation', 'number')}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Protection Class</label>
              {renderField('Protection Class', 'protectionClass')}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Leased Out Space</label>
              {renderField('Leased Out Space', 'leasedOutSpace')}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-black border-b border-gray-200 pb-1">Additional Information</h3>
          
          <div>
            <label className="text-xs font-medium text-gray-600">Lead Source</label>
            {renderField('Lead Source', 'leadSource')}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Prior Carrier</label>
            {renderField('Prior Carrier', 'priorCarrier')}
          </div>

          {(!isEditing && normalizedInfo.targetPremium) || (isEditing && formData.targetPremium !== undefined) ? (
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-gray-400 mt-1" />
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600">Target Premium</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.targetPremium || ''}
                    onChange={(e) => updateField('targetPremium', e.target.value === '' ? null : Number(e.target.value))}
                    className="input-field w-full"
                    placeholder="Enter target premium"
                  />
                ) : (
                  <p className="text-black">${normalizedInfo.targetPremium?.toLocaleString()}</p>
                )}
              </div>
            </div>
          ) : null}

          {(!isEditing && normalizedInfo.proposedEffectiveDate) || (isEditing && formData.proposedEffectiveDate !== undefined) ? (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-1" />
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600">Proposed Effective Date</label>
                {renderField('Proposed Effective Date', 'proposedEffectiveDate', 'date')}
              </div>
            </div>
          ) : null}

          {(!isEditing && normalizedInfo.additionalInsured) || (isEditing && formData.additionalInsured !== undefined) ? (
            <div>
              <label className="text-xs font-medium text-gray-600">Additional Insured</label>
              {renderField('Additional Insured', 'additionalInsured', 'textarea')}
            </div>
          ) : null}
        </div>
      </div>

      {/* Coverage Information (Collapsible) - Always show */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <details className="group" open>
          <summary className="cursor-pointer text-sm font-semibold text-black flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Coverage Details
          </summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Property Coverage - Show all fields */}
            <div>
              <h4 className="font-semibold text-black mb-2">Property Coverage</h4>
              <div className="space-y-2 text-sm">
                {(() => {
                  const propCoverage = isEditing ? (formData.propertyCoverage || {}) : (normalizedInfo.propertyCoverage || {});
                  const propFields = [
                    { key: 'bi', label: 'Business Income' },
                    { key: 'bpp', label: 'Business Personal Property' },
                    { key: 'pumps', label: 'Pumps' },
                    { key: 'canopy', label: 'Canopy' },
                    { key: 'building', label: 'Building' },
                  ];
                  
                  // Get existing fields from data
                  const existingKeys = Object.keys(propCoverage);
                  const allKeys = new Set([...propFields.map(f => f.key), ...existingKeys]);
                  
                  return Array.from(allKeys).map(key => {
                    const fieldDef = propFields.find(f => f.key === key);
                    const label = fieldDef?.label || key;
                    const value = propCoverage[key as keyof typeof propCoverage];
                    
                    // Skip if no value and not editing
                    if (!isEditing && (value === null || value === undefined || value === '')) return null;
                    
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-600">{label}:</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={value as number || ''}
                            onChange={(e) => updateNestedField('propertyCoverage', key, e.target.value)}
                            className="input-field w-32 text-right"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-black font-medium">
                            {typeof value === 'number' ? `$${value.toLocaleString()}` : String(value)}
                          </span>
                        )}
                      </div>
                    );
                  }).filter(Boolean);
                })()}
                {!isEditing && (!normalizedInfo.propertyCoverage || Object.keys(normalizedInfo.propertyCoverage).length === 0) && (
                  <p className="text-gray-400 italic">No property coverage data - click Edit to add</p>
                )}
              </div>
            </div>

            {/* General Liability - ALWAYS show these required fields */}
            <div>
              <h4 className="font-semibold text-black mb-2">General Liability</h4>
              <div className="space-y-2 text-sm">
                {(() => {
                  const genLiability = isEditing ? (formData.generalLiability || {}) : (normalizedInfo.generalLiability || {});
                  
                  // Always show these fields (required for RPA)
                  const requiredFields = [
                    { key: 'insideSalesYearly', label: 'Inside Sales (Annual)', required: true },
                    { key: 'liquorSalesYearly', label: 'Liquor Sales (Annual)', required: false },
                    { key: 'gasolineSalesYearly', label: 'Gasoline Gallons (Annual)', required: true, isGallons: true },
                  ];
                  
                  return requiredFields.map(({ key, label, required, isGallons }) => {
                    const value = genLiability[key as keyof typeof genLiability];
                    const hasValue = value !== null && value !== undefined && value !== '' && value !== 0;
                    
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className={`text-gray-600 ${required && !hasValue && !isEditing ? 'text-red-500' : ''}`}>
                          {label}:
                          {required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={value as number || ''}
                            onChange={(e) => updateNestedField('generalLiability', key, e.target.value)}
                            className={`input-field w-32 text-right ${required ? 'border-orange-300' : ''}`}
                            placeholder={required ? 'Required' : '0'}
                          />
                        ) : (
                          <span className={`font-medium ${hasValue ? 'text-black' : 'text-red-500'}`}>
                            {hasValue 
                              ? (isGallons 
                                  ? `${Number(value).toLocaleString()} gal` 
                                  : `$${Number(value).toLocaleString()}`)
                              : 'Missing - Edit to add'}
                          </span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Workers Compensation - Show only noOfEmployees */}
            {(normalizedInfo.workersCompensation && normalizedInfo.workersCompensation.noOfEmployees !== null && normalizedInfo.workersCompensation.noOfEmployees !== undefined) && (
              <div>
                <h4 className="font-semibold text-black mb-2">Worker's Compensation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">No. of Employees:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={(isEditing ? (formData.workersCompensation as any)?.noOfEmployees : normalizedInfo.workersCompensation?.noOfEmployees) || ''}
                        onChange={(e) => updateNestedField('workersCompensation', 'noOfEmployees', e.target.value)}
                        className="input-field w-32 text-right"
                        placeholder="0"
                      />
                    ) : (
                      <span className="text-black font-medium">
                        {String(normalizedInfo.workersCompensation.noOfEmployees)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
