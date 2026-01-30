'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Download, Check } from 'lucide-react';

interface PropertyDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onApply?: () => void;
}

export default function PropertyDataModal({ isOpen, onClose, data, onApply }: PropertyDataModalProps) {
  const [activeTab, setActiveTab] = useState<'attributes' | 'maps'>('attributes');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['address']));

  if (!isOpen || !data) return null;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getAttributeCount = (section: string): number => {
    if (section === 'address') {
      const matchedAddress = data.matchedAddress || {};
      const addressFields = ['street', 'city', 'state', 'zipcode'].filter(key => matchedAddress[key]);
      const otherFields = ['address', 'fullAddress', 'county', 'latitude', 'longitude'].filter(key => data[key]);
      return addressFields.length + otherFields.length;
    }
    if (section === 'mailing') {
      const mailingAddress = data.mailingAddress || {};
      const mailingFields = ['fullAddress', 'city', 'state', 'zipcode', 'county'].filter(key => mailingAddress[key]);
      return mailingFields.length + (data.fullMailingAddress ? 1 : 0);
    }
    if (section === 'owner') {
      return ['deedOwnerFullName', 'deedOwnerLastName', 'ownerFullName', 'corporationName', 'ownerOccupancyStatus', 'ownershipType', 'companyFlag'].filter(key => data[key]).length;
    }
    if (section === 'mortgage') {
      return ['lenderName', 'mortgageAmount', 'mortgageDueDate', 'mortgageRecordingDate', 'mortgageTerm', 'mortgageType'].filter(key => data[key]).length;
    }
    if (section === 'property') {
      return ['buildingSqft', 'assessedValue', 'yearBuilt', 'storiesNumber', 'numberOfBuildings', 'exteriorWalls', 'flooring', 'construction_type', 'canopy', 'canopySqft'].filter(key => data[key]).length;
    }
    if (section === 'landUse') {
      return ['landUseGroup', 'landUseStandard', 'legalDescription'].filter(key => data[key]).length;
    }
    if (section === 'coordinates') {
      const coords = data.coordinates || {};
      return (coords.lat ? 1 : 0) + (coords.lng ? 1 : 0) + (data.latitude ? 1 : 0) + (data.longitude ? 1 : 0);
    }
    return 0;
  };

  const getAllAttributesCount = (): number => {
    return Object.keys(data).filter(key => {
      const value = data[key];
      return value !== null && value !== undefined && value !== '' && typeof value !== 'object';
    }).length;
  };

  const renderSection = (title: string, sectionKey: string, fields: string[]) => {
    const isExpanded = expandedSections.has(sectionKey);
    const count = getAttributeCount(sectionKey);
    
    if (count === 0) return null;

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{title}</span>
            <span className="text-sm text-gray-500">({count} attrs)</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {isExpanded && (
          <div className="p-4 bg-white space-y-2">
            {fields.map((field) => {
              const value = data[field];
              if (value === null || value === undefined || value === '') return null;
              
              const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
              const displayKey = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
              
              return (
                <div key={field} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium text-gray-600 text-sm">{displayKey}:</span>
                  <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%] break-words">{displayValue}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Property Data & Maps</h2>
            <p className="text-sm text-emerald-100 mt-1">View fetched property information, maps, and enrichment data</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('attributes')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'attributes'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Attributes ({getAllAttributesCount()})
          </button>
          <button
            onClick={() => setActiveTab('maps')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'maps'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            3D Maps
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'attributes' ? (
            <div>
              {/* Property Enrichment Data Header */}
              <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Property Enrichment Data</h3>
                    <p className="text-sm text-gray-600 mt-1">{getAllAttributesCount()} attributes</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">97%</div>
                    <div className="text-xs text-gray-500">Completeness</div>
                  </div>
                </div>
              </div>

              {/* Collapsible Sections */}
              {(() => {
                const matchedAddress = data.matchedAddress || {};
                const hasAddressData = matchedAddress.street || matchedAddress.city || data.address || data.latitude;
                
                if (hasAddressData) {
                  return (
                    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                      <button
                        onClick={() => toggleSection('address')}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Address Information</span>
                          <span className="text-sm text-gray-500">({getAttributeCount('address')} attrs)</span>
                        </div>
                        {expandedSections.has('address') ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      
                      {expandedSections.has('address') && (
                        <div className="p-4 bg-white space-y-2">
                          {matchedAddress.street && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">Street:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%]">{matchedAddress.street}</span>
                            </div>
                          )}
                          {matchedAddress.city && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">City:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%]">{matchedAddress.city}</span>
                            </div>
                          )}
                          {matchedAddress.state && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">State:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%]">{matchedAddress.state}</span>
                            </div>
                          )}
                          {matchedAddress.zipcode && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">ZIP Code:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%]">{matchedAddress.zipcode}</span>
                            </div>
                          )}
                          {data.address && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">Full Address:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%] break-words">{data.address}</span>
                            </div>
                          )}
                          {(data.latitude || data.coordinates?.lat) && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">Latitude:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%]">{data.latitude || data.coordinates?.lat}</span>
                            </div>
                          )}
                          {(data.longitude || data.coordinates?.lng) && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">Longitude:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%]">{data.longitude || data.coordinates?.lng}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
              
              {(() => {
                const mailingAddress = data.mailingAddress || {};
                const hasMailingData = mailingAddress.fullAddress || data.fullMailingAddress;
                
                if (hasMailingData) {
                  return (
                    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                      <button
                        onClick={() => toggleSection('mailing')}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Mailing Address</span>
                          <span className="text-sm text-gray-500">({getAttributeCount('mailing')} attrs)</span>
                        </div>
                        {expandedSections.has('mailing') ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      
                      {expandedSections.has('mailing') && (
                        <div className="p-4 bg-white space-y-2">
                          {data.fullMailingAddress && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">Full Mailing Address:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%] break-words">{data.fullMailingAddress}</span>
                            </div>
                          )}
                          {mailingAddress.city && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">Mailing City:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%]">{mailingAddress.city}</span>
                            </div>
                          )}
                          {mailingAddress.state && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">Mailing State:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%]">{mailingAddress.state}</span>
                            </div>
                          )}
                          {mailingAddress.zipcode && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">Mailing ZIP:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%]">{mailingAddress.zipcode}</span>
                            </div>
                          )}
                          {mailingAddress.county && (
                            <div className="flex justify-between items-start py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-600 text-sm">Mailing County:</span>
                              <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%]">{mailingAddress.county}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
              
              {renderSection('Owner & Deed Information', 'owner', [
                'deedOwnerFullName', 'deedOwnerLastName', 'ownerFullName', 'corporationName', 
                'ownerOccupancyStatus', 'ownershipType', 'companyFlag'
              ])}
              
              {data.lenderName && renderSection('Mortgage & Lender Information', 'mortgage', [
                'lenderName', 'mortgageAmount', 'mortgageDueDate', 'mortgageRecordingDate', 
                'mortgageTerm', 'mortgageType'
              ])}
              
              {renderSection('Building & Property Details', 'property', [
                'buildingSqft', 'assessedValue', 'yearBuilt', 'storiesNumber', 'numberOfBuildings',
                'exteriorWalls', 'flooring', 'construction_type', 'canopy', 'canopySqft'
              ])}
              
              {renderSection('Land Use & Legal', 'landUse', [
                'landUseGroup', 'landUseStandard', 'legalDescription'
              ])}

              {/* All Other Attributes */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                <button
                  onClick={() => toggleSection('all')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">All Other Attributes</span>
                    <span className="text-sm text-gray-500">({getAllAttributesCount() - 
                      getAttributeCount('address') - 
                      getAttributeCount('mailing') - 
                      getAttributeCount('owner') - 
                      getAttributeCount('mortgage') - 
                      getAttributeCount('property') - 
                      getAttributeCount('landUse') - 
                      getAttributeCount('coordinates')
                    })</span>
                  </div>
                  {expandedSections.has('all') ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {expandedSections.has('all') && (
                  <div className="p-4 bg-white max-h-64 overflow-y-auto">
                    {Object.entries(data)
                      .filter(([key, value]) => {
                        const excludedKeys = ['matchedAddress', 'mailingAddress', 'coordinates', 'mapEmbedUrl'];
                        return !excludedKeys.includes(key) && 
                               value !== null && 
                               value !== undefined && 
                               value !== '' && 
                               typeof value !== 'object';
                      })
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([key, value]) => {
                        const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                        return (
                          <div key={key} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
                            <span className="font-medium text-gray-600 text-sm">{displayKey}:</span>
                            <span className="text-gray-800 text-sm text-right ml-4 max-w-[60%] break-words">{String(value)}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {data.mapEmbedUrl ? (
                <div className="rounded-xl overflow-hidden border-2 border-emerald-400 shadow-lg">
                  <iframe
                    width="100%"
                    height="450"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={data.mapEmbedUrl}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Map data not available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-2xl">
          <button
            onClick={() => {
              // Export functionality
              const json = JSON.stringify(data, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'property-data.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Close
            </button>
            {onApply && (
              <button
                onClick={onApply}
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Apply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
