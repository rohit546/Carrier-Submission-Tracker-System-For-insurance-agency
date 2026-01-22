'use client';

import { useState, useEffect } from 'react';
import { NonStandardSubmission, NonStandardQuote, NonStandardFollowup } from '@/lib/types';
import { Mail, DollarSign, MessageSquare, Phone, Calendar, Plus, CheckCircle, X, AlertCircle, RefreshCw } from 'lucide-react';

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

  useEffect(() => {
    loadSubmissions();
    // Refresh every 5 seconds to catch new submissions
    const interval = setInterval(() => {
      loadSubmissions();
    }, 5000);
    return () => clearInterval(interval);
  }, [submissionId]);

  async function loadSubmissions() {
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
    }
  }

  async function handleAddQuote(nonStandardId: string) {
    if (!newQuote.carrier || !newQuote.email || !newQuote.received_date) {
      alert('Please fill in carrier, email, and received date');
      return;
    }

    try {
      const response = await fetch(`/api/non-standard/${nonStandardId}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuote),
      });

      if (response.ok) {
        await loadSubmissions();
        setNewQuote({});
        setShowAddQuote(prev => ({ ...prev, [nonStandardId]: false }));
      } else {
        alert('Failed to add quote');
      }
    } catch (error) {
      console.error('Error adding quote:', error);
      alert('Error adding quote');
    }
  }

  async function handleAddFollowup(nonStandardId: string) {
    if (!newFollowup.date || !newFollowup.type || !newFollowup.with || !newFollowup.notes) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`/api/non-standard/${nonStandardId}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFollowup),
      });

      if (response.ok) {
        await loadSubmissions();
        setNewFollowup({});
        setShowAddFollowup(prev => ({ ...prev, [nonStandardId]: false }));
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
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-black">{submission.subject}</h3>
                  <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">From:</span> {submission.from_email}</p>
                  <p><span className="font-medium">To:</span> {submission.to_emails.join(', ')}</p>
                  {submission.cc_emails.length > 0 && (
                    <p><span className="font-medium">CC:</span> {submission.cc_emails.join(', ')}</p>
                  )}
                  <p><span className="font-medium">Sent:</span> {new Date(submission.sent_at).toLocaleString()}</p>
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

            {/* Quotes Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-black flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Quotes ({submission.quotes?.length || 0})
                </h4>
                <button
                  onClick={() => setShowAddQuote(prev => ({ ...prev, [submission.id]: !prev[submission.id] }))}
                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Quote
                </button>
              </div>

              {showAddQuote[submission.id] && (
                <div className="bg-gray-50 p-3 rounded mb-2 space-y-2">
                  <input
                    type="text"
                    placeholder="Carrier Name"
                    value={newQuote.carrier || ''}
                    onChange={(e) => setNewQuote({ ...newQuote, carrier: e.target.value })}
                    className="input-field text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Carrier Email"
                    value={newQuote.email || ''}
                    onChange={(e) => setNewQuote({ ...newQuote, email: e.target.value })}
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
                      onClick={() => handleAddQuote(submission.id)}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNewQuote({});
                        setShowAddQuote(prev => ({ ...prev, [submission.id]: false }));
                      }}
                      className="btn-secondary text-sm px-3 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {submission.quotes && submission.quotes.length > 0 ? (
                <div className="space-y-2">
                  {submission.quotes.map((quote, idx) => (
                    <div key={quote.id || idx} className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-black">{quote.carrier}</p>
                          <p className="text-sm text-gray-600">{quote.email}</p>
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

            {/* Followups Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-black flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Followups ({submission.followups?.length || 0})
                </h4>
                <button
                  onClick={() => setShowAddFollowup(prev => ({ ...prev, [submission.id]: !prev[submission.id] }))}
                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Followup
                </button>
              </div>

              {showAddFollowup[submission.id] && (
                <div className="bg-gray-50 p-3 rounded mb-2 space-y-2">
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
                      onClick={() => handleAddFollowup(submission.id)}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNewFollowup({});
                        setShowAddFollowup(prev => ({ ...prev, [submission.id]: false }));
                      }}
                      className="btn-secondary text-sm px-3 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {submission.followups && submission.followups.length > 0 ? (
                <div className="space-y-2">
                  {submission.followups
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
        ))}
      </div>
    </div>
  );
}
