'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface AddressSearchProps {
  onAddressSelect: (address: string) => void;
  onFetchData: (address: string) => void;
  isLoading?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function AddressSearch({ onAddressSelect, onFetchData, isLoading = false }: AddressSearchProps) {
  const [searchAddress, setSearchAddress] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Google Maps Autocomplete
    const timer = setTimeout(() => {
      if (window.google?.maps?.places && addressInputRef.current) {
        try {
          const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'us' }
          });
          
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
              setSearchAddress(place.formatted_address);
              setShowSuggestions(false);
              onAddressSelect(place.formatted_address);
            }
          });
          
          // Initialize autocomplete service for suggestions
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          
          console.log('✅ Google Autocomplete initialized');
        } catch (err) {
          console.log('Autocomplete initialization failed:', err);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [onAddressSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchAddress(value);
    
    if (value.length >= 3 && autocompleteServiceRef.current) {
      const request = {
        input: value,
        componentRestrictions: { country: 'us' }
      };

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions: any[], status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (prediction: any) => {
    setSearchAddress(prediction.description);
    setShowSuggestions(false);
    onAddressSelect(prediction.description);
  };

  const handleFetchData = () => {
    if (searchAddress.trim()) {
      onFetchData(searchAddress);
    }
  };

  return (
    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-gray-900">Property Address Lookup</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">Enter property address to fetch enrichment data.</p>
      
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            ref={addressInputRef}
            type="text"
            value={searchAddress}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Start typing address... (e.g., 280 Griffin St, McDonough, GA)"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((prediction, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(prediction)}
                  className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                >
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-gray-500">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={handleFetchData}
          disabled={!searchAddress.trim() || isLoading}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Fetch Data</span>
            </>
          )}
        </button>
      </div>
      
      {/* Selected Address Display */}
      {searchAddress && !showSuggestions && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>{searchAddress}</span>
        </div>
      )}
    </div>
  );
}
