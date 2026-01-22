'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Submission, BusinessType, Carrier, CarrierQuote, InsuredInformation } from '@/lib/types';
import InsuredInfoSection from './InsuredInfoSection';
import AutoSubmitModal, { CarrierType } from './AutoSubmitModal';
import AutomationStatusModal from './AutomationStatusModal';
import { DollarSign, MessageSquare, CheckCircle, MapPin, X, AlertCircle, Info, Save, Send, Rocket, Activity, Search } from 'lucide-react';

// Line of Business (LOB) options
const LOB_OPTIONS = [
  'Flood',
  'Genl Liability',
  'Liquor Liability',
  'Wind policies',
  'Abuse & Molestation',
  'Abusive Acts Liability',
  'Accidental D&D',
  'Accidental Medical Coverage',
  'Active Assailant',
  'Active Shooter',
  'Auto Commercial',
  'Automobile Liability',
  'Bonds Miscellaneous',
  'BOP',
  'BOP & Umbrella - Comm',
  'Builder risk (Homeowner)',
  'Builder\'s Risk',
  'Business Owner Policy',
  'Commercial Pkg',
  'Commercial Property',
  'Commercial Prpty Carwash',
  'Crime',
  'Cyber',
  'Disability',
  'Dwelling Fire',
  'Empl Practices Liab',
  'Employers Liability',
  'EPLI',
  'Equipment Breakdown',
  'Errors and Omissions',
  'Event Liability',
  'Excess Flood',
  'Excess Liability',
  'Excess Umbrella',
  'Farm Fire',
  'Fire Arms Liability',
  'Garage and Dealers',
  'GL',
  'Inland Marine',
  'Jewelers Block',
  'Kidnap',
  'Kidnap and Ransom',
  'License & Permit',
  'Miscellaneous',
  'Named Storm Coverage',
  'Package',
  'Performance Bond',
  'Pollution Liability',
  'Professional Liab',
  'Property',
  'Sexual Molestation',
  'Shooting',
  'Surety Bond',
  'Terrorism',
  'Umbrella',
  'Vacant Property',
  'Wind Buy Back',
  'Wind Policy',
  'Worker\'s Compensation',
].sort(); // Sort alphabetically for easier navigation

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
  const [lobSearchTerms, setLobSearchTerms] = useState<{ [carrierId: string]: string }>({});
  const [lobDropdownOpen, setLobDropdownOpen] = useState<{ [carrierId: string]: boolean }>({});
  const [quotedBy, setQuotedBy] = useState<string>(submission.quotedBy || '');
  const router = useRouter();
  
  // Quoted by options
  const QUOTED_BY_OPTIONS = [
    'Amber',
    'Ana',
    'Zara',
    'Munira',
    'Sana',
    'Tanya',
    'Tej',
    'Raabel',
    'Razia',
    'Shahnaz',
    'IBAD',
    'Shahmir',
    'Arzu',
    'Arish',
    'Ali Zain',
    'Ali Sajwani',
    'Amir',
    'Karim',
    'mazhar'
  ];

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
        setQuotedBy(updatedSubmission.quotedBy || '');
        
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

  // Get filtered LOB options based on search term
  const getFilteredLOBs = (carrierId: string) => {
    const searchTerm = (lobSearchTerms[carrierId] || '').toLowerCase();
    if (!searchTerm) return LOB_OPTIONS;
    return LOB_OPTIONS.filter(lob => lob.toLowerCase().includes(searchTerm));
  };

  // Update local state only (no auto-save)
  function updateCarrierQuote(carrierId: string, updates: Partial<CarrierQuote>) {
    const existing = localCarriers.find(c => c.carrierId === carrierId);
    
    const newCarriers = existing
      ? localCarriers.map(c =>
          c.carrierId === carrierId ? { ...c, ...updates } : c
        )
      : [...localCarriers, { carrierId, quoted: false, lob: undefined, amount: null, remarks: '', selected: false, ...updates }];
    
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
          status: submission.status === 'draft' ? 'draft' : submission.status,
          quotedBy: quotedBy || null
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSubmission(updated);
        setLocalCarriers(updated.carriers || []);
        setQuotedBy(updated.quotedBy || '');
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
    <div className="space-y-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-black">{submission.businessName}</h2>
            {(submission.status === 'quoted' || submission.status === 'submitted') && (
              <span className="badge bg-gray-700 text-white text-xs">SUBMITTED</span>
            )}
            {saved && (
              <span className="badge bg-green-600 text-white text-xs">Saved!</span>
            )}
          </div>
          <p className="text-gray-600 text-sm">{getBusinessTypeName()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAutomationStatusModal(true)}
            className="btn-secondary text-xs flex items-center gap-1 px-2 py-1"
            title="View automation status"
          >
            <Activity className="w-3 h-3" />
            Automation Status
          </button>
          <button
            onClick={() => setShowAutoSubmitModal(true)}
            disabled={submitting || !insuredInfo}
            className="btn-primary text-xs flex items-center gap-1 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!insuredInfo ? 'Insured information is required' : 'Submit to RPA automation'}
          >
            <Rocket className="w-3 h-3" />
            Auto Submit
          </button>
          <Link href="/agent" className="btn-secondary text-xs px-2 py-1">
            Back to List
          </Link>
        </div>
      </div>

      {/* Submit Status Message */}
      {submitStatus && (
        <div className={`card p-3 mb-3 ${
          submitStatus.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-start gap-2">
            <span className={`text-base ${submitStatus.success ? 'text-green-600' : 'text-amber-600'}`}>
              {submitStatus.success ? '✓' : '⚠'}
            </span>
            <div className="flex-1">
              <p className={`text-xs font-medium ${
                submitStatus.success ? 'text-green-800' : 'text-amber-800'
              }`}>
                {submitStatus.success ? 'Submission Complete' : 'Submission Status'}
              </p>
              <div className={`text-xs mt-1 space-y-0.5 ${
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
              className={`${submitStatus.success ? 'text-green-600 hover:text-green-800' : 'text-amber-600 hover:text-amber-800'} text-base font-bold`}
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
          quotedBy={quotedBy}
          setQuotedBy={(value) => {
            setQuotedBy(value);
            setSaved(false);
          }}
          quotedByOptions={QUOTED_BY_OPTIONS}
        />
      ) : submission.insuredInfoId ? (
        <div className="card p-6 mb-6 bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ Insured information is being loaded... If this message persists, the data may not have been saved properly.
          </p>
        </div>
      ) : null}

      {/* Business Type Selection - Required before showing carriers */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-black mb-1">Select Business Type</h3>
            <p className="text-xs text-gray-600 mb-2">
              Please select a business type to view available carriers and their appetite.
            </p>
          </div>
          <select
            value={selectedBusinessType}
            onChange={(e) => handleBusinessTypeChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-black text-sm"
          >
            <option value="">-- Select Business Type --</option>
            {businessTypes.map((bt) => (
              <option key={bt.id} value={bt.id}>
                {bt.name}
              </option>
            ))}
          </select>
          {loadingAppetite && (
            <p className="text-xs text-gray-500 ml-2">Loading...</p>
          )}
        </div>
      </div>

      {/* Carriers with Full Appetite Information - Only show if business type selected */}
      {selectedBusinessType ? (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-black">Available Carriers</h3>
            <div className="flex items-center gap-3">
              <a
                href="https://deployment-delta-eight.vercel.app/summary"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs px-2 py-1"
              >
                Generate Summary
              </a>
              <div className="flex items-center gap-3 text-xs text-gray-600">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {getSuggestedCarriers().map((carrier) => {
              const appetite = getCarrierAppetite(carrier.id);
              const quote = getCarrierQuote(carrier.id);
              const quoted = quote?.quoted || false;
              const selected = quote?.selected || false;
              
              return (
                <div key={carrier.id} className={`border rounded-sm p-3 space-y-2 flex flex-col ${
                  appetite?.status === 'active' ? 'border-green-200 bg-green-50/30' :
                  appetite?.status === 'limited' ? 'border-yellow-200 bg-yellow-50/30' :
                  appetite?.status === 'unresponsive' ? 'border-orange-200 bg-orange-50/30' :
                  appetite?.status === 'no_appetite' ? 'border-red-200 bg-red-50/30' :
                  'border-gray-200'
                }`}>
                  {/* Carrier Header */}
                  <div className="flex items-start justify-between border-b border-gray-200 pb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={quoted}
                        onChange={(e) => updateCarrierQuote(carrier.id, { quoted: e.target.checked })}
                        className="w-4 h-4 border-2 border-gray-300 rounded-sm checked:bg-black checked:border-black flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-black text-sm truncate">{carrier.name}</h4>
                        {appetite?.status && (
                          <span className={`text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block font-medium ${
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
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {selected && (
                        <span className="text-xs bg-black text-white px-1.5 py-0.5 rounded">Selected</span>
                      )}
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => updateCarrierQuote(carrier.id, { selected: e.target.checked })}
                        className="w-4 h-4"
                        disabled={!quoted}
                        title="Mark as selected"
                      />
                    </div>
                  </div>

                  {/* Compact Appetite Info - Only show key info */}
                  {appetite && (
                    <div className="space-y-1 text-xs">
                      {/* Coverage Details - Compact */}
                      {appetite.coverageDetails && Object.keys(appetite.coverageDetails).length > 0 && (
                        <div className="flex items-center gap-1">
                          <Info className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <span className="text-gray-700 font-medium">Coverage:</span>
                          <span className="text-gray-600">
                            {appetite.coverageDetails.property && 'Property '}
                            {appetite.coverageDetails.liability && 'Liability '}
                            {appetite.coverageDetails.glLimit && `GL: ${appetite.coverageDetails.glLimit}`}
                          </span>
                        </div>
                      )}

                      {/* Geographic Restrictions - Compact */}
                      {appetite.geographicRestrictions && appetite.geographicRestrictions.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-600 text-xs truncate">
                            {appetite.geographicRestrictions.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Notes - Compact */}
                      {appetite?.notes && (
                        <div className="bg-gray-50 p-1.5 rounded border border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-0.5">Notes</p>
                          <p className="text-xs text-gray-600 line-clamp-2">{appetite.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quote Section - Always visible, compact */}
                  <div className="border-t border-gray-200 pt-2 space-y-2 mt-auto">
                    {/* LOB Dropdown - Searchable */}
                    <div className="relative">
                      <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-0.5">
                        <Info className="w-3 h-3" />
                        LOB (Line of Business)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={
                            lobSearchTerms[carrier.id] !== undefined && lobSearchTerms[carrier.id] !== ''
                              ? lobSearchTerms[carrier.id]
                              : (quote?.lob || '')
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setLobSearchTerms(prev => ({ ...prev, [carrier.id]: value }));
                            setLobDropdownOpen(prev => ({ ...prev, [carrier.id]: true }));
                            // Allow free text entry - update immediately
                            updateCarrierQuote(carrier.id, { lob: value });
                          }}
                          onFocus={() => {
                            // When focusing, initialize search term with current value for filtering
                            const currentLob = quote?.lob || '';
                            setLobSearchTerms(prev => ({ ...prev, [carrier.id]: currentLob }));
                            setLobDropdownOpen(prev => ({ ...prev, [carrier.id]: true }));
                          }}
                          onBlur={() => {
                            // Delay closing to allow click on dropdown item
                            setTimeout(() => {
                              setLobDropdownOpen(prev => ({ ...prev, [carrier.id]: false }));
                              // Clear search term so saved value shows
                              setLobSearchTerms(prev => {
                                const newState = { ...prev };
                                delete newState[carrier.id];
                                return newState;
                              });
                            }, 200);
                          }}
                          className="input-field text-sm py-1 px-2 pr-8 w-full"
                          placeholder="Search or type LOB..."
                        />
                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                        {lobDropdownOpen[carrier.id] && getFilteredLOBs(carrier.id).length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-sm shadow-lg max-h-60 overflow-y-auto">
                            {getFilteredLOBs(carrier.id).map((lob) => (
                              <button
                                key={lob}
                                type="button"
                                onMouseDown={(e) => {
                                  // Use onMouseDown to prevent onBlur from firing first
                                  e.preventDefault();
                                  updateCarrierQuote(carrier.id, { lob });
                                  // Clear search term so the selected value shows
                                  setLobSearchTerms(prev => {
                                    const newState = { ...prev };
                                    delete newState[carrier.id];
                                    return newState;
                                  });
                                  setLobDropdownOpen(prev => ({ ...prev, [carrier.id]: false }));
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                {lob}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-0.5">
                        <DollarSign className="w-3 h-3" />
                        Quoted Amount
                      </label>
                      <input
                        type="number"
                        value={quote?.amount || ''}
                        onChange={(e) => updateCarrierQuote(carrier.id, { amount: parseFloat(e.target.value) || null })}
                        className="input-field text-sm py-1 px-2"
                        placeholder="Enter amount"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-0.5">
                        <MessageSquare className="w-3 h-3" />
                        Remarks
                      </label>
                      <textarea
                        value={quote?.remarks || ''}
                        onChange={(e) => updateCarrierQuote(carrier.id, { remarks: e.target.value })}
                        className="input-field text-sm py-1 px-2"
                        rows={2}
                        placeholder="Add remarks..."
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      ) : (
        <div className="card p-4 bg-gray-50">
          <p className="text-gray-600 text-center text-sm">
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

      {/* Save Button - At the bottom of the page */}
      {submission.status !== 'submitted' && submission.status !== 'bound' && (
        <div className="mt-6 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {saved && <span className="text-green-600 font-medium">✓ Saved!</span>}
              {!saved && <span>Make changes and click Save</span>}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={saveSubmission}
                disabled={saving}
                className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      )}
    </div>
  );
}
