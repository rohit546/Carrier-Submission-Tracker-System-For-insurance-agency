'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessType } from '@/lib/types';
import GHLIntegration from './GHLIntegration';
import { Building2, Search } from 'lucide-react';

interface NewSubmissionFormProps {
  agentId: string;
}

interface GHLContact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  companyName?: string;
  website?: string;
}

export default function NewSubmissionForm({ agentId }: NewSubmissionFormProps) {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [selectedBusinessType, setSelectedBusinessType] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGHL, setShowGHL] = useState(false);
  const [ghlContact, setGhlContact] = useState<GHLContact | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadBusinessTypes();
  }, []);

  async function loadBusinessTypes() {
    try {
      const types = await fetch('/api/business-types').then(r => r.json());
      setBusinessTypes(types);
    } catch (error) {
      console.error('Failed to load business types:', error);
    }
  }

  function handleGHLSelect(contact: GHLContact) {
    setGhlContact(contact);
    // Auto-populate business name from GHL contact
    if (contact.companyName) {
      setBusinessName(contact.companyName);
    } else if (contact.name) {
      setBusinessName(contact.name);
    } else if (contact.firstName || contact.lastName) {
      setBusinessName(`${contact.firstName || ''} ${contact.lastName || ''}`.trim());
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          businessTypeId: selectedBusinessType,
          status: 'draft',
          carriers: [],
          ghlContactId: ghlContact?.id, // Store GHL contact ID for reference
        }),
      });

      if (res.ok) {
        const submission = await res.json();
        router.push(`/agent/submission/${submission.id}`);
      } else {
        setError('Failed to create submission');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {showGHL && (
        <GHLIntegration
          onSelect={handleGHLSelect}
          onClose={() => setShowGHL(false)}
        />
      )}

      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">New Submission</h2>
          <button
            type="button"
            onClick={() => setShowGHL(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search GoHighLevel
          </button>
        </div>

        {ghlContact && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Contact Selected from GHL</p>
                  <p className="text-sm text-green-700 mt-1">
                    {ghlContact.companyName || ghlContact.name || `${ghlContact.firstName || ''} ${ghlContact.lastName || ''}`.trim()}
                    {ghlContact.email && ` • ${ghlContact.email}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGhlContact(null);
                  setBusinessName('');
                }}
                className="text-green-700 hover:text-green-900 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Business Type *
            </label>
            <select
            value={selectedBusinessType}
            onChange={(e) => setSelectedBusinessType(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select business type</option>
            {businessTypes.map((bt) => (
              <option key={bt.id} value={bt.id}>
                {bt.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Business Name *
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="input-field"
            placeholder="Enter business name"
            required
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create Submission'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
      </div>
    </>
  );
}
