'use client';

import { useState, useEffect } from 'react';
import { Search, X, CheckCircle, Building2, Mail, Phone, MapPin, Clock } from 'lucide-react';

interface GHLOpportunity {
  id: string;
  opportunityId: string;
  opportunityName: string;
  dateAdded: string;
  contactId: string;
  pipelineStageId?: string;
}

interface GHLContact {
  id: string;
  opportunityId?: string;
  opportunityName?: string;
  dateAdded?: string;
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

interface GHLIntegrationProps {
  onSelect: (contact: GHLContact) => void;
  onClose: () => void;
}

export default function GHLIntegration({ onSelect, onClose }: GHLIntegrationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [allOpportunities, setAllOpportunities] = useState<GHLOpportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<GHLOpportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<GHLOpportunity | null>(null);
  const [selectedContact, setSelectedContact] = useState<GHLContact | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [error, setError] = useState('');

  // Load all opportunities when modal opens
  useEffect(() => {
    loadAllOpportunities();
  }, []);

  // Filter opportunities when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOpportunities(allOpportunities);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = allOpportunities.filter((opp) => {
        const oppName = (opp.opportunityName || '').toLowerCase();
        return oppName.includes(query);
      });
      setFilteredOpportunities(filtered);
    }
  }, [searchQuery, allOpportunities]);

  // Fetch contact details when opportunity is selected
  async function fetchContactDetails(contactId: string, opportunity: GHLOpportunity) {
    setLoadingContact(true);
    setError('');
    
    try {
      const res = await fetch(`/api/ghl/contact/${contactId}`);
      
      if (res.ok) {
        const contactData = await res.json();
        
        // Combine opportunity + contact data
        const fullContact: GHLContact = {
          id: contactData.id || contactId,
          opportunityId: opportunity.opportunityId,
          opportunityName: opportunity.opportunityName,
          dateAdded: opportunity.dateAdded,
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          address1: contactData.address1,
          city: contactData.city,
          state: contactData.state,
          zip: contactData.zip,
          companyName: contactData.companyName,
          website: contactData.website,
        };
        
        setSelectedContact(fullContact);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to fetch contact details');
      }
    } catch (error: any) {
      console.error('Error fetching contact:', error);
      setError(`Network error: ${error.message || 'Failed to fetch contact details'}`);
    } finally {
      setLoadingContact(false);
    }
  }

  async function loadAllOpportunities() {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/ghl/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '' }), // Empty query to get all
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Loaded opportunities:', data);
        
        // Sort by date (most recent first)
        const sorted = (data.opportunities || []).sort((a: GHLOpportunity, b: GHLOpportunity) => {
          const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
          const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
          return dateB - dateA; // Most recent first
        });
        
        setAllOpportunities(sorted);
        setFilteredOpportunities(sorted);
        
        if (sorted.length === 0) {
          setError('No opportunities found. Check if opportunities exist in your GHL account.');
        }
      } else {
        const errorData = await res.json();
        console.error('Load error:', errorData);
        setError(errorData.error || errorData.details || 'Failed to load opportunities');
      }
    } catch (error: any) {
      console.error('GHL load error:', error);
      setError(`Network error: ${error.message || 'Please check your GHL API configuration.'}`);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  }

  function handleSelect(opportunity: GHLOpportunity) {
    setSelectedOpportunity(opportunity);
    // Fetch contact details when opportunity is selected
    if (opportunity.contactId) {
      fetchContactDetails(opportunity.contactId, opportunity);
    } else {
      setError('This opportunity has no associated contact');
    }
  }

  function handleConfirm() {
    if (selectedContact) {
      onSelect(selectedContact);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                 <div>
                   <h2 className="text-2xl font-bold text-black">Select GoHighLevel Opportunity</h2>
                   <p className="text-sm text-gray-600 mt-1">
                     {allOpportunities.length > 0 
                       ? `${allOpportunities.length} opportunities available (showing most recent first)`
                       : 'Loading opportunities...'}
                   </p>
                 </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by opportunity name..."
                className="input-field pl-10 w-full"
              />
            </div>
            <button
              onClick={loadAllOpportunities}
              disabled={loading}
              className="btn-secondary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh opportunities"
            >
              {loading ? '...' : '↻'}
            </button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
                 {searchQuery && (
                   <p className="text-gray-600 text-sm mt-2">
                     Showing {filteredOpportunities.length} of {allOpportunities.length} opportunities
                   </p>
                 )}
        </div>

        {/* Results Panel */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading && (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p>Loading opportunities...</p>
            </div>
          )}

                 {!loading && filteredOpportunities.length === 0 && (
                   <div className="text-center py-12 text-gray-500">
                     <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                     <p>{searchQuery ? `No opportunities found matching "${searchQuery}"` : 'No opportunities found'}</p>
                   </div>
                 )}

                 {!loading && filteredOpportunities.length > 0 && (
                   <div className="space-y-3">
                     {filteredOpportunities.map((opportunity, index) => {
                       const isSelected = selectedOpportunity?.id === opportunity.id;
                       const isRecent = index < 5; // Highlight first 5 as most recent
                       return (
                         <div
                           key={`${opportunity.opportunityId}-${index}`}
                           onClick={() => {
                             handleSelect(opportunity);
                           }}
                           className={`border rounded-lg p-4 cursor-pointer transition-all ${
                             isSelected
                               ? 'border-black bg-white border-2 shadow-md'
                               : isRecent
                               ? 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                               : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                           }`}
                         >
                           <div className="flex items-start justify-between">
                             <div className="flex-1">
                               <div className="flex items-start gap-3 mb-2">
                                 <Building2 className={`w-5 h-5 mt-0.5 ${isRecent ? 'text-black' : 'text-gray-400'}`} />
                                 <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                     <h3 className="font-semibold text-black">
                                       {opportunity.opportunityName || 'Unnamed Opportunity'}
                                     </h3>
                                     {isRecent && (
                                       <span className="text-xs bg-black text-white px-2 py-0.5 rounded">Recent</span>
                                     )}
                                     {isSelected && (
                                       <CheckCircle className="w-5 h-5 text-black" />
                                     )}
                                     {loadingContact && isSelected && (
                                       <span className="text-xs text-gray-500">Loading contact...</span>
                                     )}
                                   </div>
                                   {opportunity.dateAdded && (
                                     <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                       <Clock className="w-3 h-3" />
                                       <span>{formatDate(opportunity.dateAdded)}</span>
                                     </div>
                                   )}
                                 </div>
                               </div>
                               {selectedContact && isSelected && (
                                 <div className="space-y-1 text-sm text-gray-600 ml-8 mt-2 border-t pt-2">
                                   {selectedContact.companyName && (
                                     <div className="flex items-center gap-2">
                                       <Building2 className="w-3 h-3" />
                                       <span className="font-medium">{selectedContact.companyName}</span>
                                     </div>
                                   )}
                                   {selectedContact.email && (
                                     <div className="flex items-center gap-2">
                                       <Mail className="w-3 h-3" />
                                       <span>{selectedContact.email}</span>
                                     </div>
                                   )}
                                   {selectedContact.phone && (
                                     <div className="flex items-center gap-2">
                                       <Phone className="w-3 h-3" />
                                       <span>{selectedContact.phone}</span>
                                     </div>
                                   )}
                                   {(selectedContact.address1 || selectedContact.city) && (
                                     <div className="flex items-center gap-2">
                                       <MapPin className="w-3 h-3" />
                                       <span>
                                         {[selectedContact.address1, selectedContact.city, selectedContact.state, selectedContact.zip]
                                           .filter(Boolean)
                                           .join(', ')}
                                       </span>
                                     </div>
                                   )}
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
                 <button
                   onClick={handleConfirm}
                   disabled={!selectedContact || loadingContact}
                   className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {loadingContact ? 'Loading Contact...' : 'Use This Contact'}
                 </button>
        </div>
      </div>
    </div>
  );
}

