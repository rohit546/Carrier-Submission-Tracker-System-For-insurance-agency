'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronUp, Check, MapPin, FileText, User, Home, Map, Copy, Ruler, Navigation, Satellite, Clock, ChevronLeft, ChevronRight, FastForward } from 'lucide-react';
import AreaMeasurementModal from './AreaMeasurementModal';

interface PropertyDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onApply?: (data: any) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function PropertyDataModal({ isOpen, onClose, data, onApply }: PropertyDataModalProps) {
  const [activeTab, setActiveTab] = useState<'attributes' | 'maps'>('attributes');
  const [mapView, setMapView] = useState<'3d' | 'satellite' | 'normal' | 'measurement'>('3d');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['address', 'owner']));
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [measuredArea, setMeasuredArea] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showHistoricalImagery, setShowHistoricalImagery] = useState(false);

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
    return 0;
  };

  const getAllAttributesCount = (): number => {
    return Object.keys(data).filter(key => {
      const value = data[key];
      return value !== null && value !== undefined && value !== '' && typeof value !== 'object';
    }).length;
  };

  const handleApply = () => {
    if (onApply) {
      onApply(data);
    }
    onClose();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Historical Imagery Control Component
  const HistoricalImageryControl = ({ 
    selectedDate, 
    onDateChange, 
    showHistoricalImagery 
  }: { 
    selectedDate: Date; 
    onDateChange: (date: Date) => void;
    showHistoricalImagery: boolean;
  }) => {
    const currentYear = new Date().getFullYear();
    const startYear = 2008;
    const availableYears = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
    
    const formatDate = (date: Date) => {
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };

    const navigateDate = (direction: 'prev' | 'next' | 'latest') => {
      const newDate = new Date(selectedDate);
      if (direction === 'prev') {
        newDate.setFullYear(newDate.getFullYear() - 1);
        if (newDate.getFullYear() < startYear) {
          newDate.setFullYear(startYear);
        }
      } else if (direction === 'next') {
        newDate.setFullYear(newDate.getFullYear() + 1);
        if (newDate.getFullYear() > currentYear) {
          newDate.setFullYear(currentYear);
        }
      } else if (direction === 'latest') {
        newDate.setFullYear(currentYear);
        newDate.setMonth(11);
        newDate.setDate(31);
      }
      onDateChange(newDate);
    };

    const selectYear = (year: number) => {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(year);
      if (year === currentYear) {
        newDate.setMonth(11);
        newDate.setDate(31);
      } else {
        newDate.setMonth(11);
        newDate.setDate(31);
      }
      onDateChange(newDate);
    };

    if (!showHistoricalImagery) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 mb-4">
        {/* Historical Imagery Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Historical imagery</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              disabled={selectedDate.getFullYear() <= startYear}
              className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-blue-600 min-w-[100px] text-center">
              {formatDate(selectedDate)}
            </span>
            <button
              onClick={() => navigateDate('next')}
              disabled={selectedDate.getFullYear() >= currentYear}
              className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => navigateDate('latest')}
              className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-full"
              title="Jump to latest"
            >
              <FastForward className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="flex items-center justify-between gap-1">
            {availableYears.map((year) => {
              const isSelected = selectedDate.getFullYear() === year;
              return (
                <div key={year} className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => selectYear(year)}
                    className={`w-2 h-2 rounded-full mb-1 transition-all ${
                      isSelected 
                        ? 'w-3 h-3 bg-blue-600 ring-2 ring-blue-300' 
                        : 'bg-blue-400 hover:bg-blue-500'
                    }`}
                    title={`${year}`}
                  />
                  <span className={`text-[9px] mt-1 ${isSelected ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                    {year}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Map View Component
  const MapViewComponent = ({ view, data, measuredArea, onMeasuredAreaChange, selectedDate, showHistoricalImagery, onDateChange }: {
    view: '3d' | 'satellite' | 'normal' | 'measurement';
    data: any;
    measuredArea: number | null;
    onMeasuredAreaChange: (area: number | null) => void;
    selectedDate: Date;
    showHistoricalImagery: boolean;
    onDateChange: (date: Date) => void;
  }) => {
    const localMapRef = useRef<HTMLDivElement>(null);
    const localMapInstance = useRef<any>(null);
    const localDrawingManager = useRef<any>(null);
    const localPolygon = useRef<any>(null);
    const streetViewRef = useRef<HTMLDivElement>(null);
    const panoramaRef = useRef<any>(null);
    const [localLoading, setLocalLoading] = useState(true);
    const [streetViewLoading, setStreetViewLoading] = useState(true);
    const lat = data.latitude || data.coordinates?.lat || 33.580;
    const lng = data.longitude || data.coordinates?.lng || -84.386;
    
    // Get API key: try env var first, then extract from loaded Google Maps script
    const getGoogleMapsApiKey = () => {
      // First try environment variable (embedded at build time)
      if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      }
      
      // If not available, try to extract from the loaded Google Maps script
      if (typeof window !== 'undefined') {
        const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
        for (const script of scripts) {
          const src = (script as HTMLScriptElement).src;
          const match = src.match(/[?&]key=([^&]+)/);
          if (match && match[1]) {
            return decodeURIComponent(match[1]);
          }
        }
      }
      
      return '';
    };
    
    const googleMapsApiKey = getGoogleMapsApiKey();

    useEffect(() => {
      if (view === 'measurement') {
        const waitForGoogle = () => {
          if (!window.google?.maps?.drawing || !window.google?.maps?.geometry) {
            setTimeout(waitForGoogle, 200);
            return;
          }
          if (!localMapRef.current) return;
          
          const centerPoint = { lat: Number(lat), lng: Number(lng) };
          
          if (localMapInstance.current && localDrawingManager.current) {
            localMapInstance.current.setCenter(centerPoint);
            setLocalLoading(false);
            return;
          }

          const map = new window.google.maps.Map(localMapRef.current, {
            zoom: 19,
            center: centerPoint,
            mapTypeId: 'hybrid',
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
          });

          localMapInstance.current = map;
          setLocalLoading(false);

          const drawingManager = new window.google.maps.drawing.DrawingManager({
            drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            drawingControlOptions: {
              position: window.google.maps.ControlPosition.TOP_CENTER,
              drawingModes: ['polygon'],
            },
            polygonOptions: {
              editable: true,
              strokeWeight: 2,
              fillOpacity: 0.4,
              fillColor: '#10B981',
              strokeColor: '#059669',
            },
          });

          drawingManager.setMap(map);
          localDrawingManager.current = drawingManager;

          const calculateArea = (poly: any) => {
            const areaMeters = window.google.maps.geometry.spherical.computeArea(poly.getPath());
            const areaFeet = areaMeters * 10.7639;
            onMeasuredAreaChange(areaFeet);
          };

          window.google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event: any) {
            if (event.type === 'polygon') {
              if (localPolygon.current) localPolygon.current.setMap(null);
              localPolygon.current = event.overlay;
              calculateArea(localPolygon.current);

              window.google.maps.event.addListener(localPolygon.current.getPath(), 'set_at', () => calculateArea(localPolygon.current));
              window.google.maps.event.addListener(localPolygon.current.getPath(), 'insert_at', () => calculateArea(localPolygon.current));
            }
          });
        };
        waitForGoogle();
      } else if (view === 'satellite' || view === 'normal') {
        const waitForGoogle = () => {
          if (!window.google?.maps) {
            setTimeout(waitForGoogle, 200);
            return;
          }
          if (!localMapRef.current) return;
          
          const centerPoint = { lat: Number(lat), lng: Number(lng) };
          const mapType = view === 'satellite' ? 'hybrid' : 'roadmap';
          
          if (localMapInstance.current) {
            localMapInstance.current.setMapTypeId(mapType);
            localMapInstance.current.setCenter(centerPoint);
            setLocalLoading(false);
            return;
          }

          const map = new window.google.maps.Map(localMapRef.current, {
            zoom: 19,
            center: centerPoint,
            mapTypeId: mapType,
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          });

          localMapInstance.current = map;
          setLocalLoading(false);

          new window.google.maps.Marker({
            position: centerPoint,
            map: map,
            title: 'Property Location',
          });
        };
        waitForGoogle();
      }

      return () => {
        if (localDrawingManager.current) {
          localDrawingManager.current.setMap(null);
          localDrawingManager.current = null;
        }
        if (localPolygon.current) {
          localPolygon.current.setMap(null);
          localPolygon.current = null;
        }
      };
    }, [view, lat, lng, onMeasuredAreaChange]);

    // Initialize Street View for 3D map with historical imagery support
    useEffect(() => {
      if (view !== '3d' || !googleMapsApiKey || !streetViewRef.current) return;

      const waitForGoogle = () => {
        if (!window.google?.maps?.StreetViewPanorama || !window.google?.maps?.StreetViewService) {
          setTimeout(waitForGoogle, 200);
          return;
        }

        const centerPoint = { lat: Number(lat), lng: Number(lng) };
        setStreetViewLoading(true);

        if (showHistoricalImagery) {
          // Use StreetViewService to find historical panoramas by date
          const service = new window.google.maps.StreetViewService();
          const targetYear = selectedDate.getFullYear();
          
          // Search at multiple nearby locations to find panoramas from different dates
          // Google captures panoramas as the Street View car moves, so nearby locations may have different dates
          const searchOffsets = [
            { lat: 0, lng: 0 },           // Original location
            { lat: 0.0001, lng: 0 },     // ~11m north
            { lat: -0.0001, lng: 0 },    // ~11m south
            { lat: 0, lng: 0.0001 },     // ~11m east
            { lat: 0, lng: -0.0001 },    // ~11m west
            { lat: 0.0002, lng: 0.0002 }, // ~22m northeast
            { lat: -0.0002, lng: -0.0002 }, // ~22m southwest
          ];
          
          const foundPanoramas: Array<{panoId: string, date: Date, yearDiff: number}> = [];
          let completedSearches = 0;
          const totalSearches = searchOffsets.length;

          const searchForPanoramas = (offsetIndex: number) => {
            if (offsetIndex >= searchOffsets.length) {
              // All searches complete, find and display best match
              displayBestMatch();
              return;
            }

            const offset = searchOffsets[offsetIndex];
            const searchLocation = {
              lat: centerPoint.lat + offset.lat,
              lng: centerPoint.lng + offset.lng
            };

            const request = {
              location: searchLocation,
              radius: 50,
              source: window.google.maps.StreetViewSource.OUTDOOR
            };

            service.getPanorama(request, (data: any, status: string) => {
              if (status === 'OK' && data && data.location && data.location.pano) {
                const panoId = data.location.pano;
                
                // Skip if we already have this panorama
                if (foundPanoramas.some(p => p.panoId === panoId)) {
                  completedSearches++;
                  if (completedSearches >= totalSearches) {
                    displayBestMatch();
                  } else {
                    searchForPanoramas(offsetIndex + 1);
                  }
                  return;
                }
                
                // Get panorama details to check date
                service.getPanoramaById(panoId, (panoData: any, panoStatus: string) => {
                  if (panoStatus === 'OK' && panoData && panoData.imageDate) {
                    const panoDate = new Date(panoData.imageDate);
                    const panoYear = panoDate.getFullYear();
                    const yearDiff = Math.abs(panoYear - targetYear);
                    
                    // Store panorama with date info
                    foundPanoramas.push({
                      panoId: panoId,
                      date: panoDate,
                      yearDiff: yearDiff
                    });
                  }
                  
                  completedSearches++;
                  if (completedSearches >= totalSearches) {
                    displayBestMatch();
                  } else {
                    searchForPanoramas(offsetIndex + 1);
                  }
                });
              } else {
                completedSearches++;
                if (completedSearches >= totalSearches) {
                  displayBestMatch();
                } else {
                  searchForPanoramas(offsetIndex + 1);
                }
              }
            });
          };

          const displayBestMatch = () => {
            if (foundPanoramas.length === 0) {
              // No panoramas found, use default
              initializeDefaultPanorama();
              return;
            }

            // Sort by year difference from target
            foundPanoramas.sort((a, b) => a.yearDiff - b.yearDiff);
            const bestMatch = foundPanoramas[0];

            // Initialize or update panorama with the best matching historical panorama
            if (!panoramaRef.current) {
              panoramaRef.current = new window.google.maps.StreetViewPanorama(streetViewRef.current, {
                pano: bestMatch.panoId,
                pov: {
                  heading: 210,
                  pitch: 10
                },
                zoom: 1,
                visible: true
              });

              window.google.maps.event.addListenerOnce(panoramaRef.current, 'status_changed', () => {
                if (panoramaRef.current?.getStatus() === 'OK') {
                  setStreetViewLoading(false);
                } else {
                  initializeDefaultPanorama();
                }
              });
            } else {
              // Update existing panorama to show historical view
              panoramaRef.current.setPano(bestMatch.panoId);
              panoramaRef.current.setPov({
                heading: 210,
                pitch: 10
              });
              
              window.google.maps.event.addListenerOnce(panoramaRef.current, 'status_changed', () => {
                if (panoramaRef.current?.getStatus() === 'OK') {
                  setStreetViewLoading(false);
                } else {
                  initializeDefaultPanorama();
                }
              });
            }
          };

          const initializeDefaultPanorama = () => {
            if (!panoramaRef.current) {
              panoramaRef.current = new window.google.maps.StreetViewPanorama(streetViewRef.current, {
                position: centerPoint,
                pov: {
                  heading: 210,
                  pitch: 10
                },
                zoom: 1,
                visible: true
              });
            }
            setStreetViewLoading(false);
          };

          // Start searching for historical panoramas
          searchForPanoramas(0);
        } else {
          // Standard Street View without historical imagery
          if (!panoramaRef.current) {
            panoramaRef.current = new window.google.maps.StreetViewPanorama(streetViewRef.current, {
              position: centerPoint,
              pov: {
                heading: 210,
                pitch: 10
              },
              zoom: 1,
              visible: true
            });

            window.google.maps.event.addListenerOnce(panoramaRef.current, 'status_changed', () => {
              setStreetViewLoading(false);
            });
          } else {
            panoramaRef.current.setPosition(centerPoint);
            setStreetViewLoading(false);
          }
        }
      };

      waitForGoogle();

      return () => {
        if (panoramaRef.current) {
          window.google.maps.event.clearInstanceListeners(panoramaRef.current);
        }
      };
    }, [view, lat, lng, showHistoricalImagery, selectedDate, googleMapsApiKey]);

    if (view === '3d') {

      const streetViewUrl = googleMapsApiKey && !showHistoricalImagery
        ? `https://www.google.com/maps/embed/v1/streetview?key=${googleMapsApiKey}&location=${lat},${lng}&heading=210&pitch=10&fov=90`
        : null;
      
      return (
        <>
          <HistoricalImageryControl
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            showHistoricalImagery={showHistoricalImagery}
          />
          <div className="rounded-xl overflow-hidden border-2 border-emerald-400 shadow-lg relative" style={{ height: '450px' }}>
            {showHistoricalImagery && googleMapsApiKey ? (
              <>
                {streetViewLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">Loading historical Street View...</p>
                    </div>
                  </div>
                )}
                <div ref={streetViewRef} style={{ width: '100%', height: '100%' }}></div>
              </>
            ) : streetViewUrl ? (
              <iframe
                width="100%"
                height="450"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={streetViewUrl}
              />
            ) : (
              <div className="h-[450px] flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-500">
                  <Navigation className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>3D Street View requires Google Maps API key</p>
                </div>
              </div>
            )}
          </div>
          {measuredArea !== null && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Measured Property Area:</p>
                  <p className="text-lg font-bold text-green-600">
                    {measuredArea.toLocaleString('en-US', { maximumFractionDigits: 0 })} sq ft
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    ({(measuredArea / 43560).toFixed(3)} acres)
                  </p>
                </div>
                <button
                  onClick={() => onMeasuredAreaChange(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 text-[10px] text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                  <MapPin className="w-2.5 h-2.5 text-green-600" />
                </div>
                <span>Count MPDs for fuel dispensers</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Ruler className="w-2.5 h-2.5 text-green-600" />
                </div>
                <span>Drag to look around</span>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (view === 'satellite' || view === 'normal') {
      return (
        <>
          {showHistoricalImagery && view === 'satellite' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-900 mb-1">Historical Satellite Imagery</p>
                  <p className="text-[10px] text-blue-700">
                    Full historical satellite imagery requires Google Earth Engine integration. 
                    Historical imagery is currently available for Street View (3D Map).
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-xl overflow-hidden border-2 border-emerald-400 shadow-lg relative" style={{ height: '450px' }}>
            {localLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
            <div ref={localMapRef} style={{ width: '100%', height: '100%' }}></div>
          </div>
          {measuredArea !== null && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Measured Property Area:</p>
                  <p className="text-lg font-bold text-green-600">
                    {measuredArea.toLocaleString('en-US', { maximumFractionDigits: 0 })} sq ft
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    ({(measuredArea / 43560).toFixed(3)} acres)
                  </p>
                </div>
                <button
                  onClick={() => onMeasuredAreaChange(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      );
    }

    if (view === 'measurement') {
      return (
        <>
          <div className="rounded-xl overflow-hidden border-2 border-emerald-400 shadow-lg relative" style={{ height: '450px' }}>
            {localLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading measurement map...</p>
                </div>
              </div>
            )}
            <div ref={localMapRef} style={{ width: '100%', height: '100%' }}></div>
            {measuredArea !== null && (
              <div className="absolute bottom-4 left-4 bg-white px-5 py-3 rounded-lg shadow-lg border-2 border-green-500 z-20">
                <p className="text-xs text-gray-600 mb-1">Calculated Area:</p>
                <p className="text-xl font-bold text-green-600">
                  {measuredArea.toLocaleString('en-US', { maximumFractionDigits: 0 })} sq ft
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  ({(measuredArea / 43560).toFixed(3)} acres)
                </p>
              </div>
            )}
          </div>
          <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-700">
              <strong className="text-green-600">📍 How to use:</strong> 
              <span className="ml-2">Click the polygon icon (⬡) at the top, then click on the map to mark corners</span>
            </p>
          </div>
        </>
      );
    }

    return null;
  };

  const renderAttributeCard = (label: string, value: string | number, isPrimary: boolean = false) => {
    if (!value && value !== 0) return null;
    
    const valueStr = String(value);
    
    return (
      <div className={`bg-white rounded-lg p-2 relative group transition-all ${
        isPrimary 
          ? 'border-2 border-green-500' 
          : 'border border-gray-200 hover:border-green-300'
      }`}>
        {/* Copy Icon - Appears on Hover */}
        <button
          onClick={() => handleCopy(valueStr)}
          className="absolute top-1 right-1 w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
          title="Copy to clipboard"
        >
          <Copy className="w-2.5 h-2.5" />
        </button>
        
        {/* Content */}
        <div className="pr-4">
          <div className="text-[10px] font-medium text-gray-600 mb-0.5">{label}</div>
          <div className="text-xs font-medium text-gray-800 break-words leading-tight">{valueStr}</div>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, sectionKey: string, icon: React.ReactNode, fields: Array<{ key: string; label: string; getValue: (data: any) => any }>) => {
    const isExpanded = expandedSections.has(sectionKey);
    const count = fields.filter(f => {
      const value = f.getValue(data);
      return value !== null && value !== undefined && value !== '';
    }).length;
    const total = fields.length;
    
    if (count === 0) return null;

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-2 bg-white">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              {icon}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900">{title}</div>
              <div className="text-[10px] text-gray-500">{count} attrs</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-600">{count}/{total}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>
        
        {isExpanded && (
          <div className="p-3 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
              {fields.map((field, index) => {
                const value = field.getValue(data);
                if (value === null || value === undefined || value === '') return null;
                // First field (usually Street) gets green border as primary
                const isPrimary = index === 0 && sectionKey === 'address';
                return (
                  <div key={field.key}>
                    {renderAttributeCard(field.label, value, isPrimary)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[calc(100vw-96px)] h-[calc(100vh-96px)] max-h-[calc(100vh-96px)] overflow-hidden flex flex-col">
        {/* Header - Matching Screenshot */}
        <div className="px-5 pt-3 pb-2.5 border-b border-green-100 bg-gradient-to-r from-green-50 to-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Property Data & Maps</h2>
                <p className="text-[9px] text-gray-600 mt-0.5">View fetched property information, maps, and enrichment data</p>
              </div>
            </div>
            
            {/* Close Button - Inside Modal - Bigger and More Visible */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center group hover:scale-110 border-2 border-red-400"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
          {/* Tabs - Centered - Bigger */}
          <div className="px-5 pt-3 pb-2.5 flex items-center justify-center">
            <div className="inline-flex w-auto bg-green-50 border border-green-200 p-1 h-10 rounded-full shadow-sm">
              <button
                onClick={() => setActiveTab('attributes')}
                className={`px-5 py-2 rounded-full transition-all text-sm font-medium text-center flex items-center justify-center ${
                  activeTab === 'attributes'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                    : 'text-black hover:bg-green-100'
                }`}
              >
                All Attributes ({getAllAttributesCount()})
              </button>
              <button
                onClick={() => setActiveTab('maps')}
                className={`px-5 py-2 rounded-full transition-all text-sm font-medium text-center flex items-center justify-center ${
                  activeTab === 'maps'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                    : 'text-black hover:bg-green-100'
                }`}
              >
                3D Maps
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            {activeTab === 'attributes' ? (
              <div>
                {/* Property Enrichment Data Header */}
                <div className="mb-5 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Property Enrichment Data</h3>
                        <p className="text-xs text-gray-600 mt-0.5">{getAllAttributesCount()} attributes</p>
                      </div>
                    </div>
                    {/* Apply Button - With Property Enrichment Data */}
                    <button
                      onClick={handleApply}
                      className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Apply
                    </button>
                  </div>
                </div>

                {/* Address Information Section */}
                {(() => {
                  const matchedAddress = data.matchedAddress || {};
                  const hasAddressData = matchedAddress.street || matchedAddress.city || data.address || data.latitude;
                  
                  if (hasAddressData) {
                    const addressFields = [
                      { key: 'street', label: 'Street', getValue: (d: any) => d.matchedAddress?.street },
                      { key: 'city', label: 'City', getValue: (d: any) => d.matchedAddress?.city },
                      { key: 'state', label: 'State', getValue: (d: any) => d.matchedAddress?.state },
                      { key: 'zipcode', label: 'ZIP Code', getValue: (d: any) => d.matchedAddress?.zipcode },
                      { key: 'fullAddress', label: 'Full Address', getValue: (d: any) => d.address || d.fullAddress },
                      { key: 'county', label: 'County', getValue: (d: any) => d.county },
                      { key: 'latitude', label: 'Latitude', getValue: (d: any) => d.latitude || d.coordinates?.lat },
                      { key: 'longitude', label: 'Longitude', getValue: (d: any) => d.longitude || d.coordinates?.lng },
                    ];
                    
                    return renderSection(
                      'Address Information',
                      'address',
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />,
                      addressFields
                    );
                  }
                  return null;
                })()}
                
                {/* Mailing Address Section */}
                {(() => {
                  const mailingAddress = data.mailingAddress || {};
                  const hasMailingData = mailingAddress.fullAddress || data.fullMailingAddress;
                  
                  if (hasMailingData) {
                    const mailingFields = [
                      { key: 'fullMailingAddress', label: 'Full Mailing Address', getValue: (d: any) => d.fullMailingAddress || d.mailingAddress?.fullAddress },
                      { key: 'mailingCity', label: 'Mailing City', getValue: (d: any) => d.mailingAddress?.city },
                      { key: 'mailingState', label: 'Mailing State', getValue: (d: any) => d.mailingAddress?.state },
                      { key: 'mailingZip', label: 'Mailing ZIP', getValue: (d: any) => d.mailingAddress?.zipcode },
                      { key: 'mailingCounty', label: 'Mailing County', getValue: (d: any) => d.mailingAddress?.county },
                    ];
                    
                    return renderSection(
                      'Mailing Address',
                      'mailing',
                      <FileText className="w-3.5 h-3.5 text-blue-600" />,
                      mailingFields
                    );
                  }
                  return null;
                })()}
                
                {/* Owner & Deed Information */}
                {renderSection(
                  'Owner & Deed Information',
                  'owner',
                      <User className="w-3.5 h-3.5 text-blue-600" />,
                  [
                    { key: 'deedOwnerFullName', label: 'Deed Owner Full Name', getValue: (d: any) => d.deedOwnerFullName },
                    { key: 'deedOwnerLastName', label: 'Deed Owner Last Name', getValue: (d: any) => d.deedOwnerLastName },
                    { key: 'ownerFullName', label: 'Owner Full Name', getValue: (d: any) => d.ownerFullName },
                    { key: 'corporationName', label: 'Corporation Name', getValue: (d: any) => d.corporationName },
                    { key: 'ownerOccupancyStatus', label: 'Owner Occupancy Status', getValue: (d: any) => d.ownerOccupancyStatus },
                    { key: 'ownershipType', label: 'Ownership Type', getValue: (d: any) => d.ownershipType },
                    { key: 'companyFlag', label: 'Company Flag', getValue: (d: any) => d.companyFlag },
                  ]
                )}
                
                {/* Mortgage & Lender Information */}
                {data.lenderName && renderSection(
                  'Mortgage & Lender Information',
                  'mortgage',
                  <FileText className="w-3.5 h-3.5 text-blue-600" />,
                  [
                    { key: 'lenderName', label: 'Lender Name', getValue: (d: any) => d.lenderName },
                    { key: 'mortgageAmount', label: 'Mortgage Amount', getValue: (d: any) => d.mortgageAmount },
                    { key: 'mortgageDueDate', label: 'Mortgage Due Date', getValue: (d: any) => d.mortgageDueDate },
                    { key: 'mortgageRecordingDate', label: 'Mortgage Recording Date', getValue: (d: any) => d.mortgageRecordingDate },
                    { key: 'mortgageTerm', label: 'Mortgage Term', getValue: (d: any) => d.mortgageTerm },
                    { key: 'mortgageType', label: 'Mortgage Type', getValue: (d: any) => d.mortgageType },
                  ]
                )}
                
                {/* Building & Property Details */}
                {renderSection(
                  'Building & Property Details',
                  'property',
                      <Home className="w-3.5 h-3.5 text-blue-600" />,
                  [
                    { key: 'buildingSqft', label: 'Building SQFT', getValue: (d: any) => d.buildingSqft },
                    { key: 'assessedValue', label: 'Assessed Value', getValue: (d: any) => d.assessedValue },
                    { key: 'yearBuilt', label: 'Year Built', getValue: (d: any) => d.yearBuilt },
                    { key: 'storiesNumber', label: 'Stories Number', getValue: (d: any) => d.storiesNumber },
                    { key: 'numberOfBuildings', label: 'Number of Buildings', getValue: (d: any) => d.numberOfBuildings },
                    { key: 'exteriorWalls', label: 'Exterior Walls', getValue: (d: any) => d.exteriorWalls },
                    { key: 'flooring', label: 'Flooring', getValue: (d: any) => d.flooring },
                    { key: 'construction_type', label: 'Construction Type', getValue: (d: any) => d.construction_type },
                    { key: 'canopy', label: 'Canopy', getValue: (d: any) => d.canopy },
                    { key: 'canopySqft', label: 'Canopy SQFT', getValue: (d: any) => d.canopySqft },
                  ]
                )}
                
                {/* Land Use & Legal */}
                {renderSection(
                  'Land Use & Legal',
                  'landUse',
                      <Map className="w-3.5 h-3.5 text-blue-600" />,
                  [
                    { key: 'landUseGroup', label: 'Land Use Group', getValue: (d: any) => d.landUseGroup },
                    { key: 'landUseStandard', label: 'Land Use Standard', getValue: (d: any) => d.landUseStandard },
                    { key: 'legalDescription', label: 'Legal Description', getValue: (d: any) => d.legalDescription },
                  ]
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Map Sub-Tabs - Matching Frame Design */}
                <div className="flex items-center justify-center">
                  <div className="inline-flex w-auto bg-green-50 border border-green-200 p-1 h-9 rounded-full shadow-sm">
                    <button
                      onClick={() => setMapView('3d')}
                      className={`px-3 py-1.5 rounded-full transition-all text-xs font-medium text-center flex items-center justify-center gap-1 ${
                        mapView === '3d'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                          : 'text-black hover:bg-green-100'
                      }`}
                    >
                      <Navigation className="w-3 h-3" />
                      3D Map
                    </button>
                    <button
                      onClick={() => setMapView('satellite')}
                      className={`px-3 py-1.5 rounded-full transition-all text-xs font-medium text-center flex items-center justify-center gap-1 ${
                        mapView === 'satellite'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                          : 'text-black hover:bg-green-100'
                      }`}
                    >
                      <Satellite className="w-3 h-3" />
                      Satellite
                    </button>
                    <button
                      onClick={() => setMapView('normal')}
                      className={`px-3 py-1.5 rounded-full transition-all text-xs font-medium text-center flex items-center justify-center gap-1 ${
                        mapView === 'normal'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                          : 'text-black hover:bg-green-100'
                      }`}
                    >
                      <Map className="w-3 h-3" />
                      Normal
                    </button>
                    <button
                      onClick={() => setMapView('measurement')}
                      className={`px-3 py-1.5 rounded-full transition-all text-xs font-medium text-center flex items-center justify-center gap-1 ${
                        mapView === 'measurement'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                          : 'text-black hover:bg-green-100'
                      }`}
                    >
                      <Ruler className="w-3 h-3" />
                      Measurement
                    </button>
                  </div>
                </div>

                {/* Historical Imagery Toggle */}
                {(mapView === '3d' || mapView === 'satellite') && (
                  <div className="flex items-center justify-end mb-2">
                    <button
                      onClick={() => setShowHistoricalImagery(!showHistoricalImagery)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        showHistoricalImagery
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Historical Imagery
                    </button>
                  </div>
                )}

                {/* Map Display Based on Selected View */}
                <MapViewComponent
                  view={mapView}
                  data={data}
                  measuredArea={measuredArea}
                  onMeasuredAreaChange={setMeasuredArea}
                  selectedDate={selectedDate}
                  showHistoricalImagery={showHistoricalImagery}
                  onDateChange={setSelectedDate}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Area Measurement Modal */}
      <AreaMeasurementModal
        isOpen={showMeasurementModal}
        onClose={() => setShowMeasurementModal(false)}
        latitude={data.latitude || data.coordinates?.lat || 33.580}
        longitude={data.longitude || data.coordinates?.lng || -84.386}
        onAreaCalculated={(area) => {
          setMeasuredArea(area);
          setShowMeasurementModal(false);
        }}
      />
    </div>
  );
}
