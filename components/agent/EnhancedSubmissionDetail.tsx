'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Submission, BusinessType, Carrier, CarrierQuote, InsuredInformation } from '@/lib/types';
import InsuredInfoSection from './InsuredInfoSection';
import AutoSubmitModal, { CarrierType } from './AutoSubmitModal';
import AutomationStatusModal from './AutomationStatusModal';
import { DollarSign, MessageSquare, CheckCircle, MapPin, X, AlertCircle, Info, Save, Send, Rocket, Activity } from 'lucide-react';

interface CarrierAppetiteDetail {
  id: string;
  carrierId: string;
  businessTypeId: string;
  geographicRestrictions: string[];
  exclusions: string[];
  status: string;
  coverageDetails: any;
  operationalCriteria: any;
  contactInfo: any;
  notes: string | null;
}

interface SubmissionDetailProps {
  submission: Submission;
}

export default function EnhancedSubmissionDetail({ submission: initialSubmission }: SubmissionDetailProps) {
  const [submission, setSubmission] = useState(initialSubmission);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [appetites, setAppetites] = useState<CarrierAppetiteDetail[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localCarriers, setLocalCarriers] = useState(submission.carriers);
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>(submission.businessTypeId || '');
  const [loadingAppetite, setLoadingAppetite] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [initialSubmission.id]);

  async function loadData() {
    try {
      const [bts, cs, updatedSubmission] = await Promise.all([
        fetch('/api/business-types').then(r => r.json()),
        fetch('/api/carriers').then(r => r.json()),
        fetch(`/api/submissions/${initialSubmission.id}`).then(r => r.json()),
      ]);
      
      setBusinessTypes(bts);
      setCarriers(cs);
      
      // Load carrier appetite for this specific business type (only if business type exists)
      if (initialSubmission.businessTypeId) {
        const as = await fetch(`/api/carrier-appetite/business-type/${initialSubmission.businessTypeId}`)
          .then(r => r.json())
          .catch(() => []);
        
        setAppetites(as || []);
      }
      
      if (updatedSubmission) {
        setSubmission(updatedSubmission);
        setLocalCarriers(updatedSubmission.carriers || []);
        
        // If no insured info snapshot but has insured_info_id, fetch it
        if (!updatedSubmission.insuredInfoSnapshot && updatedSubmission.insuredInfoId) {
          try {
            const insuredInfoResponse = await fetch(`/api/insured-info/${updatedSubmission.insuredInfoId}`);
            if (insuredInfoResponse.ok) {
              const insuredInfo = await insuredInfoResponse.json();
              setSubmission(prev => ({
                ...prev,
                insuredInfoSnapshot: insuredInfo
              }));
            }
          } catch (error) {
            console.error('Failed to fetch insured info:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  // Update selectedBusinessType when submission changes
  useEffect(() => {
    if (submission.businessTypeId) {
      setSelectedBusinessType(submission.businessTypeId);
    }
  }, [submission.businessTypeId]);

  // Load carrier appetite when business type is selected
  useEffect(() => {
    if (selectedBusinessType && selectedBusinessType !== submission.businessTypeId) {
      loadCarrierAppetite(selectedBusinessType);
    }
  }, [selectedBusinessType]);

  async function loadCarrierAppetite(businessTypeId: string) {
    if (!businessTypeId) return;
    setLoadingAppetite(true);
    try {
      const as = await fetch(`/api/carrier-appetite/business-type/${businessTypeId}`)
        .then(r => r.json())
        .catch(() => []);
      setAppetites(as || []);
    } catch (error) {
      console.error('Failed to load carrier appetite:', error);
    } finally {
      setLoadingAppetite(false);
    }
  }

  async function handleBusinessTypeChange(businessTypeId: string) {
    setSelectedBusinessType(businessTypeId);
    // Update submission with business type
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessTypeId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSubmission(updated);
        await loadCarrierAppetite(businessTypeId);
      }
    } catch (error) {
      console.error('Failed to update business type:', error);
    }
  }

  const getBusinessTypeName = () => {
    const bt = businessTypes.find(bt => bt.id === (selectedBusinessType || submission.businessTypeId));
    return bt?.name || 'Not Selected';
  };

  const getSuggestedCarriers = () => {
    if (!selectedBusinessType) return [];
    // Get carriers that have appetite for this business type (active, limited, unresponsive - but NOT no_appetite)
    const appetiteCarriers = appetites
      .filter(a => 
        a.businessTypeId === selectedBusinessType && 
        a.status !== 'no_appetite'
      )
      .map(a => a.carrierId);
    
    return carriers.filter(carrier => appetiteCarriers.includes(carrier.id));
  };

  const getCarrierAppetite = (carrierId: string): CarrierAppetiteDetail | null => {
    if (!selectedBusinessType) return null;
    return appetites.find(a => a.carrierId === carrierId && a.businessTypeId === selectedBusinessType) || null;
  };

  const getCarrierQuote = (carrierId: string): CarrierQuote | null => {
    return localCarriers.find(c => c.carrierId === carrierId) || null;
  };

  // Update local state only (no auto-save)
  function updateCarrierQuote(carrierId: string, updates: Partial<CarrierQuote>) {
    const existing = localCarriers.find(c => c.carrierId === carrierId);
    
    const newCarriers = existing
      ? localCarriers.map(c =>
          c.carrierId === carrierId ? { ...c, ...updates } : c
        )
      : [...localCarriers, { carrierId, quoted: false, amount: null, remarks: '', selected: false, ...updates }];
    
    setLocalCarriers(newCarriers);
    setSaved(false);
  }

  async function saveSubmission() {
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          carriers: localCarriers,
          status: submission.status === 'draft' ? 'draft' : submission.status
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSubmission(updated);
        setLocalCarriers(updated.carriers || []);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false);
  const [showAutomationStatusModal, setShowAutomationStatusModal] = useState(false);
  const [carrierResults, setCarrierResults] = useState<{ [key: string]: any } | null>(null);

  async function handleAutoSubmit(selectedCarriers: CarrierType[]) {
    setSubmitting(true);
    setSubmitStatus(null);
    setCarrierResults(null);
    
    try {
      const res = await fetch(`/api/submissions/${submission.id}/auto-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carriers: selectedCarriers }),
      });

      const result = await res.json();

      // Store carrier-specific results
      if (result.results) {
        setCarrierResults(result.results);
      }

      // Update submission with new rpa_tasks if present
      if (result.rpa_tasks) {
        setSubmission(prev => ({
          ...prev,
          rpa_tasks: result.rpa_tasks
        }));
      }

      // Refresh submission data to get latest rpa_tasks from database
      await loadData();

      if (res.ok || res.status === 207) {
        // Build detailed message showing each carrier's status
        let message = result.message || 'Submission completed';
        
        if (result.results) {
          const details: string[] = [];
          for (const [carrier, data] of Object.entries(result.results) as [string, any][]) {
            if (data.success) {
              let detail = `✅ ${carrier.toUpperCase()}: ${data.message}`;
              if (data.accountNumber) detail += ` (Account: ${data.accountNumber})`;
              if (data.policyCode) detail += ` (Policy: ${data.policyCode})`;
              details.push(detail);
            } else {
              details.push(`❌ ${carrier.toUpperCase()}: ${data.message}`);
            }
          }
          message = details.join('\n');
        }

        const allSuccess = result.success;
        setSubmitStatus({
          success: allSuccess,
          message: message,
        });
        
        if (allSuccess) {
          setShowAutoSubmitModal(false); // Only close on full success
          setTimeout(() => setSubmitStatus(null), 10000);
        } else {
          // Partial failure - keep modal open but show status
          setTimeout(() => setSubmitStatus(null), 15000);
        }
      } else {
        const errorMessage = result.details || result.error || 'Failed to submit to RPA';
        setSubmitStatus({
          success: false,
          message: errorMessage,
        });
        setTimeout(() => setSubmitStatus(null), 10000);
      }
    } catch (error: any) {
      console.error('Auto-submit error:', error);
      setSubmitStatus({
        success: false,
        message: error.message || 'Failed to submit. Please try again.',
      });
      setTimeout(() => setSubmitStatus(null), 5000);
    } finally {
      setSubmitting(false);
    }
  }

  // Get insured info from snapshot
  const insuredInfo = submission.insuredInfoSnapshot as InsuredInformation | null;
  
  // Debug: Check if we have insured info
  useEffect(() => {
    if (submission.insuredInfoId) {
      if (insuredInfo) {
        console.log('✅ Insured info loaded:', insuredInfo.corporationName || 'Unknown');
      } else {
        console.log('⚠️ Insured info ID exists but snapshot is missing:', submission.insuredInfoId);
        console.log('   Submission source:', submission.source);
        console.log('   Will try to fetch from database...');
      }
    } else {
      console.log('ℹ️ No insured info ID in submission');
    }
  }, [submission.insuredInfoId, insuredInfo, submission.source]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-black">{submission.businessName}</h2>
            {(submission.status === 'quoted' || submission.status === 'submitted') && (
              <span className="badge bg-gray-700 text-white">SUBMITTED</span>
            )}
            {saved && (
              <span className="badge bg-green-600 text-white">Saved!</span>
            )}
          </div>
          <p className="text-gray-600">{getBusinessTypeName()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAutomationStatusModal(true)}
            className="btn-secondary text-sm flex items-center gap-2"
            title="View automation status"
          >
            <Activity className="w-4 h-4" />
            Automation Status
          </button>
          <button
            onClick={() => setShowAutoSubmitModal(true)}
            disabled={submitting || !insuredInfo}
            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!insuredInfo ? 'Insured information is required' : 'Submit to RPA automation'}
          >
            <Rocket className="w-4 h-4" />
            Auto Submit
          </button>
          <Link href="/agent" className="btn-secondary text-sm">
            Back to List
          </Link>
        </div>
      </div>

      {/* Submit Status Message */}
      {submitStatus && (
        <div className={`card p-4 mb-4 ${
          submitStatus.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-start gap-2">
            <span className={`text-lg ${submitStatus.success ? 'text-green-600' : 'text-amber-600'}`}>
              {submitStatus.success ? '✓' : '⚠'}
            </span>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                submitStatus.success ? 'text-green-800' : 'text-amber-800'
              }`}>
                {submitStatus.success ? 'Submission Complete' : 'Submission Status'}
              </p>
              <div className={`text-sm mt-2 space-y-1 ${
                submitStatus.success ? 'text-green-700' : 'text-amber-700'
              }`}>
                {submitStatus.message?.split('\n').map((line, idx) => (
                  <p key={idx} className={
                    line.startsWith('✅') ? 'text-green-700' : 
                    line.startsWith('❌') ? 'text-red-700' : ''
                  }>
                    {line}
                  </p>
                ))}
              </div>
            </div>
            <button
              onClick={() => setSubmitStatus(null)}
              className={`${submitStatus.success ? 'text-green-600 hover:text-green-800' : 'text-amber-600 hover:text-amber-800'} text-lg font-bold`}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Insured Information Section - Show First */}
      {insuredInfo && submission.insuredInfoId ? (
        <InsuredInfoSection 
          insuredInfo={insuredInfo} 
          insuredInfoId={submission.insuredInfoId}
        />
      ) : submission.insuredInfoId ? (
        <div className="card p-6 mb-6 bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ Insured information is being loaded... If this message persists, the data may not have been saved properly.
          </p>
        </div>
      ) : null}

      {/* Business Type Selection - Required before showing carriers */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Select Business Type</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please select a business type to view available carriers and their appetite.
        </p>
        <select
          value={selectedBusinessType}
          onChange={(e) => handleBusinessTypeChange(e.target.value)}
          className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">-- Select Business Type --</option>
          {businessTypes.map((bt) => (
            <option key={bt.id} value={bt.id}>
              {bt.name}
            </option>
          ))}
        </select>
        {loadingAppetite && (
          <p className="text-sm text-gray-500 mt-2">Loading carrier appetite...</p>
        )}
      </div>

      {/* Save Button - Simple and at the end */}
      {submission.status !== 'submitted' && submission.status !== 'bound' && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {saved && <span className="text-green-600 font-medium">✓ Saved!</span>}
              {!saved && <span>Make changes and click Save</span>}
            </div>
            <button
              onClick={saveSubmission}
              disabled={saving}
              className="btn-primary flex items-center gap-2 min-w-[120px] justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Carriers with Full Appetite Information - Only show if business type selected */}
      {selectedBusinessType ? (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Available Carriers</h3>
            <div className="flex items-center gap-4">
              <a
                href="https://deployment-delta-eight.vercel.app/summary"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm"
              >
                Generate Summary
              </a>
              <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Limited
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Unresponsive
              </span>
              </div>
            </div>
          </div>
          
          {getSuggestedCarriers().length === 0 ? (
            <p className="text-gray-500 text-sm">No carriers available for this business type</p>
          ) : (
            <div className="space-y-6">
            {getSuggestedCarriers().map((carrier) => {
              const appetite = getCarrierAppetite(carrier.id);
              const quote = getCarrierQuote(carrier.id);
              const quoted = quote?.quoted || false;
              const selected = quote?.selected || false;
              
              return (
                <div key={carrier.id} className={`border rounded-sm p-5 space-y-4 ${
                  appetite?.status === 'active' ? 'border-green-200 bg-green-50/30' :
                  appetite?.status === 'limited' ? 'border-yellow-200 bg-yellow-50/30' :
                  appetite?.status === 'unresponsive' ? 'border-orange-200 bg-orange-50/30' :
                  appetite?.status === 'no_appetite' ? 'border-red-200 bg-red-50/30' :
                  'border-gray-200'
                }`}>
                  {/* Carrier Header */}
                  <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={quoted}
                        onChange={(e) => updateCarrierQuote(carrier.id, { quoted: e.target.checked })}
                        className="w-5 h-5 border-2 border-gray-300 rounded-sm checked:bg-black checked:border-black mt-1"
                      />
                      <div>
                        <h4 className="font-semibold text-black text-lg">{carrier.name}</h4>
                        {appetite?.status && (
                          <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block font-medium ${
                            appetite.status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' :
                            appetite.status === 'limited' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                            appetite.status === 'unresponsive' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                            appetite.status === 'no_appetite' ? 'bg-red-100 text-red-700 border border-red-300' :
                            'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}>
                            {appetite.status === 'active' ? '✓ Active' :
                             appetite.status === 'limited' ? '⚠ Limited' :
                             appetite.status === 'unresponsive' ? '📧 Unresponsive' :
                             appetite.status === 'no_appetite' ? '✗ No Appetite' :
                             appetite.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selected && (
                        <span className="text-xs bg-black text-white px-2 py-1 rounded">Selected</span>
                      )}
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => updateCarrierQuote(carrier.id, { selected: e.target.checked })}
                        className="w-5 h-5"
                        disabled={!quoted}
                        title="Mark as selected"
                      />
                    </div>
                  </div>

                  {/* Carrier Appetite Information */}
                  {appetite && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* Geographic Restrictions */}
                      {appetite.geographicRestrictions && appetite.geographicRestrictions.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-700">Geographic Restrictions</p>
                            <p className="text-gray-600">{appetite.geographicRestrictions.join(', ')}</p>
                          </div>
                        </div>
                      )}

                      {/* Exclusions */}
                      {appetite.exclusions && appetite.exclusions.length > 0 && (
                        <div className="flex items-start gap-2">
                          <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-700">Exclusions</p>
                            <p className="text-gray-600">{appetite.exclusions.join(', ')}</p>
                          </div>
                        </div>
                      )}

                      {/* Coverage Details */}
                      {appetite.coverageDetails && Object.keys(appetite.coverageDetails).length > 0 && (
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-700">Coverage</p>
                            <div className="text-gray-600 space-y-1">
                              {appetite.coverageDetails.glLimit && (
                                <p>GL Limit: {appetite.coverageDetails.glLimit}</p>
                              )}
                              {appetite.coverageDetails.property && <p>✓ Property</p>}
                              {appetite.coverageDetails.liability && <p>✓ Liability</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Operational Criteria */}
                      {appetite.operationalCriteria && Object.keys(appetite.operationalCriteria).length > 0 && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-700">Requirements</p>
                            <div className="text-gray-600 space-y-1">
                              {appetite.operationalCriteria.minHours && (
                                <p>Min Hours: {appetite.operationalCriteria.minHours}</p>
                              )}
                              {appetite.operationalCriteria.maxHours && (
                                <p>Max Hours: {appetite.operationalCriteria.maxHours}</p>
                              )}
                              {appetite.operationalCriteria.requirements && (
                                <p>{appetite.operationalCriteria.requirements}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Contact Info */}
                      {appetite.contactInfo && (appetite.contactInfo.email || appetite.contactInfo.name) && (
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-700">Contact</p>
                            <div className="text-gray-600">
                              {appetite.contactInfo.name && <p>{appetite.contactInfo.name}</p>}
                              {appetite.contactInfo.email && <p className="text-xs">{appetite.contactInfo.email}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {appetite?.notes && (
                    <div className="bg-gray-50 p-3 rounded-sm border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">Notes</p>
                      <p className="text-sm text-gray-600">{appetite.notes}</p>
                    </div>
                  )}

                  {/* Quote Section */}
                  {quoted && (
                    <div className="border-t border-gray-200 pt-4 space-y-3 mt-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                          <DollarSign className="w-4 h-4" />
                          Quoted Amount
                        </label>
                        <input
                          type="number"
                          value={quote?.amount || ''}
                          onChange={(e) => updateCarrierQuote(carrier.id, { amount: parseFloat(e.target.value) || null })}
                          className="input-field"
                          placeholder="Enter amount"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                          <MessageSquare className="w-4 h-4" />
                          Remarks
                        </label>
                        <textarea
                          value={quote?.remarks || ''}
                          onChange={(e) => updateCarrierQuote(carrier.id, { remarks: e.target.value })}
                          className="input-field"
                          rows={3}
                          placeholder="Add remarks about this quote..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      ) : (
        <div className="card p-6 bg-gray-50">
          <p className="text-gray-600 text-center">
            Please select a business type above to view available carriers.
          </p>
        </div>
      )}

      {/* Auto Submit Modal */}
      <AutoSubmitModal
        isOpen={showAutoSubmitModal}
        onClose={() => setShowAutoSubmitModal(false)}
        onConfirm={handleAutoSubmit}
        insuredInfo={insuredInfo}
        submitting={submitting}
      />

      {/* Automation Status Modal */}
      <AutomationStatusModal
        isOpen={showAutomationStatusModal}
        onClose={() => setShowAutomationStatusModal(false)}
        submissionId={submission.id}
        initialRpaTasks={submission.rpa_tasks}
      />
    </div>
  );
}
