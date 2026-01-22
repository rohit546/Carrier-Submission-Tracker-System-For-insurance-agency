'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { NonStandardSubmission, NonStandardQuote, NonStandardFollowup, NonStandardCarrier } from '@/lib/types';
import { Mail, DollarSign, MessageSquare, Phone, Calendar, Plus, CheckCircle, X, AlertCircle, RefreshCw, Building2 } from 'lucide-react';

interface NonStandardMarketSectionProps {
  submissionId: string;
}

export default function NonStandardMarketSection({ submissionId }: NonStandardMarketSectionProps) {
  const [submissions, setSubmissions] = useState<NonStandardSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddQuote, setShowAddQuote] = useState<{ [key: string]: boolean }>({});
  const [showAddFollowup, setShowAddFollowup] = useState<{ [key: string]: boolean }>({});
  const [newQuote, setNewQuote] = useState<Partial<NonStandardQuote>>({});
  const [newFollowup, setNewFollowup] = useState<Partial<NonStandardFollowup>>({});
  const loadingRef = useRef(false);

  const loadSubmissions = useCallback(async () => {
    // Prevent duplicate calls
    if (loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    
    try {
      const response = await fetch(`/api/submissions/${submissionId}/non-standard`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else if (response.status === 500) {
        // Table doesn't exist yet - silently fail
        console.warn('Non-standard submissions table not found. Please run migration.');
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Failed to load non-standard submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [submissionId]);

  useEffect(() => {
    loadSubmissions();
    // Only refresh when component mounts or submissionId changes
  }, [loadSubmissions]);

  async function handleAddQuote(nonStandardId: string, carrierEmail: string) {
    if (!newQuote.carrier || !newQuote.received_date) {
      alert('Please fill in carrier name and received date');
      return;
    }

    try {
      const response = await fetch(`/api/non-standard/${nonStandardId}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuote,
          carrier_email: carrierEmail,
        }),
      });

      if (response.ok) {
        await loadSubmissions();
        setNewQuote({});
        setShowAddQuote(prev => {
          const newState = { ...prev };
          delete newState[`${nonStandardId}-${carrierEmail}`];
          return newState;
        });
      } else {
        alert('Failed to add quote');
      }
    } catch (error) {
      console.error('Error adding quote:', error);
      alert('Error adding quote');
    }
  }

  async function handleAddFollowup(nonStandardId: string, carrierEmail: string) {
    if (!newFollowup.date || !newFollowup.type || !newFollowup.with || !newFollowup.notes) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`/api/non-standard/${nonStandardId}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newFollowup,
          carrier_email: carrierEmail,
        }),
      });

      if (response.ok) {
        await loadSubmissions();
        setNewFollowup({});
        setShowAddFollowup(prev => {
          const newState = { ...prev };
          delete newState[`${nonStandardId}-${carrierEmail}`];
          return newState;
        });
      } else {
        alert('Failed to add followup');
      }
    } catch (error) {
      console.error('Error adding followup:', error);
      alert('Error adding followup');
    }
  }

  async function handleUpdateStatus(nonStandardId: string, status: NonStandardSubmission['status']) {
    try {
      const response = await fetch(`/api/non-standard/${nonStandardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await loadSubmissions();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'responded': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'quoted': return 'bg-green-100 text-green-700 border-green-300';
      case 'declined': return 'bg-red-100 text-red-700 border-red-300';
      case 'bound': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Helper to get quotes for a specific carrier
  const getQuotesForCarrier = (submission: NonStandardSubmission, carrierEmail: string) => {
    return (submission.quotes || []).filter(q => q.carrier_email === carrierEmail);
  };

  // Helper to get followups for a specific carrier
  const getFollowupsForCarrier = (submission: NonStandardSubmission, carrierEmail: string) => {
    return (submission.followups || []).filter(f => f.carrier_email === carrierEmail);
  };

  if (loading) {
    return (
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-black">Non-Standard Market</h2>
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Always show the section, even if empty, so users know where to look
  if (submissions.length === 0) {
    return (
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-black">Non-Standard Market</h2>
        </div>
        <p className="text-gray-500 text-sm">No non-standard market submissions yet. Send an email via Auto Submit to create one.</p>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-black">Non-Standard Market</h2>
          {submissions.length > 0 && (
            <span className="text-sm text-gray-500">({submissions.length})</span>
          )}
        </div>
        <button
          onClick={() => loadSubmissions()}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-6">
        {submissions.map((submission) => (
          <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
            {/* Main Email Header */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-black">{submission.subject}</h3>
                  <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">From:</span> {submission.from_email}</p>
                  <p><span className="font-medium">Sent:</span> {new Date(submission.sent_at).toLocaleString()}</p>
                  {submission.cc_emails.length > 0 && (
                    <p><span className="font-medium">CC:</span> {submission.cc_emails.join(', ')}</p>
                  )}
                </div>
              </div>
              <select
                value={submission.status}
                onChange={(e) => handleUpdateStatus(submission.id, e.target.value as NonStandardSubmission['status'])}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="sent">Sent</option>
                <option value="responded">Responded</option>
                <option value="quoted">Quoted</option>
                <option value="declined">Declined</option>
                <option value="bound">Bound</option>
              </select>
            </div>

            {/* Carrier Subsections */}
            {submission.carriers && submission.carriers.length > 0 ? (
              <div className="space-y-4">
                {submission.carriers.map((carrier) => {
                  const carrierQuotes = getQuotesForCarrier(submission, carrier.email);
                  const carrierFollowups = getFollowupsForCarrier(submission, carrier.email);
                  const quoteKey = `${submission.id}-${carrier.email}`;

                  return (
                    <div key={carrier.email} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      {/* Carrier Header */}
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-300">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-black">{carrier.company}</h4>
                          <p className="text-sm text-gray-600">{carrier.email}</p>
                        </div>
                      </div>

                      {/* Quotes Section for this Carrier */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-black flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Quotes ({carrierQuotes.length})
                          </h5>
                          <button
                            onClick={() => setShowAddQuote(prev => ({ ...prev, [quoteKey]: !prev[quoteKey] }))}
                            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add Quote
                          </button>
                        </div>

                        {showAddQuote[quoteKey] && (
                          <div className="bg-white p-3 rounded mb-2 space-y-2 border border-gray-200">
                            <input
                              type="text"
                              placeholder="Carrier Name"
                              value={newQuote.carrier || ''}
                              onChange={(e) => setNewQuote({ ...newQuote, carrier: e.target.value })}
                              className="input-field text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Amount"
                              value={newQuote.amount || ''}
                              onChange={(e) => setNewQuote({ ...newQuote, amount: parseFloat(e.target.value) || undefined })}
                              className="input-field text-sm"
                            />
                            <input
                              type="date"
                              placeholder="Received Date"
                              value={newQuote.received_date || ''}
                              onChange={(e) => setNewQuote({ ...newQuote, received_date: e.target.value })}
                              className="input-field text-sm"
                            />
                            <textarea
                              placeholder="Notes"
                              value={newQuote.notes || ''}
                              onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
                              className="input-field text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddQuote(submission.id, carrier.email)}
                                className="btn-primary text-sm px-3 py-1"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setNewQuote({});
                                  setShowAddQuote(prev => {
                                    const newState = { ...prev };
                                    delete newState[quoteKey];
                                    return newState;
                                  });
                                }}
                                className="btn-secondary text-sm px-3 py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {carrierQuotes.length > 0 ? (
                          <div className="space-y-2">
                            {carrierQuotes.map((quote, idx) => (
                              <div key={quote.id || idx} className="bg-green-50 border border-green-200 rounded p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-black">{quote.carrier}</p>
                                    {quote.amount && (
                                      <p className="text-sm font-semibold text-green-700">${quote.amount.toLocaleString()}</p>
                                    )}
                                    <p className="text-xs text-gray-500">Received: {quote.received_date}</p>
                                    {quote.notes && <p className="text-sm text-gray-600 mt-1">{quote.notes}</p>}
                                  </div>
                                  {quote.status && (
                                    <span className="text-xs px-2 py-1 bg-white rounded border border-green-300">
                                      {quote.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No quotes received yet</p>
                        )}
                      </div>

                      {/* Followups Section for this Carrier */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-black flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Followups ({carrierFollowups.length})
                          </h5>
                          <button
                            onClick={() => setShowAddFollowup(prev => ({ ...prev, [quoteKey]: !prev[quoteKey] }))}
                            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add Followup
                          </button>
                        </div>

                        {showAddFollowup[quoteKey] && (
                          <div className="bg-white p-3 rounded mb-2 space-y-2 border border-gray-200">
                            <input
                              type="datetime-local"
                              placeholder="Date"
                              value={newFollowup.date || ''}
                              onChange={(e) => setNewFollowup({ ...newFollowup, date: e.target.value })}
                              className="input-field text-sm"
                            />
                            <select
                              value={newFollowup.type || ''}
                              onChange={(e) => setNewFollowup({ ...newFollowup, type: e.target.value as any })}
                              className="input-field text-sm"
                            >
                              <option value="">Select type...</option>
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="meeting">Meeting</option>
                              <option value="note">Note</option>
                            </select>
                            <input
                              type="text"
                              placeholder="With (email/name)"
                              value={newFollowup.with || ''}
                              onChange={(e) => setNewFollowup({ ...newFollowup, with: e.target.value })}
                              className="input-field text-sm"
                            />
                            <textarea
                              placeholder="Notes"
                              value={newFollowup.notes || ''}
                              onChange={(e) => setNewFollowup({ ...newFollowup, notes: e.target.value })}
                              className="input-field text-sm"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddFollowup(submission.id, carrier.email)}
                                className="btn-primary text-sm px-3 py-1"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setNewFollowup({});
                                  setShowAddFollowup(prev => {
                                    const newState = { ...prev };
                                    delete newState[quoteKey];
                                    return newState;
                                  });
                                }}
                                className="btn-secondary text-sm px-3 py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {carrierFollowups.length > 0 ? (
                          <div className="space-y-2">
                            {carrierFollowups
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((followup, idx) => (
                                <div key={followup.id || idx} className="bg-blue-50 border border-blue-200 rounded p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        {followup.type === 'email' && <Mail className="w-4 h-4 text-blue-600" />}
                                        {followup.type === 'phone' && <Phone className="w-4 h-4 text-blue-600" />}
                                        {followup.type === 'meeting' && <Calendar className="w-4 h-4 text-blue-600" />}
                                        {followup.type === 'note' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                                        <span className="font-medium text-black capitalize">{followup.type}</span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(followup.date).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600"><span className="font-medium">With:</span> {followup.with}</p>
                                      <p className="text-sm text-gray-700 mt-1">{followup.notes}</p>
                                      <p className="text-xs text-gray-400 mt-1">By: {followup.created_by}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No followups yet</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No carriers listed</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
