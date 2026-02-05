'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import AddressSearch from './AddressSearch';
import PropertyDataModal from './PropertyDataModal';
import { Eye } from 'lucide-react';

// Types matching the original form
interface Building {
  id: string;
  address: string;
  sqFootage: string;
  construction: string;
  yearBuilt: string;
  businessIncome: string;
  businessPersonalProperty: string;
  sales: string;
  description: string;
}

interface AdditionalInterest {
  id: string;
  type: string;
  name: string;
  address: string;
}

interface FormData {
  // Company Information
  corporationName: string;
  contactName: string;
  contactNumber: string;
  contactEmail: string;
  leadSource: string;
  proposedEffectiveDate: string;
  priorCarrier: string;
  targetPremium: string;
  
  // Applicant Type
  applicantType: string;
  
  // Ownership Type
  ownershipType: string;
  
  // Operations
  operationDescription: string;
  dba: string;
  address: string;
  mailingAddress: string;
  
  // Property Details
  hoursOfOperation: string;
  noOfMPDs: string;
  constructionType: string;
  yearsInBusiness: string;
  yearsAtLocation: string;
  yearBuilt: string;
  yearOfLatestUpdate: string;
  totalSqFootage: string;
  anyLeasedOutSpace: string;
  protectionClass: string;
  
  // Security Systems
  burglarAlarm: {
    centralStation: boolean;
    local: boolean;
  };
  fireAlarm: {
    centralStation: boolean;
    local: boolean;
  };
  
  // Property Coverage
  building: string;
  bpp: string;
  bi: string;
  canopy: string;
  pumps: string;
  ms: string;
  
  // General Liability Sales
  insideSalesMonthly: string;
  insideSalesYearly: string;
  liquorSalesMonthly: string;
  liquorSalesYearly: string;
  gasSalesMonthly: string;
  gasSalesYearly: string;
  propaneSalesMonthly: string;
  propaneSalesYearly: string;
  carwashMonthly: string;
  carwashYearly: string;
  cookingMonthly: string;
  cookingYearly: string;
  
  // Business Details
  fein: string;
  noOfEmployees: string;
  payroll: string;
  officersInclExcl: string;
  ownership: string;
}

const leadSourceOptions = [
  'Tahir', 'Ahmed', 'Alex Fazwani', 'Ali Ajani', 'Aly Virani', 'Amber', 'Ana', 'ARA', 'Asad', 'Ayaz Ali',
  'Cinco', 'Inbound Call', 'Cold Lead', 'Cross sell', 'Customer Referral', 'David', 'Employers Nancy',
  'ENDORSEMENT', 'Existing Insured', 'Existing insured - new project', 'Expo', 'Hector', 'Internet',
  'John Sipple', 'Karim Virani', 'Ladaji', 'Lana', 'Munira', 'Myra', 'NATA', 'Nizar', 'Nur', 'Other',
  'Raabel', 'Rahim', 'Razia', 'Razia New Prospect', 'Razia winback', 'Reshop', 'Rewrite', 'Rozmin Ali',
  'Shahnaz', 'Shahzaib', 'Sherika', 'Sunil Dosi', 'Tanya', 'Teejay', 'Tej', 'VA Sales', 'Walk In',
  'Website', 'Win Back', 'Zara'
];

