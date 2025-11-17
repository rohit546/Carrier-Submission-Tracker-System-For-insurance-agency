'use client';

import { useState, useEffect } from 'react';
import { BusinessType, Carrier, CarrierAppetite } from '@/lib/types';

export default function CarrierAppetiteManager() {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [appetites, setAppetites] = useState<CarrierAppetite[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBusinessType, setNewBusinessType] = useState('');
  const [newCarrier, setNewCarrier] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [btData, cData, aData] = await Promise.all([
        fetch('/api/business-types').then(r => r.json()),
        fetch('/api/carriers').then(r => r.json()),
        fetch('/api/carrier-appetite').then(r => r.json()),
      ]);
      
      setBusinessTypes(btData);
      setCarriers(cData);
      setAppetites(aData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addBusinessType() {
    if (!newBusinessType.trim()) return;
    
    try {
      const res = await fetch('/api/business-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBusinessType }),
      });
      
      if (res.ok) {
        const type = await res.json();
        setBusinessTypes([...businessTypes, type]);
        setNewBusinessType('');
      }
    } catch (error) {
      console.error('Failed to add business type:', error);
    }
  }

  async function addCarrier() {
    if (!newCarrier.trim()) return;
    
    try {
      const res = await fetch('/api/carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCarrier }),
      });
      
      if (res.ok) {
        const carrier = await res.json();
        setCarriers([...carriers, carrier]);
        setNewCarrier('');
      }
    } catch (error) {
      console.error('Failed to add carrier:', error);
    }
  }

  async function toggleAppetite(businessTypeId: string, carrierId: string) {
    const existing = appetites.find(
      a => a.businessTypeId === businessTypeId && a.carrierId === carrierId
    );
    
    const newAppetites = existing
      ? appetites.filter(
          a => !(a.businessTypeId === businessTypeId && a.carrierId === carrierId)
        )
      : [...appetites, { businessTypeId, carrierId }];
    
    try {
      const res = await fetch('/api/carrier-appetite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppetites),
      });
      
      if (res.ok) {
        setAppetites(newAppetites);
      }
    } catch (error) {
      console.error('Failed to update appetite:', error);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Add Business Type */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Add Business Type</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBusinessType}
            onChange={(e) => setNewBusinessType(e.target.value)}
            placeholder="e.g., Restaurant, Gas Station"
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addBusinessType()}
          />
          <button onClick={addBusinessType} className="btn-primary whitespace-nowrap">
            Add Type
          </button>
        </div>
      </div>

      {/* Add Carrier */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Add Carrier</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCarrier}
            onChange={(e) => setNewCarrier(e.target.value)}
            placeholder="Carrier name"
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addCarrier()}
          />
          <button onClick={addCarrier} className="btn-primary whitespace-nowrap">
            Add Carrier
          </button>
        </div>
      </div>

      {/* Carrier Appetite Matrix */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-black mb-6">Carrier Appetite Configuration</h3>
        
        {businessTypes.length === 0 || carriers.length === 0 ? (
          <p className="text-gray-500">Add business types and carriers first</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold text-black">Business Type</th>
                  {carriers.map((carrier) => (
                    <th key={carrier.id} className="text-center py-3 px-4 font-semibold text-black">
                      {carrier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {businessTypes.map((bt) => (
                  <tr key={bt.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-black">{bt.name}</td>
                    {carriers.map((carrier) => {
                      const hasAppetite = appetites.some(
                        a => a.businessTypeId === bt.id && a.carrierId === carrier.id
                      );
                      return (
                        <td key={carrier.id} className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleAppetite(bt.id, carrier.id)}
                            className={`w-6 h-6 border-2 rounded-sm transition-colors ${
                              hasAppetite
                                ? 'bg-black border-black'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {hasAppetite && '✓'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
