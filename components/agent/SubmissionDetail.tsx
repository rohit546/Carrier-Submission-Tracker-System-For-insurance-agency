'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Submission, BusinessType, Carrier, CarrierAppetite, CarrierQuote } from '@/lib/types';
import { DollarSign, MessageSquare, CheckCircle } from 'lucide-react';

interface SubmissionDetailProps {
  submission: Submission;
}

export default function SubmissionDetail({ submission: initialSubmission }: SubmissionDetailProps) {
  const [submission, setSubmission] = useState(initialSubmission);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [appetites, setAppetites] = useState<CarrierAppetite[]>([]);
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
      
      // Load carrier appetite for this specific business type
      const as = await fetch(`/api/carrier-appetite/business-type/${initialSubmission.businessTypeId}`)
        .then(r => r.json())
        .catch(() => []);
      
      setAppetites(as || []);
      if (updatedSubmission) setSubmission(updatedSubmission);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  const getBusinessTypeName = () => {
    return businessTypes.find(bt => bt.id === submission.businessTypeId)?.name || '';
  };

  const getSuggestedCarriers = () => {
    // Get carriers that have appetite for this business type
    const appetiteCarriers = appetites
      .filter(a => a.businessTypeId === submission.businessTypeId && a.status === 'active')
      .map(a => a.carrierId);
    
    return carriers.filter(carrier => appetiteCarriers.includes(carrier.id));
  };

  const getCarrierQuote = (carrierId: string): CarrierQuote | null => {
    return submission.carriers.find(c => c.carrierId === carrierId) || null;
  };

  const isCarrierSuggested = (carrierId: string) => {
    return appetites.some(
      a => a.carrierId === carrierId && a.businessTypeId === submission.businessTypeId
    );
  };

  async function updateCarrierQuote(carrierId: string, updates: Partial<CarrierQuote>) {
    const existing = submission.carriers.find(c => c.carrierId === carrierId);
    
    const newCarriers = existing
      ? submission.carriers.map(c =>
          c.carrierId === carrierId ? { ...c, ...updates } : c
        )
      : [...submission.carriers, { carrierId, quoted: false, amount: null, remarks: '', selected: false, ...updates }];
    
    try {
      await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carriers: newCarriers }),
      });
      
      setSubmission({ ...submission, carriers: newCarriers });
    } catch (error) {
      console.error('Failed to update carrier quote:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-black mb-2">{submission.businessName}</h2>
          <p className="text-gray-600">{getBusinessTypeName()}</p>
        </div>
        <Link href="/agent" className="btn-secondary text-sm">
          Back to List
        </Link>
      </div>

      {/* All Carriers */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-black mb-4">All Carriers</h3>
        
        {getSuggestedCarriers().length === 0 ? (
          <p className="text-gray-500 text-sm">No carriers available for this business type</p>
        ) : (
          <div className="space-y-4">
            {getSuggestedCarriers().map((carrier) => {
              const quote = getCarrierQuote(carrier.id);
              const quoted = quote?.quoted || false;
              const selected = quote?.selected || false;
              
              return (
                <div key={carrier.id} className="border border-gray-200 rounded-sm p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={quoted}
                        onChange={(e) => updateCarrierQuote(carrier.id, { quoted: e.target.checked })}
                        className="w-5 h-5 border-2 border-gray-300 rounded-sm checked:bg-black checked:border-black"
                      />
                      <h4 className="font-semibold text-black">{carrier.name}</h4>
                    </div>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => updateCarrierQuote(carrier.id, { selected: e.target.checked })}
                      className="w-5 h-5"
                      disabled={!quoted}
                    />
                  </div>

                  {quoted && (
                    <>
                      <div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
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
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                          <MessageSquare className="w-4 h-4" />
                          Remarks
                        </label>
                        <textarea
                          value={quote?.remarks || ''}
                          onChange={(e) => updateCarrierQuote(carrier.id, { remarks: e.target.value })}
                          className="input-field"
                          rows={3}
                          placeholder="Add remarks..."
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
