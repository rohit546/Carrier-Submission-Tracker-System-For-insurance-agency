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
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<any>(null);

  useEffect(() => {
    // Wait for Google Maps to load and initialize AutocompleteService only
    const checkGoogleMaps = () => {
      if (window.google?.maps?.places) {
        try {
          // Only use AutocompleteService - don't attach widget to input to avoid blocking
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          setIsGoogleMapsLoaded(true);
          console.log('✅ Google Autocomplete Service initialized');
        } catch (err) {
          console.error('❌ Autocomplete Service initialization failed:', err);
          setIsGoogleMapsLoaded(false);
        }
      } else {
        // Retry after a short delay if Google Maps isn't loaded yet
        setTimeout(checkGoogleMaps, 200);
      }
    };

    // Start checking immediately and also after a delay
    const timer1 = setTimeout(checkGoogleMaps, 100);
    const timer2 = setTimeout(checkGoogleMaps, 1000);
    const timer3 = setTimeout(() => {
      if (!isGoogleMapsLoaded) {
        console.warn('⚠️ Google Maps not loaded after 3 seconds. Check API key.');
      }
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isGoogleMapsLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchAddress(value);
    
    // Always allow typing - don't block input
    if (value.length >= 3 && autocompleteServiceRef.current && window.google?.maps?.places) {
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
          if (status !== 'ZERO_RESULTS') {
            console.warn('⚠️ Autocomplete status:', status);
          }
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
    <div className="relative">
      <div className="p-6 border-2 border-green-100 bg-gradient-to-br from-green-50/50 to-white rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-green-100 rounded-xl">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Property Address Lookup</h3>
            <p className="text-xs text-gray-500">
              Enter property address to fetch enrichment data
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={addressInputRef}
                type="text"
                value={searchAddress}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFetchData();
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Start typing address... (e.g., 280 Griffin St, McDonough, GA)"
                className="w-full pl-10 pr-3 h-12 border border-green-200 rounded-lg focus:border-green-400 focus:ring-green-400 disabled:opacity-50 outline-none text-sm"
                disabled={isLoading}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {!isGoogleMapsLoaded && searchAddress.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    ⚠️ API key needed
                  </div>
                </div>
              )}
            </div>

            {/* Autocomplete Suggestions - Matching Frame */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-2 p-2 border border-green-200 rounded-lg shadow-lg bg-white">
                {suggestions.map((prediction, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2 text-sm"
                    onClick={() => handleSuggestionClick(prediction)}
                  >
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {prediction.structured_formatting?.main_text || prediction.description}
                      </div>
                      {prediction.structured_formatting?.secondary_text && (
                        <div className="text-xs text-gray-500">
                          {prediction.structured_formatting.secondary_text}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleFetchData}
            disabled={!searchAddress.trim() || isLoading}
            className="h-12 px-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Fetch Data
              </>
            )}
          </button>
        </div>

        {searchAddress && (
          <div className="mt-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {searchAddress}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
