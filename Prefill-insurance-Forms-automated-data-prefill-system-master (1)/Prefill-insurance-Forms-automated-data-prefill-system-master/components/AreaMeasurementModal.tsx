'use client'

import { useEffect, useState, useRef } from 'react'

interface AreaMeasurementModalProps {
  isOpen: boolean
  onClose: () => void
  latitude?: number
  longitude?: number
  onAreaCalculated?: (area: number) => void
}

export function AreaMeasurementModal({
  isOpen,
  onClose,
  latitude = 33.580,
  longitude = -84.386,
  onAreaCalculated
}: AreaMeasurementModalProps) {
  const [measuredArea, setMeasuredArea] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mapInitialized = useRef(false)
  const mapInstance = useRef<any>(null)
  const drawingManagerInstance = useRef<any>(null)

  useEffect(() => {
    if (!isOpen) {
      // Re-enable body scroll when modal closes
      document.body.style.overflow = 'unset'
      
      // Cleanup when modal closes
      if (window.google && mapInstance.current) {
        window.google.maps.event.clearInstanceListeners(window)
        if (drawingManagerInstance.current) {
          drawingManagerInstance.current.setMap(null)
        }
      }
      mapInitialized.current = false
      mapInstance.current = null
      drawingManagerInstance.current = null
      setMeasuredArea(null)
      setIsLoading(true)
      return
    }

    // Disable body scroll when modal opens
    document.body.style.overflow = 'hidden'

    // Prevent scroll events from reaching the body
    const preventScroll = (e: WheelEvent) => {
      const mapContainer = document.getElementById('measurement-map')
      if (mapContainer && mapContainer.contains(e.target as Node)) {
        // Allow scrolling on map (it will handle zoom)
        return
      }
      // Prevent scroll on other areas
      e.preventDefault()
    }
    
    document.addEventListener('wheel', preventScroll, { passive: false })

    // Wait for Google Maps to be fully loaded with retry logic
    const waitForGoogle = () => {
      console.log('Checking for Google Maps...', {
        hasGoogle: !!window.google,
        hasMaps: !!window.google?.maps,
        hasDrawing: !!window.google?.maps?.drawing,
        hasDrawingManager: !!window.google?.maps?.drawing?.DrawingManager,
        hasGeometry: !!window.google?.maps?.geometry
      })

      if (!window.google?.maps?.drawing?.DrawingManager || !window.google?.maps?.geometry) {
        setTimeout(waitForGoogle, 200)
        return
      }

      const mapElement = document.getElementById('measurement-map')
      if (!mapElement) {
        console.log('Map element not found, retrying...')
        setTimeout(waitForGoogle, 200)
        return
      }

      if (mapInitialized.current) {
        console.log('Map already initialized')
        return
      }

      console.log('✅ Google Maps ready, initializing map...')
      console.log('Received coordinates:', { latitude, longitude })
      console.log('Map element dimensions:', {
        width: mapElement.offsetWidth,
        height: mapElement.offsetHeight,
        clientWidth: mapElement.clientWidth,
        clientHeight: mapElement.clientHeight
      })
      
      mapInitialized.current = true

      try {
        const centerPoint = { lat: Number(latitude), lng: Number(longitude) }
        console.log('Using center point:', centerPoint)
        
        const map = new window.google.maps.Map(mapElement, {
          zoom: 19,
          center: centerPoint,
          mapTypeId: 'hybrid', // Changed from 'satellite' to 'hybrid'
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: true,
          fullscreenControl: true,
          backgroundColor: '#e5e3df',
          // Enable scroll wheel zoom
          scrollwheel: true,
          gestureHandling: 'greedy' // Allow zoom without Ctrl key
        })

        mapInstance.current = map

        console.log('Map object created:', map)
        console.log('Map div:', map.getDiv())

        // Wait for map to be idle before proceeding
        window.google.maps.event.addListenerOnce(map, 'idle', () => {
          console.log('🗺️ Map is idle and ready')
          console.log('Map center:', map.getCenter()?.toString())
          console.log('Map zoom:', map.getZoom())
          console.log('Map type:', map.getMapTypeId())
          setIsLoading(false)
        })

        // Force map to resize and render properly
        setTimeout(() => {
          if (map) {
            window.google.maps.event.trigger(map, 'resize')
            map.setCenter(centerPoint)
            console.log('Map resized and centered to:', centerPoint)
            
            // Add a test marker to see if anything is visible
            const marker = new window.google.maps.Marker({
              position: centerPoint,
              map: map,
              title: 'Property Location',
              icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
              }
            })
            console.log('Test marker added at:', centerPoint)
          }
        }, 300)

        let polygon: any = null

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
        })

        drawingManager.setMap(map)
        drawingManagerInstance.current = drawingManager

        const calculateArea = (poly: any) => {
          const areaMeters = window.google.maps.geometry.spherical.computeArea(poly.getPath())
          const areaFeet = areaMeters * 10.7639
          setMeasuredArea(areaFeet)
          if (onAreaCalculated) {
            onAreaCalculated(areaFeet)
          }
        }

        window.google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event: any) {
          if (event.type === 'polygon') {
            if (polygon) polygon.setMap(null)
            polygon = event.overlay
            calculateArea(polygon)

            window.google.maps.event.addListener(polygon.getPath(), 'set_at', () => calculateArea(polygon))
            window.google.maps.event.addListener(polygon.getPath(), 'insert_at', () => calculateArea(polygon))
          }
        })

        console.log('✅ Map initialized successfully!')
      } catch (error) {
        console.error('❌ Error initializing map:', error)
        mapInitialized.current = false
        setIsLoading(false)
      }
    }

    // Delay initialization to ensure modal is fully rendered (handle animations)
    setTimeout(waitForGoogle, 1500)

    // Cleanup function
    return () => {
      // Re-enable body scroll
      document.body.style.overflow = 'unset'
      
      // Remove scroll prevention listener
      document.removeEventListener('wheel', preventScroll)
      
      if (window.google && mapInstance.current) {
        window.google.maps.event.clearInstanceListeners(window)
      }
    }
  }, [isOpen, latitude, longitude, onAreaCalculated])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-50 to-blue-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">📐 Property Area Measurement Tool</h2>
            <p className="text-sm text-gray-600">Draw a polygon on the satellite map to calculate the property area</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative" style={{ minHeight: '500px', position: 'relative', overflow: 'hidden' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          <div 
            id="measurement-map" 
            style={{ 
              width: '100%', 
              height: '100%', 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#e5e3df' // Fallback color to see if div is visible
            }}
          ></div>
          
          {measuredArea !== null && (
            <div className="absolute bottom-4 left-4 bg-white px-6 py-4 rounded-lg shadow-lg border-2 border-green-500">
              <p className="text-sm text-gray-600 mb-1">Calculated Area:</p>
              <p className="text-2xl font-bold text-green-600">
                {measuredArea.toLocaleString('en-US', { maximumFractionDigits: 0 })} sq ft
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ({(measuredArea / 43560).toFixed(3)} acres)
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-700">
            <strong className="text-green-600">📍 How to use:</strong> 
            <span className="ml-2">1) Click the polygon icon (⬡) at the top of the map</span>
            <span className="mx-2">•</span>
            <span>2) Click on the map to mark corners of the property</span>
            <span className="mx-2">•</span>
            <span>3) Double-click or click the first point to close the shape</span>
            <span className="mx-2">•</span>
            <span>4) Drag vertices to adjust if needed</span>
          </p>
        </div>
      </div>
    </div>
  )
}