export default function InsuranceForm() {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      burglarAlarm: { centralStation: false, local: false },
      fireAlarm: { centralStation: false, local: false },
    }
  });
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [additionalInterests, setAdditionalInterests] = useState<AdditionalInterest[]>([]);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showLeadSourceDropdown, setShowLeadSourceDropdown] = useState(false);
  const [currentBuilding, setCurrentBuilding] = useState<Building>({
    id: '',
    address: '',
    sqFootage: '',
    construction: '',
    yearBuilt: '',
    businessIncome: '',
    businessPersonalProperty: '',
    sales: '',
    description: ''
  });
  const [currentAdditionalInterest, setCurrentAdditionalInterest] = useState<AdditionalInterest>({
    id: '',
    type: '',
    name: '',
    address: ''
  });
  
  const [propertyData, setPropertyData] = useState<any>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    // TODO: Implement submission logic
  };

  const handleAddressSelect = (address: string) => {
    setSelectedAddress(address);
    setValue('address', address);
  };

  const handleFetchData = async (address: string) => {
    setIsFetchingData(true);
    try {
      const response = await fetch('/api/form/prefill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      const result = await response.json();
      
      if (result.success) {
        setPropertyData(result);
        setShowPropertyModal(true);
        
        // Auto-fill form fields if data is available
        if (result.data) {
          const data = result.data;
          if (data.corporationName) setValue('corporationName', data.corporationName);
          if (data.address) setValue('address', data.address);
          if (data.dba) setValue('dba', data.dba);
          if (data.contactNumber) setValue('contactNumber', data.contactNumber);
          if (data.yearBuilt) setValue('yearBuilt', data.yearBuilt);
          if (data.totalSqFootage || data.buildingSqft) setValue('totalSqFootage', data.totalSqFootage || data.buildingSqft);
          if (data.construction_type || data.constructionType) setValue('constructionType', data.construction_type || data.constructionType);
          if (data.operationDescription) setValue('operationDescription', data.operationDescription);
          if (data.ownershipType) setValue('ownershipType', data.ownershipType);
          if (data.applicantType) setValue('applicantType', data.applicantType);
          if (data.hoursOfOperation) setValue('hoursOfOperation', data.hoursOfOperation);
          if (data.building) setValue('building', data.building);
          if (data.canopy) setValue('canopy', data.canopy);
          if (data.protectionClass) setValue('protectionClass', data.protectionClass);
          if (data.mailingAddress?.fullAddress) setValue('mailingAddress', data.mailingAddress.fullAddress);
        }
      } else {
        alert(`Failed to fetch data: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error fetching property data:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleAddBuilding = () => {
    const newBuilding: Building = {
      ...currentBuilding,
      id: Date.now().toString()
    };
    setBuildings([...buildings, newBuilding]);
    setCurrentBuilding({
      id: '',
      address: watch('address') || '',
      sqFootage: '',
      construction: '',
      yearBuilt: '',
      businessIncome: '',
      businessPersonalProperty: '',
      sales: '',
      description: ''
    });
    setShowBuildingModal(false);
  };

  const handleRemoveBuilding = (id: string) => {
    setBuildings(buildings.filter(b => b.id !== id));
  };

  const handleAddAdditionalInterest = () => {
    if (additionalInterests.length >= 3) {
      alert('Maximum of 3 additional interests allowed');
      return;
    }
    if (currentAdditionalInterest.type && (currentAdditionalInterest.name || currentAdditionalInterest.address)) {
      const newInterest: AdditionalInterest = {
        ...currentAdditionalInterest,
        id: Date.now().toString()
      };
      setAdditionalInterests([...additionalInterests, newInterest]);
      setCurrentAdditionalInterest({
        id: '',
        type: '',
        name: '',
        address: ''
      });
    }
  };

  const handleRemoveAdditionalInterest = (id: string) => {
    setAdditionalInterests(additionalInterests.filter(ai => ai.id !== id));
  };

  const handleApplyPropertyData = (propertyData: any) => {
    const data = propertyData || {};
    const matchedAddress = data.matchedAddress || {};
    const mailingAddress = data.mailingAddress || {};

    // Address Information
    if (matchedAddress.street || data.address) {
      const fullAddress = data.address || data.fullAddress || 
        `${matchedAddress.street || ''}, ${matchedAddress.city || ''}, ${matchedAddress.state || ''} ${matchedAddress.zipcode || ''}`.trim();
      setValue('address', fullAddress);
    }
    
    // Mailing Address
    if (mailingAddress.fullAddress || data.fullMailingAddress) {
      setValue('mailingAddress', mailingAddress.fullAddress || data.fullMailingAddress);
    }

    // Corporation Information
    if (data.corporationName) setValue('corporationName', data.corporationName);
    if (data.ownerFullName || data.deedOwnerFullName) {
      setValue('contactName', data.ownerFullName || data.deedOwnerFullName);
    }
    
    // Property Details
    if (data.yearBuilt) setValue('yearBuilt', String(data.yearBuilt));
    if (data.buildingSqft || data.totalSqFootage) {
      setValue('totalSqFootage', String(data.buildingSqft || data.totalSqFootage));
    }
    if (data.construction_type || data.constructionType) {
      setValue('constructionType', data.construction_type || data.constructionType);
    }
    if (data.canopy) setValue('canopy', String(data.canopy));
    if (data.canopySqft) setValue('canopy', String(data.canopySqft));
    
    // Ownership Type
    if (data.ownershipType) {
      const ownershipMap: { [key: string]: string } = {
        'Owner': 'Owner',
        'Tenant': 'Tenant',
        'Lessor': "Lessor's Risk",
        'Triple Net': 'Triple Net Lease'
      };
      const mappedType = ownershipMap[data.ownershipType] || data.ownershipType;
      setValue('ownershipType', mappedType);
    }
    
    // Applicant Type
    if (data.companyFlag === 'Y' || data.companyFlag === true) {
      setValue('applicantType', 'corporation');
    } else if (data.ownerFullName && !data.corporationName) {
      setValue('applicantType', 'individual');
    }
    
    // Building Coverage
    if (data.assessedValue) setValue('building', String(data.assessedValue));
    
    // DBA
    if (data.dba) setValue('dba', data.dba);
    
    // Protection Class
    if (data.protectionClass) setValue('protectionClass', String(data.protectionClass));
    
    // Additional property details
    if (data.storiesNumber) {
      // Could map to a relevant field if needed
    }
    if (data.exteriorWalls) {
      // Could map to construction type if needed
    }
    
    // Show success message
    alert('Property data has been applied to the form!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-6">
      {/* MAIN FORM - Full Width, Prominently at Top - Matching Frame Design */}
      <div className="border-2 border-green-100 shadow-xl bg-white rounded-xl">
        {/* Sticky Header - Matching Frame */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-green-50 to-white border-b-2 border-green-100 shadow-sm rounded-t-xl px-5 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Convenience Store Insurance Application</h1>
              <p className="text-xs text-gray-600 mt-0.5">Complete the form below to submit your application</p>
            </div>
            {propertyData && (
              <button
                type="button"
                onClick={() => setShowPropertyModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white h-9 px-4 flex items-center gap-2 shadow-md rounded-lg transition-colors text-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                View Property Data
              </button>
            )}
          </div>
        </div>
        
        <div className="p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Property Address Lookup - Integrated at Top of Form - Matching Frame */}
            <div className="bg-green-50/50 border-2 border-green-200 rounded-xl p-4">
              <AddressSearch
                onAddressSelect={handleAddressSelect}
                onFetchData={handleFetchData}
                isLoading={isFetchingData}
              />
            </div>
            {/* Corporation Details - Row 1 - Matching Frame Design */}
            <div>
              <label className="text-sm font-semibold mb-3 block text-gray-900">Corporation Details</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="corporationName" className="text-sm font-medium text-gray-700">
                    Corporation Name *
                  </label>
                  <input
                    id="corporationName"
                    {...register('corporationName', { required: 'Corporation Name is required' })}
                    placeholder="Enter corporation name"
                    className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                  {errors.corporationName && (
                    <p className="text-red-600 text-sm mt-1">{errors.corporationName.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="contactName" className="text-sm font-medium text-gray-700">
                    Contact Name *
                  </label>
                  <input
                    id="contactName"
                    {...register('contactName', { required: 'Contact Name is required' })}
                    placeholder="Enter contact name"
                    className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                  {errors.contactName && (
                    <p className="text-red-600 text-sm mt-1">{errors.contactName.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="contactNumber" className="text-sm font-medium text-gray-700">
                    Contact Number *
                  </label>
                  <input
                    id="contactNumber"
                    {...register('contactNumber', { required: 'Contact Number is required' })}
                    placeholder="Enter contact number"
                    className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                  {errors.contactNumber && (
                    <p className="text-red-600 text-sm mt-1">{errors.contactNumber.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Corporation Details - Row 2 - Matching Frame Design */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label htmlFor="contactEmail" className="text-sm font-medium text-gray-700">
                  Contact Email *
                </label>
                <input
                  id="contactEmail"
                  {...register('contactEmail', { required: 'Contact Email is required' })}
                  type="email"
                  placeholder="Enter email address"
                  className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
                {errors.contactEmail && (
                  <p className="text-red-600 text-sm mt-1">{errors.contactEmail.message}</p>
                )}
              </div>
              <div className="relative">
                <label htmlFor="leadSource" className="text-sm font-medium text-gray-700">
                  Lead Source *
                </label>
                <input
                  id="leadSource"
                  {...register('leadSource', { required: 'Lead Source is required' })}
                  type="text"
                  value={watch('leadSource') || ''}
                  onChange={(e) => {
                    setValue('leadSource', e.target.value);
                    setShowLeadSourceDropdown(true);
                  }}
                  onFocus={() => setShowLeadSourceDropdown(true)}
                  onBlur={() => setTimeout(() => setShowLeadSourceDropdown(false), 200)}
                  placeholder="Enter lead source"
                  className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              {showLeadSourceDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {leadSourceOptions
                    .filter(option => option.toLowerCase().includes((watch('leadSource') || '').toLowerCase()))
                    .map((option, index) => (
                      <div
                        key={index}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setValue('leadSource', option);
                          setShowLeadSourceDropdown(false);
                        }}
                        className="px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        {option}
                      </div>
                    ))}
                </div>
              )}
              {errors.leadSource && (
                <p className="text-red-600 text-sm mt-1">{errors.leadSource.message}</p>
              )}
            </div>
              <div>
                <label htmlFor="proposedEffectiveDate" className="text-sm font-medium text-gray-700">
                  Proposed Effective Date
                </label>
                <input
                  id="proposedEffectiveDate"
                  {...register('proposedEffectiveDate')}
                  type="date"
                  className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
              <div>
                <label htmlFor="priorCarrier" className="text-sm font-medium text-gray-700">
                  Prior Carrier
                </label>
                <input
                  id="priorCarrier"
                  {...register('priorCarrier')}
                  placeholder="Enter prior carrier"
                  className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
            </div>

            {/* Ownership Type - Matching Frame Design */}
            <div>
              <label className="text-sm font-semibold mb-3 block text-gray-900">Ownership Type</label>
              <div className="grid grid-cols-4 gap-2.5">
                {["Owner", "Tenant", "Lessor's Risk", "Triple Net Lease"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue('ownershipType', type)}
                    className={`p-3 border-2 rounded-lg text-xs font-medium transition-all ${
                      watch('ownershipType') === type
                        ? "border-green-600 bg-green-50 text-green-700 shadow-md"
                        : "border-gray-200 hover:border-green-300 bg-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Applicant Type & Operation Description - Matching Frame Design */}
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Applicant is</label>
                <div className="space-y-1.5">
                  {["Individual", "Partnership", "Corporation", "Joint Venture", "LLC", "Other"].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                      <input
                        type="radio"
                        {...register('applicantType', { required: 'Please select applicant type' })}
                        value={type.toLowerCase()}
                        className="text-green-600"
                      />
                      {type}
                    </label>
                  ))}
                </div>
                {errors.applicantType && (
                  <p className="text-red-600 text-sm mt-2">{errors.applicantType.message}</p>
                )}
              </div>
              <div className="col-span-2">
                <label htmlFor="operationDescription" className="text-sm font-medium text-gray-700">
                  Operation Description
                </label>
                <textarea
                  id="operationDescription"
                  {...register('operationDescription')}
                  placeholder="Describe your business operations..."
                  rows={4}
                  className="mt-1.5 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
              <div className="col-span-2 space-y-3">
                <div>
                  <label htmlFor="dba" className="text-sm font-medium text-gray-700">
                    DBA
                  </label>
                  <input
                    id="dba"
                    {...register('dba')}
                    placeholder="Enter DBA (Doing Business As)"
                    className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    id="address"
                    {...register('address')}
                    placeholder="Enter property address"
                    className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="mailingAddress" className="text-sm font-medium text-gray-700">
                    Mailing Address
                  </label>
                  <input
                    id="mailingAddress"
                    {...register('mailingAddress')}
                    placeholder="Enter mailing address"
                    className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Property Details - Row 1 - Matching Frame Design */}
            <div>
              <label className="text-sm font-semibold mb-3 block text-gray-900">Property Details</label>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label htmlFor="hoursOfOperation" className="text-sm font-medium text-gray-700">
                    Hours of Operation
                  </label>
                  <input
                    id="hoursOfOperation"
                    {...register('hoursOfOperation')}
                    placeholder="Enter hours"
                    className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="noOfMPDs" className="text-sm font-medium text-gray-700">
                    No. Of MPDs
                  </label>
                  <input
                    id="noOfMPDs"
                    {...register('noOfMPDs')}
                    placeholder="Enter number"
                    className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="constructionType" className="text-sm font-medium text-gray-700">
                    Construction Type
                  </label>
                  <input
                    id="constructionType"
                    {...register('constructionType')}
                    placeholder="Enter type"
                    className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="yearsInBusiness" className="text-sm font-medium text-gray-700">
                    Years in Business
                  </label>
                  <input
                    id="yearsInBusiness"
                    {...register('yearsInBusiness')}
                    placeholder="Enter years"
                    className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Property Details - Row 2 - Matching Frame Design */}
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label htmlFor="yearsAtLocation" className="text-sm font-medium text-gray-700">
                  Years at this Location
                </label>
                <input
                  id="yearsAtLocation"
                  {...register('yearsAtLocation')}
                  placeholder="Years"
                  className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
              <div>
                <label htmlFor="yearBuilt" className="text-sm font-medium text-gray-700">
                  Year built
                </label>
                <input
                  id="yearBuilt"
                  {...register('yearBuilt')}
                  placeholder="Year"
                  className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
              <div>
                <label htmlFor="yearOfLatestUpdate" className="text-sm font-medium text-gray-700">
                  Year of latest update
                </label>
                <input
                  id="yearOfLatestUpdate"
                  {...register('yearOfLatestUpdate')}
                  placeholder="Year"
                  className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
              <div>
                <label htmlFor="totalSqFootage" className="text-sm font-medium text-gray-700">
                  Total sq. Footage
                </label>
                <input
                  id="totalSqFootage"
                  {...register('totalSqFootage')}
                  placeholder="Sq ft"
                  className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
              <div>
                <label htmlFor="anyLeasedOutSpace" className="text-sm font-medium text-gray-700">
                  Any Newest sid business
                </label>
                <input
                  id="anyLeasedOutSpace"
                  {...register('anyLeasedOutSpace')}
                  placeholder="Yes/No"
                  className="mt-1.5 h-9 w-full px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
            </div>

            {/* Protection Class - Matching Frame Design */}
            <div>
              <label htmlFor="protectionClass" className="text-sm font-medium text-gray-700">
                Protection Class
              </label>
              <input
                id="protectionClass"
                {...register('protectionClass')}
                placeholder="Enter protection class"
                className="mt-2 h-11 w-full px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

        {/* Security Systems Section */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">Security Systems</h2>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-medium text-gray-700">Alarm:</span>
              <span className="text-gray-700">Burglar</span>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('burglarAlarm.centralStation')}
                  className="mr-2 text-emerald-600 focus:ring-emerald-500 rounded"
                />
                <span>Central Station</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('burglarAlarm.local')}
                  className="mr-2 text-emerald-600 focus:ring-emerald-500 rounded"
                />
                <span>Local</span>
              </label>
              <span className="text-gray-700 ml-4">Fire</span>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('fireAlarm.centralStation')}
                  className="mr-2 text-emerald-600 focus:ring-emerald-500 rounded"
                />
                <span>Central Station</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('fireAlarm.local')}
                  className="mr-2 text-emerald-600 focus:ring-emerald-500 rounded"
                />
                <span>Local</span>
              </label>
            </div>
          </div>
        </div>

        {/* Property Coverage & General Liability Table */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">Property Coverage & General Liability</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th colSpan={2} className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">
                    Property Section
                  </th>
                  <th colSpan={3} className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">
                    GENERAL LIABILITY (Exposure)
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">
                    Worker's Compensation
                  </th>
                </tr>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">Coverage</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">Limits</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700"></th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">Monthly</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">Yearly</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">Building</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('building')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">Inside Sales Total</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('insideSalesMonthly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('insideSalesYearly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('fein')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="FEIN"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">BPP</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('bpp')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">Liquor Sales</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('liquorSalesMonthly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('liquorSalesYearly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('noOfEmployees')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="No. of Employees"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">B I</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('bi')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">Gasoline Gallons</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('gasSalesMonthly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('gasSalesYearly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('payroll')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="Payroll"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">Canopy</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('canopy')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">Propane Filling/Exchange</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('propaneSalesMonthly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('propaneSalesYearly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('officersInclExcl')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="Incl/Excl"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">Pumps</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('pumps')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">Carwash</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('carwashMonthly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('carwashYearly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('ownership')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="% Ownership"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">M&S</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('ms')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700">Cooking</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('cookingMonthly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      {...register('cookingYearly')}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                      placeholder="$"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2 bg-gray-50"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Interests Section */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-gray-900">Additional Interests (Max 3)</h2>
            {additionalInterests.length < 3 && (
              <button
                type="button"
                onClick={handleAddAdditionalInterest}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
              >
                <span>+</span>
                Add Additional Interest
              </button>
            )}
          </div>
          
          {additionalInterests.length > 0 && (
            <div className="space-y-3 mb-4">
              {additionalInterests.map((interest, index) => (
                <div key={interest.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">Additional Interest {index + 1}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Type:</strong> {interest.type}<br />
                      {interest.name && <><strong>Name:</strong> {interest.name}<br /></>}
                      {interest.address && <><strong>Address:</strong> {interest.address}</>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAdditionalInterest(interest.id)}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {additionalInterests.length < 3 && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-300">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={currentAdditionalInterest.type}
                  onChange={(e) => setCurrentAdditionalInterest({ ...currentAdditionalInterest, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select type</option>
                  <option value="Additional Insured">Additional Insured</option>
                  <option value="Loss Payee">Loss Payee</option>
                  <option value="Lenders">Lenders</option>
                  <option value="Mortgagee">Mortgagee</option>
                </select>
              </div>
              {currentAdditionalInterest.type && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={currentAdditionalInterest.name}
                      onChange={(e) => setCurrentAdditionalInterest({ ...currentAdditionalInterest, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={`Enter ${currentAdditionalInterest.type} name`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={currentAdditionalInterest.address}
                      onChange={(e) => setCurrentAdditionalInterest({ ...currentAdditionalInterest, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={`Enter ${currentAdditionalInterest.type} address`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buildings Section */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-gray-900">Buildings</h2>
            <button
              type="button"
              onClick={() => {
                setCurrentBuilding({
                  id: '',
                  address: watch('address') || '',
                  sqFootage: '',
                  construction: '',
                  yearBuilt: '',
                  businessIncome: '',
                  businessPersonalProperty: '',
                  sales: '',
                  description: ''
                });
                setShowBuildingModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Add a Building
            </button>
          </div>
          
          {buildings.length > 0 && (
            <div className="space-y-3">
              {buildings.map((building, index) => (
                <div key={building.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">Building {index + 1}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Address:</strong> {building.address || 'N/A'}<br />
                      {building.sqFootage && <><strong>SQ Footage:</strong> {building.sqFootage}<br /></>}
                      {building.construction && <><strong>Construction:</strong> {building.construction}<br /></>}
                      {building.yearBuilt && <><strong>Year Built:</strong> {building.yearBuilt}<br /></>}
                      {building.businessIncome && <><strong>Business Income:</strong> {building.businessIncome}<br /></>}
                      {building.businessPersonalProperty && <><strong>BPP:</strong> {building.businessPersonalProperty}<br /></>}
                      {building.sales && <><strong>Sales:</strong> {building.sales}<br /></>}
                      {building.description && <><strong>Description:</strong> {building.description}</>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBuilding(building.id)}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

            {/* Action Buttons - Matching Frame Design */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
              <button 
                type="button" 
                onClick={() => window.history.back()} 
                className="h-9 px-5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Reset Form
              </button>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  className="border-green-600 text-green-600 hover:bg-green-50 h-9 px-5 rounded-lg transition-colors text-sm"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 h-9 px-6 text-sm font-semibold rounded-lg transition-colors text-white"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Building Modal */}
      {showBuildingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add a Building</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={currentBuilding.address}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Square Footage</label>
                <input
                  type="text"
                  value={currentBuilding.sqFootage}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, sqFootage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Square footage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Construction</label>
                <input
                  type="text"
                  value={currentBuilding.construction}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, construction: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Construction type"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Built</label>
                <input
                  type="text"
                  value={currentBuilding.yearBuilt}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, yearBuilt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Year built"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Income</label>
                <input
                  type="text"
                  value={currentBuilding.businessIncome}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, businessIncome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Business income"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Personal Property</label>
                <input
                  type="text"
                  value={currentBuilding.businessPersonalProperty}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, businessPersonalProperty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Business personal property"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales</label>
                <input
                  type="text"
                  value={currentBuilding.sales}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, sales: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Sales"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={currentBuilding.description}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBuildingModal(false);
                  setCurrentBuilding({
                    id: '',
                    address: watch('address') || '',
                    sqFootage: '',
                    construction: '',
                    yearBuilt: '',
                    businessIncome: '',
                    businessPersonalProperty: '',
                    sales: '',
                    description: ''
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBuilding}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
              >
                Add Building
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Data Modal */}
      <PropertyDataModal
        isOpen={showPropertyModal}
        onClose={() => setShowPropertyModal(false)}
        data={propertyData?.data || {}}
        onApply={handleApplyPropertyData}
      />
    </div>
  );
}
