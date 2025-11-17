'use client';

import { useState, useEffect } from 'react';
import { BusinessType, Carrier } from '@/lib/types';
import { Edit2, X, Save, Plus } from 'lucide-react';

interface CarrierAppetiteDetail {
  id?: string;
  carrierId: string;
  businessTypeId: string;
  geographicRestrictions: string[];
  exclusions: string[];
  status: string;
  coverageDetails: {
    glLimit?: string;
    property?: boolean;
    liability?: boolean;
    notes?: string;
  };
  operationalCriteria: {
    minHours?: number;
    maxHours?: number;
    requirements?: string;
  };
  contactInfo: {
    name?: string;
    email?: string;
    phone?: string;
  };
  notes: string;
}

export default function EnhancedCarrierAppetiteManager() {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [appetites, setAppetites] = useState<Record<string, CarrierAppetiteDetail>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<CarrierAppetiteDetail | null>(null);
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
      
      // Convert appetite array to map for easy lookup
      const appetiteMap: Record<string, CarrierAppetiteDetail> = {};
      aData.forEach((a: any) => {
        const key = `${a.carrierId}-${a.businessTypeId}`;
        appetiteMap[key] = {
          id: a.id,
          carrierId: a.carrierId,
          businessTypeId: a.businessTypeId,
          geographicRestrictions: a.geographicRestrictions || [],
          exclusions: a.exclusions || [],
          status: a.status || 'active',
          coverageDetails: a.coverageDetails || {},
          operationalCriteria: a.operationalCriteria || {},
          contactInfo: a.contactInfo || {},
          notes: a.notes || '',
        };
      });
      setAppetites(appetiteMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getAppetiteKey(carrierId: string, businessTypeId: string): string {
    return `${carrierId}-${businessTypeId}`;
  }

  function hasAppetite(carrierId: string, businessTypeId: string): boolean {
    return !!appetites[getAppetiteKey(carrierId, businessTypeId)];
  }

  function openEditModal(carrierId: string, businessTypeId: string) {
    const key = getAppetiteKey(carrierId, businessTypeId);
    const existing = appetites[key];
    
    setEditData(existing || {
      carrierId,
      businessTypeId,
      geographicRestrictions: [],
      exclusions: [],
      status: 'active',
      coverageDetails: {},
      operationalCriteria: {},
      contactInfo: {},
      notes: '',
    });
    setEditing(key);
  }

  function closeEditModal() {
    setEditing(null);
    setEditData(null);
  }

  async function saveAppetite() {
    if (!editData) return;

    try {
      const res = await fetch('/api/carrier-appetite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        const saved = await res.json();
        const key = getAppetiteKey(editData.carrierId, editData.businessTypeId);
        setAppetites({
          ...appetites,
          [key]: saved,
        });
        closeEditModal();
      }
    } catch (error) {
      console.error('Failed to save appetite:', error);
    }
  }

  async function deleteAppetite(carrierId: string, businessTypeId: string) {
    if (!confirm('Remove this carrier appetite?')) return;

    try {
      const res = await fetch('/api/carrier-appetite', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierId, businessTypeId }),
      });

      if (res.ok) {
        const key = getAppetiteKey(carrierId, businessTypeId);
        const newAppetites = { ...appetites };
        delete newAppetites[key];
        setAppetites(newAppetites);
      }
    } catch (error) {
      console.error('Failed to delete appetite:', error);
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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const currentAppetite = editing && editData ? editData : null;
  const carrierName = currentAppetite ? carriers.find(c => c.id === currentAppetite.carrierId)?.name : '';
  const businessTypeName = currentAppetite ? businessTypes.find(bt => bt.id === currentAppetite.businessTypeId)?.name : '';

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
        <p className="text-sm text-gray-600 mb-4">Click on a cell to configure detailed appetite information</p>
        
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
                      const hasApp = hasAppetite(carrier.id, bt.id);
                      const appetite = appetites[getAppetiteKey(carrier.id, bt.id)];
                      return (
                        <td key={carrier.id} className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(carrier.id, bt.id)}
                              className={`w-8 h-8 border-2 rounded-sm transition-colors flex items-center justify-center ${
                                hasApp
                                  ? 'bg-black border-black text-white'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              title={hasApp ? 'Edit appetite details' : 'Add appetite'}
                            >
                              {hasApp ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                            {hasApp && appetite?.status && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                appetite.status === 'active' ? 'bg-green-100 text-green-700' :
                                appetite.status === 'no_appetite' ? 'bg-red-100 text-red-700' :
                                appetite.status === 'limited' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {appetite.status}
                              </span>
                            )}
                          </div>
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

      {/* Edit Modal */}
      {editing && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-black">
                  Configure Appetite: {carrierName} → {businessTypeName}
                </h3>
                <p className="text-sm text-gray-600 mt-1">Add detailed playbook information</p>
              </div>
              <button onClick={closeEditModal} className="text-gray-500 hover:text-black">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="limited">Limited</option>
                  <option value="no_appetite">No Appetite</option>
                  <option value="unresponsive">Unresponsive</option>
                </select>
              </div>

              {/* Geographic Restrictions */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Geographic Restrictions (comma-separated states)
                </label>
                <input
                  type="text"
                  value={editData.geographicRestrictions.join(', ')}
                  onChange={(e) => setEditData({
                    ...editData,
                    geographicRestrictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="TX, LA, CA"
                  className="input-field"
                />
              </div>

              {/* Exclusions */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Exclusions (comma-separated)
                </label>
                <input
                  type="text"
                  value={editData.exclusions.join(', ')}
                  onChange={(e) => setEditData({
                    ...editData,
                    exclusions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="firearms, fast food chains"
                  className="input-field"
                />
              </div>

              {/* Coverage Details */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-black mb-3">Coverage Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">GL Limit</label>
                    <input
                      type="text"
                      value={editData.coverageDetails.glLimit || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        coverageDetails: { ...editData.coverageDetails, glLimit: e.target.value }
                      })}
                      placeholder="100k"
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.coverageDetails.property || false}
                        onChange={(e) => setEditData({
                          ...editData,
                          coverageDetails: { ...editData.coverageDetails, property: e.target.checked }
                        })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Property Coverage</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.coverageDetails.liability || false}
                        onChange={(e) => setEditData({
                          ...editData,
                          coverageDetails: { ...editData.coverageDetails, liability: e.target.checked }
                        })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Liability Coverage</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Operational Criteria */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-black mb-3">Operational Criteria</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Min Hours</label>
                    <input
                      type="number"
                      value={editData.operationalCriteria.minHours || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        operationalCriteria: { ...editData.operationalCriteria, minHours: parseInt(e.target.value) || undefined }
                      })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Max Hours</label>
                    <input
                      type="number"
                      value={editData.operationalCriteria.maxHours || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        operationalCriteria: { ...editData.operationalCriteria, maxHours: parseInt(e.target.value) || undefined }
                      })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-black mb-2">Requirements</label>
                  <textarea
                    value={editData.operationalCriteria.requirements || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      operationalCriteria: { ...editData.operationalCriteria, requirements: e.target.value }
                    })}
                    className="input-field"
                    rows={2}
                    placeholder="e.g., 18+ hours only, must have security system"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-black mb-3">Contact Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Contact Name</label>
                    <input
                      type="text"
                      value={editData.contactInfo.name || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        contactInfo: { ...editData.contactInfo, name: e.target.value }
                      })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Email</label>
                    <input
                      type="email"
                      value={editData.contactInfo.email || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        contactInfo: { ...editData.contactInfo, email: e.target.value }
                      })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editData.contactInfo.phone || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        contactInfo: { ...editData.contactInfo, phone: e.target.value }
                      })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-black mb-2">Notes</label>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="input-field"
                  rows={4}
                  placeholder="Additional notes, restrictions, or important information..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center border-t pt-4">
                <button
                  onClick={() => deleteAppetite(editData.carrierId, editData.businessTypeId)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove Appetite
                </button>
                <div className="flex gap-3">
                  <button onClick={closeEditModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={saveAppetite} className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
