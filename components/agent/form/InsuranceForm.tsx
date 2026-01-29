'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

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

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    // TODO: Implement submission logic
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Information Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Company Information</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Corporation Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('corporationName', { required: 'Corporation Name is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter corporation name"
              />
              {errors.corporationName && (
                <p className="text-red-600 text-sm mt-1">{errors.corporationName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('contactName', { required: 'Contact Name is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter contact name"
              />
              {errors.contactName && (
                <p className="text-red-600 text-sm mt-1">{errors.contactName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register('contactNumber', { required: 'Contact Number is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter contact number"
              />
              {errors.contactNumber && (
                <p className="text-red-600 text-sm mt-1">{errors.contactNumber.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register('contactEmail', { required: 'Contact Email is required' })}
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter email address"
              />
              {errors.contactEmail && (
                <p className="text-red-600 text-sm mt-1">{errors.contactEmail.message}</p>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead Source <span className="text-red-500">*</span>
              </label>
              <input
                {...register('leadSource', { required: 'Lead Source is required' })}
                type="text"
                value={watch('leadSource') || ''}
                onChange={(e) => {
                  setValue('leadSource', e.target.value);
                  setShowLeadSourceDropdown(true);
                }}
                onFocus={() => setShowLeadSourceDropdown(true)}
                onBlur={() => setTimeout(() => setShowLeadSourceDropdown(false), 200)}
                placeholder="Type to search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Effective Date
              </label>
              <input
                {...register('proposedEffectiveDate')}
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prior Carrier
              </label>
              <input
                {...register('priorCarrier')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter prior carrier"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Premium
              </label>
              <input
                {...register('targetPremium')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter target premium"
              />
            </div>
          </div>
        </div>

        {/* Applicant Type Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Applicant Type</h2>
          <div className="flex flex-wrap gap-4">
            {[
              { value: 'individual', label: 'Individual' },
              { value: 'partnership', label: 'Partnership' },
              { value: 'corporation', label: 'Corporation' },
              { value: 'jointVenture', label: 'Joint Venture' },
              { value: 'llc', label: 'LLC' },
              { value: 'other', label: 'Other' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  {...register('applicantType', { required: 'Please select applicant type' })}
                  value={option.value}
                  className="mr-2 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.applicantType && (
            <p className="text-red-600 text-sm mt-2">{errors.applicantType.message}</p>
          )}
        </div>

        {/* Ownership Type Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ownership Type</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { value: 'Owner', label: 'Owner' },
              { value: 'Tenant', label: 'Tenant' },
              { value: "Lessor's Risk", label: "Lessor's Risk" },
              { value: 'Triple Net Lease', label: 'Triple Net Lease' }
            ].map((option) => (
              <label key={option.value} className="flex items-center p-3 bg-gray-50 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors">
                <input
                  type="radio"
                  {...register('ownershipType')}
                  value={option.value}
                  className="mr-2 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Operations Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Operations</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation Description
              </label>
              <textarea
                {...register('operationDescription')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Describe your business operations..."
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DBA</label>
                <input
                  {...register('dba')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter DBA (Doing Business As)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  {...register('address')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter property address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mailing Address</label>
                <input
                  {...register('mailingAddress')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter mailing address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Property Details Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Property Details</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hours of Operation</label>
              <input
                {...register('hoursOfOperation')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter hours"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">No. Of MPDs</label>
              <input
                {...register('noOfMPDs')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Construction Type</label>
              <input
                {...register('constructionType')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter type"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years Exp. in Business</label>
              <input
                {...register('yearsInBusiness')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter years"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years at this Location</label>
              <input
                {...register('yearsAtLocation')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter years"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year Built</label>
              <input
                {...register('yearBuilt')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Year"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year of Latest Update</label>
              <input
                {...register('yearOfLatestUpdate')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Year"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Sq. Footage</label>
              <input
                {...register('totalSqFootage')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Sq ft"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Any Leased Out Space</label>
              <input
                {...register('anyLeasedOutSpace')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Yes/No"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Protection Class</label>
            <input
              {...register('protectionClass')}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter protection class"
            />
          </div>
        </div>

        {/* Security Systems Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Security Systems</h2>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-6 text-sm">
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
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Property Coverage & General Liability</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
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
        <div className="border-b border-gray-200 pb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Additional Interests (Max 3)</h2>
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
        <div className="border-b border-gray-200 pb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Buildings</h2>
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

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold"
          >
            Submit Application
          </button>
        </div>
      </form>

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
    </div>
  );
}
