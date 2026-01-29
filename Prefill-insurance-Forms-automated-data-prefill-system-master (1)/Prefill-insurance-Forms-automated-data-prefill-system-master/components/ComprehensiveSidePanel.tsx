'use client'

import React, { useState } from 'react'

interface Dataset {
  smarty_key?: string
  data_set_name?: string
  data_subset_name?: string
  attributes?: Record<string, any>
}

interface ComprehensiveDataProps {
  smartyData: {
    success: boolean
    data: Record<string, any>
    validation?: {
      isValid: boolean
      warnings: string[]
      info?: string[] // Add optional info messages
      propertyType: string
      confidence: string
    }
    message?: string
    neon?: {
      license?: Record<string, any>
      business?: Record<string, any>
      ownership?: {
        status: 'owner' | 'tenant' | 'unknown'
        matchedName?: string | null
        neonBusinessName?: string | null
      }
    }
    ownership?: {
      status: 'owner' | 'tenant' | 'unknown'
      matchedName?: string | null
      neonBusinessName?: string | null
    }
  }
  onClose: () => void
  onFillFields: () => void
}

export function ComprehensiveSidePanel({ smartyData, onClose, onFillFields }: ComprehensiveDataProps) {
  const [activeTab, setActiveTab] = useState('summary')
  const [draggedItem, setDraggedItem] = useState<{ key: string; value: any } | null>(null)

  if (!smartyData?.data) return null

  const data = smartyData.data
  const neon = smartyData.neon
  const rawData = data._rawData || {}
  const principal = rawData.principal || {}
  const datasets = rawData.datasets || {}
  
  // Check if there are validation warnings
  const hasWarnings = smartyData.validation?.warnings && smartyData.validation.warnings.length > 0
  const isInvalidProperty = !smartyData.validation?.isValid

  // Organize data into categories
  const summaryData = {
    'Address': data.address,
    'Corporation Name': data.corporationName,
    'Applicant Type': data.applicantType,
    'Operation Description': data.operationDescription,
    'Year Built': data.yearBuilt,
    'Total Sq Footage': data.totalSqFootage,
    'Ownership Type': data.ownershipType,
    'Assessed Value': data.assessedValue,
    'Acres': data.acres,
    'County': data.county
  }

  const propertyDetails = {
    'Bedrooms': data.bedrooms,
    'Bathrooms': data.bathrooms,
    'Stories': data.stories,
    'Garage Size': data.garageSize,
    'Construction Type': data.constructionType,
    'Roof Type': data.roofType,
    'Exterior Walls': data.exteriorWalls,
    'Foundation': data.foundation,
    'Lot Size': data.lotSize,
    'Market Value': data.marketValue
  }

  const financialData = {
    'Primary Lender': data.primaryLender,
    'Mortgage Amount': data.mortgageAmount,
    'Mortgage Due Date': data.mortgageDueDate,
    'Assessed Value': data.assessedValue,
    'Market Value': data.marketValue
  }

  const riskAndSafety = {
    'Risk Factors': data.riskFactors,
    'Safety Features': data.safetyFeatures,
    'Municipality': data.municipality,
    'Metro Area': data.metroArea
  }

  const secondaryInfo = {
    'Has Secondary Units': data.hasSecondaryUnits,
    'Secondary Units Count': data.secondaryUnitsCount
  }

  const handleDragStart = (key: string, value: any) => {
    setDraggedItem({ key, value })
    // Store data in the dataTransfer for the form fields to access
    if (typeof document !== 'undefined') {
      // We'll use a global variable since dataTransfer is limited in some browsers
      (window as any).draggedSmartyData = { key, value: String(value) }
    }
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    if (typeof document !== 'undefined') {
      delete (window as any).draggedSmartyData
    }
  }

  const renderDataSection = (title: string, data: Record<string, any>, bgColor = 'bg-gray-50') => (
    <div className={`${bgColor} p-4 rounded-lg mb-4`}>
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
        {title}
        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {Object.values(data).filter(v => v != null && v !== '').length} fields
        </span>
      </h4>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => {
          if (value == null || value === '') return null
          
          const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
          
          return (
            <div
              key={key}
              draggable
              onDragStart={() => handleDragStart(key, value)}
              onDragEnd={handleDragEnd}
              className="flex justify-between items-start p-2 bg-white rounded border cursor-move hover:bg-blue-50 hover:border-blue-300 transition-colors group"
              title="Drag to form field"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </div>
                <div className="text-sm text-gray-600 break-all">
                  {displayValue}
                </div>
              </div>
              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const tabs = [
    { id: 'validation', label: 'Validation', count: smartyData.validation?.warnings?.length || 0 },
    { id: 'map', label: '3D Map', count: data.mapEmbedUrl ? 1 : 0 },
    { id: 'summary', label: 'Summary', count: Object.values(summaryData).filter(v => v != null && v !== '').length },
    { id: 'property', label: 'Property Details', count: Object.values(propertyDetails).filter(v => v != null && v !== '').length },
    { id: 'financial', label: 'Financial', count: Object.values(financialData).filter(v => v != null && v !== '').length },
    { id: 'risk', label: 'Risk & Safety', count: Object.values(riskAndSafety).filter(v => v != null && v !== '').length },
    { id: 'secondary', label: 'Secondary', count: Object.values(secondaryInfo).filter(v => v != null && v !== '').length },
    { id: 'raw', label: 'All Data', count: Object.keys(principal).length }
  ]

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className={`p-4 border-b border-gray-200 ${isInvalidProperty ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              {isInvalidProperty && (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              Property Data {isInvalidProperty && '- VERIFY!'}
            </h3>
            <p className={`${isInvalidProperty ? 'text-red-100' : 'text-blue-100'} text-sm`}>
              {isInvalidProperty ? 'Data validation failed - manual review required' : 'Comprehensive Smarty Street Data'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 p-1 rounded transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap flex items-center space-x-2 transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Drag and Drop Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="text-sm text-yellow-800">
            <strong>💡 Drag & Drop:</strong> Drag any field below to a form input to auto-fill it!
          </div>
        </div>

        {/* Validation Tab */}
        {activeTab === 'validation' && (
          <div className="space-y-4">
            {smartyData.validation ? (
              <>
                {/* Validation Status */}
                <div className={`p-4 rounded-lg border-2 ${
                  smartyData.validation.isValid 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-center mb-2">
                    <div className={`text-2xl mr-2 ${smartyData.validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {smartyData.validation.isValid ? '✅' : '🚫'}
                    </div>
                    <div>
                      <h4 className={`font-bold ${smartyData.validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
                        {smartyData.validation.isValid ? 'Valid Property' : 'Property Validation Failed'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Property Type: <span className="font-semibold">{smartyData.validation.propertyType.replace('_', ' ').toUpperCase()}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Confidence: <span className="font-semibold uppercase">{smartyData.validation.confidence}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {smartyData.validation.warnings && smartyData.validation.warnings.length > 0 && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                    <h4 className="font-bold text-yellow-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Validation Warnings
                    </h4>
                    <ul className="space-y-2">
                      {smartyData.validation.warnings.map((warning: string, index: number) => (
                        <li key={index} className="text-sm text-yellow-800 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Info Messages */}
                {smartyData.validation.info && smartyData.validation.info.length > 0 && (
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                    <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Information
                    </h4>
                    <ul className="space-y-2">
                      {smartyData.validation.info.map((info: string, index: number) => (
                        <li key={index} className="text-sm text-blue-700 flex items-start">
                          <span className="mr-2">ℹ️</span>
                          <span>{info}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Google Maps Business Info */}
                {data.dba && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-800 mb-3">Google Maps Business Data</h4>
                    <div className="space-y-2">
                      {data.dba && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">Business Name (DBA):</span>
                          <span className="text-gray-900">{data.dba}</span>
                        </div>
                      )}
                      {data.contactNumber && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">Phone Number:</span>
                          <span className="text-gray-900">{data.contactNumber}</span>
                        </div>
                      )}
                      {data.businessTypes && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">Business Types:</span>
                          <span className="text-gray-900">{data.businessTypes}</span>
                        </div>
                      )}
                      {data.currentlyOpen !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">Currently Open:</span>
                          <span className={`font-semibold ${data.currentlyOpen ? 'text-green-600' : 'text-red-600'}`}>
                            {data.currentlyOpen ? 'YES' : 'NO'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {neon && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-bold text-purple-800 mb-3">Neon & GSOS Business Insights</h4>
                    <div className="space-y-3 text-sm text-gray-700">
                      {neon.ownership && (
                        <div className={`p-3 rounded border ${neon.ownership.status === 'owner' ? 'bg-green-100 border-green-300 text-green-800' : neon.ownership.status === 'tenant' ? 'bg-orange-100 border-orange-300 text-orange-800' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                          <div className="font-semibold text-xs uppercase tracking-wide">Ownership Insight</div>
                          <div className="mt-1 font-semibold text-base">
                            {neon.ownership.status === 'owner' ? 'Insured matches property owner' : neon.ownership.status === 'tenant' ? 'Insured appears to be a tenant' : 'Ownership could not be verified'}
                          </div>
                          <div className="mt-1 text-xs opacity-80">
                            {neon.ownership.status === 'owner'
                              ? `Matching name: ${neon.ownership.matchedName || neon.ownership.neonBusinessName || 'N/A'}`
                              : `Neon business: ${neon.ownership.neonBusinessName || 'N/A'}`}
                          </div>
                        </div>
                      )}

                      {neon.license && (
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex justify-between">
                            <span className="font-medium">License Business</span>
                            <span className="ml-4 text-right max-w-[60%]">{neon.license.list_format_name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">License ID</span>
                            <span className="ml-4 text-right">{neon.license.license_id || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">License Address</span>
                            <span className="ml-4 text-right max-w-[60%]">{neon.license.list_format_address || 'N/A'}</span>
                          </div>
                        </div>
                      )}

                      {neon.business && (
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex justify-between">
                            <span className="font-medium">GSOS Business Name</span>
                            <span className="ml-4 text-right max-w-[60%]">{neon.business.business_name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">NAICS</span>
                            <span className="ml-4 text-right">{neon.business.naics_code || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Agent</span>
                            <span className="ml-4 text-right max-w-[60%]">{neon.business.registered_agent_name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Agent Address</span>
                            <span className="ml-4 text-right max-w-[60%]">{neon.business.registered_agent_physical_address || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Years at Location</span>
                            <span className="ml-4 text-right">{neon.business.yearsAtLocation ?? 'N/A'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
                No validation data available
              </div>
            )}
          </div>
        )}

        {/* 3D Map Tab */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            {data.mapEmbedUrl ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="text-sm text-blue-800">
                    <strong>🗺️ Interactive Street View:</strong> Drag to look around 360°, click arrows to move. Use this to count fuel dispensers (MPDs).
                  </div>
                </div>
                
                <div className="rounded-lg overflow-hidden border-2 border-blue-300 shadow-lg">
                  <iframe
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={data.mapEmbedUrl}
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-semibold text-green-800 mb-2 text-sm">🎯 How to Count MPDs:</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• <strong>Ignore</strong> the tall pylon sign (pricing billboard)</li>
                    <li>• <strong>Find the canopy</strong> (horizontal roof over pumps)</li>
                    <li>• <strong>Count rectangular islands</strong> under the canopy</li>
                    <li>• Each island = 1 MPD (Motor Fuel Pump Dispenser)</li>
                    <li>• Switch to satellite view if needed for overhead perspective</li>
                  </ul>
                </div>

                {data.coordinates && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">📍 Coordinates:</h4>
                    <div className="text-xs text-gray-700 space-y-1">
                      <div><strong>Latitude:</strong> {data.coordinates.lat}</div>
                      <div><strong>Longitude:</strong> {data.coordinates.lng}</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
                <p className="mb-2">📍 No map data available</p>
                <p className="text-sm">Google Maps integration may not be configured</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && renderDataSection('Core Information', summaryData, 'bg-blue-50')}
        {activeTab === 'property' && renderDataSection('Property Details', propertyDetails, 'bg-green-50')}
        {activeTab === 'financial' && renderDataSection('Financial Information', financialData, 'bg-purple-50')}
        {activeTab === 'risk' && renderDataSection('Risk & Safety', riskAndSafety, 'bg-red-50')}
        {activeTab === 'secondary' && renderDataSection('Secondary Units', secondaryInfo, 'bg-orange-50')}
        
        {activeTab === 'raw' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Principal Dataset ({Object.keys(principal).length} attributes)</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(principal).map(([key, value]) => (
                  <div
                    key={key}
                    draggable
                    onDragStart={() => handleDragStart(key, value)}
                    onDragEnd={handleDragEnd}
                    className="flex justify-between items-start p-2 bg-white rounded border cursor-move hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs"
                  >
                    <div className="font-medium text-gray-700">{key}</div>
                    <div className="text-gray-600 ml-2 break-all max-w-32">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>

            {Object.entries(datasets).map(([datasetName, datasetData]: [string, any]) => (
              <div key={datasetName} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3 capitalize">
                  {datasetName.replace('_', ' ')} Dataset 
                  {datasetData?.attributes && ` (${Object.keys(datasetData.attributes).length} attributes)`}
                </h4>
                {datasetData?.attributes && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(datasetData.attributes).map(([key, value]) => (
                      <div
                        key={key}
                        draggable
                        onDragStart={() => handleDragStart(key, value)}
                        onDragEnd={handleDragEnd}
                        className="flex justify-between items-start p-2 bg-white rounded border cursor-move hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs"
                      >
                        <div className="font-medium text-gray-700">{key}</div>
                        <div className="text-gray-600 ml-2 break-all max-w-32">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onFillFields}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Fill All Compatible Fields</span>
        </button>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          {data._rawData && Object.keys(data._rawData.principal || {}).length} total attributes available
        </div>
      </div>
    </div>
  )
}