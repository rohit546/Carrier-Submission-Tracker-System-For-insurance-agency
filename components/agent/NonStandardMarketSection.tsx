'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { NonStandardSubmission, NonStandardQuote, NonStandardFollowup, NonStandardCarrier } from '@/lib/types';
import { Mail, DollarSign, MessageSquare, Phone, Calendar, Plus, RefreshCw, Building2 } from 'lucide-react';

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
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    
    try {
      const response = await fetch(`/api/submissions/${submissionId}/non-standard`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else if (response.status === 500) {
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
  }, [loadSubmissions]);

  async function handleAddQuote(nonStandardId: string, carrierEmail: string, carrierCompany: string) {
    if (!newQuote.received_date) {
      alert('Please fill in received date');
      return;
    }

    try {
      const response = await fetch(`/api/non-standard/${nonStandardId}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier_email: carrierEmail,
          carrier: carrierCompany, // Use carrier company name
          amount: newQuote.amount,
          received_date: newQuote.received_date,
          notes: newQuote.notes,
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
    if (!newFollowup.date || !newFollowup.notes) {
      alert('Please fill in date and notes');
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

  const getQuoteForCarrier = (submission: NonStandardSubmission, carrierEmail: string): NonStandardQuote | null => {
    const quotes = (submission.quotes || []).filter(q => q.carrier_email === carrierEmail);
    return quotes.length > 0 ? quotes[0] : null; // Only one quote per carrier
  };

  const getFollowupsForCarrier = (submission: NonStandardSubmission, carrierEmail: string) => {
    return (submission.followups || []).filter(f => f.carrier_email === carrierEmail);
  };

  if (loading) {
    return (
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base font-bold text-black">Non-Standard Market</h2>
        </div>
        <p className="text-xs text-gray-600 mt-2">Loading...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base font-bold text-black">Non-Standard Market</h2>
        </div>
        <p className="text-xs text-gray-500 mt-2">No non-standard market submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base font-bold text-black">Non-Standard Market</h2>
          <span className="text-xs text-gray-500">({submissions.length})</span>
        </div>
        <button
          onClick={() => loadSubmissions()}
          className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
          title="Refresh"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {submissions.map((submission) => {
          const totalCarriers = submission.carriers?.length || 0;
          const totalFollowups = submission.followups?.length || 0;

          return (
            <div key={submission.id} className="border border-gray-200 rounded-sm p-3 space-y-2">
              {/* Compact Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-black truncate">{submission.subject}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p><span className="font-medium">From:</span> {submission.from_email}</p>
                    <p><span className="font-medium">Sent:</span> {new Date(submission.sent_at).toLocaleDateString()}</p>
                    {totalCarriers > 0 && (
                      <p className="text-gray-500">{totalCarriers} carrier(s) • {totalFollowups} followup(s)</p>
                    )}
                  </div>
                </div>
                <select
                  value={submission.status}
                  onChange={(e) => handleUpdateStatus(submission.id, e.target.value as NonStandardSubmission['status'])}
                  className="text-xs border border-gray-300 rounded px-2 py-1 ml-2"
                >
                  <option value="sent">Sent</option>
                  <option value="responded">Responded</option>
                  <option value="quoted">Quoted</option>
                  <option value="declined">Declined</option>
                  <option value="bound">Bound</option>
                </select>
              </div>

              {/* Carrier Cards - Always Visible */}
              {submission.carriers && submission.carriers.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
                  {submission.carriers.map((carrier) => {
                    const carrierQuote = getQuoteForCarrier(submission, carrier.email);
                    const carrierFollowups = getFollowupsForCarrier(submission, carrier.email);
                    const carrierKey = `${submission.id}-${carrier.email}`;

                    return (
                      <div key={carrier.email} className="border border-gray-200 rounded-sm p-2.5 space-y-2 bg-gray-50/30">
                        {/* Carrier Header */}
                        <div className="border-b border-gray-200 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <h4 className="font-semibold text-black text-xs truncate">{carrier.company}</h4>
                          </div>
                          <p className="text-xs text-gray-600 truncate mt-0.5">{carrier.email}</p>
                        </div>

                        {/* Quote Section - Always Visible */}
                        <div className="border-b border-gray-200 pb-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <h5 className="font-medium text-black text-xs flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Quote
                            </h5>
                            <button
                              onClick={() => {
                                if (carrierQuote) {
                                  // Pre-fill form with existing quote for editing
                                  setNewQuote({
                                    amount: carrierQuote.amount,
                                    received_date: carrierQuote.received_date,
                                    notes: carrierQuote.notes,
                                  });
                                }
                                setShowAddQuote(prev => ({ ...prev, [carrierKey]: !prev[carrierKey] }));
                              }}
                              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                            >
                              <Plus className="w-3 h-3" />
                              {carrierQuote ? 'Edit' : 'Add'}
                            </button>
                          </div>

                          {showAddQuote[carrierKey] && (
                            <div className="bg-white p-2 rounded mb-1.5 space-y-1.5 border border-gray-200">
                              <input
                                type="number"
                                placeholder="Amount"
                                value={newQuote.amount || ''}
                                onChange={(e) => setNewQuote({ ...newQuote, amount: parseFloat(e.target.value) || undefined })}
                                className="input-field text-xs px-2 py-1"
                              />
                              <input
                                type="date"
                                placeholder="Received Date"
                                value={newQuote.received_date || ''}
                                onChange={(e) => setNewQuote({ ...newQuote, received_date: e.target.value })}
                                className="input-field text-xs px-2 py-1"
                                required
                              />
                              <textarea
                                placeholder="Notes (optional)"
                                value={newQuote.notes || ''}
                                onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
                                className="input-field text-xs px-2 py-1"
                                rows={2}
                              />
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleAddQuote(submission.id, carrier.email, carrier.company)}
                                  className="btn-primary text-xs px-2 py-0.5 flex-1"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setNewQuote({});
                                    setShowAddQuote(prev => {
                                      const newState = { ...prev };
                                      delete newState[carrierKey];
                                      return newState;
                                    });
                                  }}
                                  className="btn-secondary text-xs px-2 py-0.5 flex-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {carrierQuote && !showAddQuote[carrierKey] && (
                            <div className="bg-green-50 border border-green-200 rounded p-1.5">
                              <div className="space-y-0.5">
                                {carrierQuote.amount && (
                                  <p className="text-xs font-semibold text-green-700">${carrierQuote.amount.toLocaleString()}</p>
                                )}
                                {carrierQuote.received_date && (
                                  <p className="text-xs text-gray-600">Date: {carrierQuote.received_date}</p>
                                )}
                                {carrierQuote.notes && (
                                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{carrierQuote.notes}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {!carrierQuote && !showAddQuote[carrierKey] && (
                            <p className="text-xs text-gray-500 italic">No quote received</p>
                          )}
                        </div>

                        {/* Followups Section */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <h5 className="font-medium text-black text-xs flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Followups ({carrierFollowups.length})
                            </h5>
                            <button
                              onClick={() => setShowAddFollowup(prev => ({ ...prev, [carrierKey]: !prev[carrierKey] }))}
                              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </button>
                          </div>

                          {showAddFollowup[carrierKey] && (
                            <div className="bg-white p-2 rounded mb-1.5 space-y-1.5 border border-gray-200">
                              <input
                                type="datetime-local"
                                value={newFollowup.date || ''}
                                onChange={(e) => setNewFollowup({ ...newFollowup, date: e.target.value })}
                                className="input-field text-xs px-2 py-1"
                                placeholder="Date & Time"
                                required
                              />
                              <textarea
                                placeholder="Notes"
                                value={newFollowup.notes || ''}
                                onChange={(e) => setNewFollowup({ ...newFollowup, notes: e.target.value })}
                                className="input-field text-xs px-2 py-1"
                                rows={3}
                                required
                              />
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleAddFollowup(submission.id, carrier.email)}
                                  className="btn-primary text-xs px-2 py-0.5 flex-1"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setNewFollowup({});
                                    setShowAddFollowup(prev => {
                                      const newState = { ...prev };
                                      delete newState[carrierKey];
                                      return newState;
                                    });
                                  }}
                                  className="btn-secondary text-xs px-2 py-0.5 flex-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {carrierFollowups.length > 0 ? (
                            <div className="space-y-1">
                              {carrierFollowups
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((followup, idx) => (
                                  <div key={followup.id || idx} className="bg-blue-50 border border-blue-200 rounded p-1.5">
                                    <div className="space-y-0.5">
                                      <p className="text-xs text-gray-500">
                                        {new Date(followup.date).toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-700">{followup.notes}</p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">No followups yet</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
