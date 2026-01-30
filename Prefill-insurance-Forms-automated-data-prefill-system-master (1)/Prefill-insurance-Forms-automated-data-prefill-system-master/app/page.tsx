'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { FormSection } from '@/components/FormSection'
import { FormData, Building, AdditionalInterest } from '@/types/form'
import { generatePDF } from '@/lib/pdf'
import { AreaMeasurementModal } from '@/components/AreaMeasurementModal'

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any
  }
}

export default function HomePage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submittedData, setSubmittedData] = useState<FormData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchMessage, setFetchMessage] = useState<string | null>(null)
  const [smartyData, setSmartyData] = useState<any>(null)
  const [showSidePanelData, setShowSidePanelData] = useState(false)
  const [searchAddress, setSearchAddress] = useState('')
  const [agentProfile, setAgentProfile] = useState<string>('')
  const [showAreaMeasurementTool, setShowAreaMeasurementTool] = useState(false)
  const [measuredArea, setMeasuredArea] = useState<number | null>(null)
  const [isSavingToGHL, setIsSavingToGHL] = useState(false)
  const [ghlMessage, setGhlMessage] = useState<string | null>(null)
  const [showResumePanel, setShowResumePanel] = useState(false)
  const [resumeForms, setResumeForms] = useState<any[]>([])
  const [isLoadingResumeForms, setIsLoadingResumeForms] = useState(false)
  const [selectedResumeForm, setSelectedResumeForm] = useState<string | null>(null)
  const [resumedOpportunityId, setResumedOpportunityId] = useState<string | null>(null)
  const [resumedContactId, setResumedContactId] = useState<string | null>(null)
  const [neonInsights, setNeonInsights] = useState<any>(null)
  const [ownershipInfo, setOwnershipInfo] = useState<any>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [publicAccessToken, setPublicAccessToken] = useState<string | null>(null)
  const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
  const [businessType, setBusinessType] = useState<'renewal' | 'newBusiness' | ''>('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [showBuildingModal, setShowBuildingModal] = useState(false)
  const [additionalInterests, setAdditionalInterests] = useState<AdditionalInterest[]>([])
  const [currentAdditionalInterest, setCurrentAdditionalInterest] = useState<AdditionalInterest>({
    id: '',
    type: '',
    name: '',
    address: ''
  })
  const [showLeadSourceDropdown, setShowLeadSourceDropdown] = useState(false)
  const leadSourceOptions = [
    'Tahir', 'Ahmed', 'Alex Fazwani', 'Ali Ajani', 'Aly Virani', 'Amber', 'Ana', 'ARA', 'Asad', 'Ayaz Ali',
    'Cinco', 'Inbound Call', 'Cold Lead', 'Cross sell', 'Customer Referral', 'David', 'Employers Nancy',
    'ENDORSEMENT', 'Existing Insured', 'Existing insured - new project', 'Expo', 'Hector', 'Internet',
    'John Sipple', 'Karim Virani', 'Ladaji', 'Lana', 'Munira', 'Myra', 'NATA', 'Nizar', 'Nur', 'Other',
    'Raabel', 'Rahim', 'Razia', 'Razia New Prospect', 'Razia winback', 'Reshop', 'Rewrite', 'Rozmin Ali',
    'Shahnaz', 'Shahzaib', 'Sherika', 'Sunil Dosi', 'Tanya', 'Teejay', 'Tej', 'VA Sales', 'Walk In',
    'Website', 'Win Back', 'Zara'
  ]
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
  })
  const router = useRouter()
  const addressInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Get agent profile from localStorage
    const profile = localStorage.getItem('agentProfile')
    if (profile) {
      setAgentProfile(profile)
      // Fetch resume forms when agent logs in
      fetchResumeForms()
    }
  }, [])


  // Handle adding a building
  const handleAddBuilding = () => {
    if (currentBuilding.address || currentBuilding.sqFootage || currentBuilding.construction || 
        currentBuilding.yearBuilt || currentBuilding.businessIncome || currentBuilding.businessPersonalProperty || 
        currentBuilding.sales || currentBuilding.description) {
      const newBuilding: Building = {
        ...currentBuilding,
        id: Date.now().toString()
      }
      setBuildings([...buildings, newBuilding])
      // Reset form
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
      })
      setShowBuildingModal(false)
    }
  }

  // Handle removing a building
  const handleRemoveBuilding = (id: string) => {
    setBuildings(buildings.filter(b => b.id !== id))
  }

  // Handle adding an additional interest
  const handleAddAdditionalInterest = () => {
    if (additionalInterests.length >= 3) {
      alert('Maximum of 3 additional interests allowed')
      return
    }
    if (currentAdditionalInterest.type && (currentAdditionalInterest.name || currentAdditionalInterest.address)) {
      const newInterest: AdditionalInterest = {
        ...currentAdditionalInterest,
        id: Date.now().toString()
      }
      setAdditionalInterests([...additionalInterests, newInterest])
      // Reset form
      setCurrentAdditionalInterest({
        id: '',
        type: '',
        name: '',
        address: ''
      })
    }
  }

  // Handle removing an additional interest
  const handleRemoveAdditionalInterest = (id: string) => {
    setAdditionalInterests(additionalInterests.filter(ai => ai.id !== id))
  }

  // Fetch all opportunities from unfilled stage
  const fetchResumeForms = async (forceRefresh: boolean = false) => {
    setIsLoadingResumeForms(true)
    try {
      // Add cache-busting query parameter and cache control headers when refreshing
      const url = forceRefresh 
        ? `/api/ghl/resume?t=${Date.now()}` 
        : '/api/ghl/resume'
      
      const response = await fetch(url, {
        cache: forceRefresh ? 'no-store' : 'default',
        headers: forceRefresh ? {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        } : {}
      })
      const result = await response.json()

      if (response.ok && result.success) {
        setResumeForms(result.forms || [])
        console.log(`✅ Loaded ${result.forms?.length || 0} incomplete forms`)
      } else {
        console.error('Failed to fetch resume forms:', result.error)
      }
    } catch (error: any) {
      console.error('Error fetching resume forms:', error)
    } finally {
      setIsLoadingResumeForms(false)
    }
  }

  // EXPERIMENTAL: Super simple Google Autocomplete - no fancy stuff
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.google?.maps?.places && addressInputRef.current) {
        try {
          const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'us' }
          })
          
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (place.formatted_address) {
              setSearchAddress(place.formatted_address)
            }
          })
          
          console.log('✅ Simple autocomplete ready')
        } catch (err) {
          console.log('Autocomplete failed:', err)
        }
      }
    }, 1000) // Wait 1 second for Google to load

    return () => clearTimeout(timer)
  }, [])

  // Initialize measurement map when modal opens
  useEffect(() => {
    if (showAreaMeasurementTool && window.google?.maps?.drawing) {
      setTimeout(() => {
        const map = new window.google.maps.Map(document.getElementById('measurement-map'), {
          zoom: 19,
          center: { 
            lat: smartyData?.data?.latitude || 33.580, 
            lng: smartyData?.data?.longitude || -84.386 
          },
          mapTypeId: 'satellite',
        })

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
            fillColor: '#FF0000',
            strokeColor: '#FF0000',
          },
        })

        drawingManager.setMap(map)

        function calculateArea(poly: any) {
          const areaMeters = window.google.maps.geometry.spherical.computeArea(poly.getPath())
          const areaFeet = areaMeters * 10.7639
          setMeasuredArea(areaFeet)
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
      }, 300)
    }
  }, [showAreaMeasurementTool, smartyData])
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<FormData>()

  // Auto-calculate pumps when MPDs changes (MPD cost = $20,000)
  const noOfMPDs = watch('noOfMPDs')
  useEffect(() => {
    if (noOfMPDs) {
      const mpds = parseFloat(noOfMPDs)
      if (!isNaN(mpds) && mpds > 0) {
        const pumpsValue = mpds * 20000
        setValue('pumps', pumpsValue.toString())
      }
    }
  }, [noOfMPDs, setValue])

  // Sync building address with main form address only when modal opens
  useEffect(() => {
    if (showBuildingModal) {
      const mainAddress = watch('address')
      setCurrentBuilding(prev => ({ ...prev, address: mainAddress || '' }))
    }
  }, [showBuildingModal]) // Only run when modal opens/closes, not on every address change


  const fetchData = async () => {
    if (!searchAddress || searchAddress.trim() === '') {
      setFetchMessage('Please enter an address first')
      setTimeout(() => setFetchMessage(null), 3000)
      return
    }

    setIsLoading(true)
    setFetchMessage(null)
    setSmartyData(null)
    setShowSidePanelData(false)
    setNeonInsights(null)
    setOwnershipInfo(null)

    try {
      console.log('🔍 Fetching data for address:', searchAddress)
      
      const response = await fetch('/api/prefill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: searchAddress }),
      })

      const result = await response.json()
      console.log('📊 API Response:', result)

      if (response.ok && result.success) {
        setSmartyData(result)
        setShowSidePanelData(true)
        setNeonInsights(result.neon || null)
        setOwnershipInfo(result.ownership || null)

        if (result.ownership?.status === 'owner') {
          setValue('ownershipType', 'Owner')
        } else if (result.ownership?.status === 'tenant') {
          setValue('ownershipType', 'Tenant')
        }
        
        // Check for validation warnings - don't show in temporary message, show in side panel
        if (result.validation && result.validation.warnings && result.validation.warnings.length > 0) {
          // Just show success message - warnings will be displayed in side panel permanently
          setFetchMessage(`✅ Found property data with ${Object.keys(result.data).length} attributes`)
        } else {
          setFetchMessage(`✅ Found property data with ${Object.keys(result.data).length} attributes`)
        }
      } else {
        setFetchMessage(`❌ ${result.message || 'Failed to fetch data'}`)
        setNeonInsights(null)
        setOwnershipInfo(null)
      }
    } catch (error: any) {
      console.error('❌ Fetch error:', error)
      setFetchMessage(`❌ Error: ${error.message}`)
      setNeonInsights(null)
      setOwnershipInfo(null)
    } finally {
      setIsLoading(false)
      setTimeout(() => setFetchMessage(null), 5000)
    }
  }

  const ownershipStatus = ownershipInfo?.status || 'unknown'
  const ownershipBadgeStyles = ownershipStatus === 'owner'
    ? 'bg-green-100 text-green-800 border border-green-200'
    : ownershipStatus === 'tenant'
      ? 'bg-orange-100 text-orange-800 border border-orange-200'
      : 'bg-gray-100 text-gray-700 border border-gray-200'

  const ownershipLabel = ownershipStatus === 'owner'
    ? 'Insured appears to be the property owner'
    : ownershipStatus === 'tenant'
      ? 'Insured appears to be a tenant'
      : 'Ownership status could not be verified'

  const ownershipReason = ownershipStatus === 'owner'
    ? `Neon business name matches property record (${ownershipInfo?.matchedName || ownershipInfo?.neonBusinessName || 'N/A'})`
    : ownershipStatus === 'tenant'
      ? `Neon business name differs from recorded property owner (${ownershipInfo?.matchedName || 'Property owner unknown'})`
      : 'No matching names were found between data sources.'

  const fillFieldsFromSmarty = () => {
    if (!smartyData?.data) return
    
    console.log('🔄 Intelligently filling form fields with Smarty + Google Maps data')
    let filledCount = 0
    
    // === INTELLIGENT FIELD MAPPING ===
    
    // 1. Corporation Name (from owner data)
    if (smartyData.data.corporationName || smartyData.data.ownerFullName || smartyData.data.deedOwnerFullName) {
      const corpName = smartyData.data.corporationName || smartyData.data.ownerFullName || smartyData.data.deedOwnerFullName
      setValue('corporationName', corpName)
      filledCount++
      console.log('✅ Filled: Corporation Name')
    }
    
    // 2. Address (from matched address)
    if (smartyData.data.address) {
      setValue('address', smartyData.data.address)
      filledCount++
      console.log('✅ Filled: Address')
    }
    
    // 3. Operation Description (from Google Maps business types or land use)
    if (smartyData.data.operationDescription) {
      // Use the smart-formatted operation description from backend
      setValue('operationDescription', smartyData.data.operationDescription)
      filledCount++
      console.log('✅ Filled: Operation Description')
    } else if (smartyData.data.businessTypes || smartyData.data.landUseStandard) {
      const opDesc = smartyData.data.businessTypes || 
                     (smartyData.data.landUseStandard ? smartyData.data.landUseStandard.replace(/_/g, ' ').toUpperCase() : '')
      setValue('operationDescription', opDesc)
      filledCount++
      console.log('✅ Filled: Operation Description')
    }
    
    // 4. DBA (from Google Maps business name or legal description)
    if (smartyData.data.dba || smartyData.data.businessName || smartyData.data.legalDescription) {
      setValue('dba', smartyData.data.dba || smartyData.data.businessName || smartyData.data.legalDescription)
      filledCount++
      console.log('✅ Filled: DBA')
    }

    // 4b. Contact Number (from Google Maps)
    if (smartyData.data.contactNumber || smartyData.data.phoneNumber) {
      setValue('contactNumber', smartyData.data.contactNumber || smartyData.data.phoneNumber)
      filledCount++
      console.log('✅ Filled: Contact Number')
    }

    // 4c. Hours of Operation (from Google Maps - simplified to just the number)
    if (smartyData.data.hoursOfOperation) {
      setValue('hoursOfOperation', smartyData.data.hoursOfOperation)
      filledCount++
      console.log('✅ Filled: Hours of Operation')
    }
    
    // 5. Year Built
    if (smartyData.data.yearBuilt) {
      setValue('yearBuilt', smartyData.data.yearBuilt)
      filledCount++
      console.log('✅ Filled: Year Built')
    }
    
    // 6. Construction Type
    if (smartyData.data.constructionType || smartyData.data.construction_type || smartyData.data.exteriorWalls) {
      const constructionType = smartyData.data.constructionType || 
                               smartyData.data.construction_type || 
                               smartyData.data.exteriorWalls
      setValue('constructionType', String(constructionType).replace(/_/g, ' ').toUpperCase())
      filledCount++
      console.log('✅ Filled: Construction Type')
    }
    
    // 7. Total Square Footage
    if (smartyData.data.totalSqFootage || smartyData.data.buildingSqft || smartyData.data.building_sqft) {
      const sqft = smartyData.data.totalSqFootage || smartyData.data.buildingSqft || smartyData.data.building_sqft
      setValue('totalSqFootage', String(sqft))
      filledCount++
      console.log('✅ Filled: Total Sq. Footage')
    }
    
    // 8. Applicant Type (derive from ownership type)
    if (smartyData.data.applicantType) {
      setValue('applicantType', smartyData.data.applicantType)
      filledCount++
      console.log('✅ Filled: Applicant Type')
    } else if (smartyData.data.ownershipType) {
      // Map ownership type to applicant type
      const ownershipMap: Record<string, string> = {
        'company': 'corporation',
        'corporate': 'corporation',
        'llc': 'llc',
        'individual': 'individual',
        'partnership': 'partnership'
      }
      const mapped = ownershipMap[smartyData.data.ownershipType.toLowerCase()] || 'other'
      setValue('applicantType', mapped)
      filledCount++
      console.log('✅ Filled: Applicant Type (derived)')
    }
    
    // 9. Building Coverage (from assessed value)
    if (smartyData.data.assessedValue || smartyData.data.assessed_improvement_value) {
      const buildingValue = smartyData.data.assessedValue || smartyData.data.assessed_improvement_value
      setValue('building', String(buildingValue))
      filledCount++
      console.log('✅ Filled: Building Coverage')
    }
    
    // 10. Canopy Coverage (from canopy sqft)
    if (smartyData.data.canopy || smartyData.data.canopySqft) {
      if (smartyData.data.canopySqft) {
        const canopyValue = parseInt(smartyData.data.canopySqft) * 200 // $200 per sqft estimate
        setValue('canopy', String(canopyValue))
        filledCount++
        console.log('✅ Filled: Canopy Coverage (calculated)')
      }
    }
    
    // 12. Number of Buildings (info - could show in anyLeasedOutSpace if > 1)
    if (smartyData.data.numberOfBuildings && parseInt(smartyData.data.numberOfBuildings) > 1) {
      setValue('anyLeasedOutSpace', `${smartyData.data.numberOfBuildings} buildings on property`)
      filledCount++
      console.log('✅ Filled: Leased Space Info (multiple buildings)')
    }
    
    // 13. Burglar Alarm (from security_alarm)
    if (smartyData.data.security_alarm) {
      const hasAlarm = String(smartyData.data.security_alarm).toLowerCase().includes('yes') || 
                       String(smartyData.data.security_alarm).toLowerCase().includes('true')
      if (hasAlarm) {
        setValue('burglarAlarm.centralStation', true)
        filledCount++
        console.log('✅ Filled: Burglar Alarm - Central Station')
      }
    }
    
    // 14. Fire Alarm (from fire_sprinklers_flag or sprinklers)
    if (smartyData.data.fire_sprinklers_flag || smartyData.data.sprinklers) {
      const hasSprinklers = String(smartyData.data.fire_sprinklers_flag || smartyData.data.sprinklers)
                           .toLowerCase().includes('yes') || 
                           String(smartyData.data.fire_sprinklers_flag || smartyData.data.sprinklers)
                           .toLowerCase().includes('true')
      if (hasSprinklers) {
        setValue('fireAlarm.centralStation', true)
        filledCount++
        console.log('✅ Filled: Fire Alarm - Central Station (has sprinklers)')
      }
    }
    
    // 15. Protection Class (from fire_resistance_code)
    if (smartyData.data.fire_resistance_code) {
      setValue('protectionClass', smartyData.data.fire_resistance_code)
      filledCount++
      console.log('✅ Filled: Protection Class')
    }

    // 16. Additional Insured (removed - now using dropdown section)
    
    // === DIRECT MAPPINGS (if exact field names exist) ===
    const directMappings: Array<keyof FormData> = [
      'yearOfLatestUpdate',
      'hoursOfOperation',
      'noOfMPDs',
      'yearsInBusiness',
      'yearsAtLocation',
      'fein',
      'protectionClass',
      'noOfEmployees',
      'payroll',
      'officersInclExcl',
      'ownership'
    ]
    
    directMappings.forEach(fieldName => {
      if (smartyData.data[fieldName] && smartyData.data[fieldName] !== '') {
        setValue(fieldName, smartyData.data[fieldName])
        filledCount++
        console.log(`✅ Filled: ${fieldName}`)
      }
    })
    
    console.log(`🎉 Successfully filled ${filledCount} form fields!`)
    setFetchMessage(`✅ Intelligently auto-filled ${filledCount} form fields from property data!`)
    setTimeout(() => setFetchMessage(null), 5000)
  }

  // Handle form submission - show modal first
  const handleFormSubmit = (data: FormData) => {
    const dataWithBuildings = {
      ...data,
      buildings
    }
    setPendingFormData(dataWithBuildings)
    setShowBusinessTypeModal(true)
  }

  // Process submission after modal confirmation
  const processSubmission = async () => {
    if (!pendingFormData || !businessType) {
      alert('Please select business type (Renewal or New Business)')
      return
    }

    const dataWithBusinessType = {
      ...pendingFormData,
      businessType,
      businessDescription,
      buildings,
      additionalInterests
    }

    console.log('Form submitted with data:', dataWithBusinessType)
    console.log('🌐 WEBHOOK DEBUG: businessType =', businessType)
    setSubmittedData(dataWithBusinessType)
    setShowBusinessTypeModal(false)
    
    // Also save to GHL when submitting (only for new business)
    setIsSavingToGHL(true)
    setGhlMessage(null)
    
    try {
      // Get agent name from localStorage
      const agentName = typeof window !== 'undefined' ? localStorage.getItem('agentProfile') : null
      
      // Only save to GoHighLevel if it's NEW BUSINESS (skip for renewal to avoid duplicates)
      let ghlResult = null
      let ghlResponse = null
      let ghlOpportunityId: string | null = null
      
      if (businessType === 'newBusiness') {
        console.log('🌐 WEBHOOK DEBUG: Entering newBusiness block')
        console.log('📤 Saving to GoHighLevel and Coversheet on form submission...')
        
        ghlResponse = await fetch('/api/ghl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...dataWithBusinessType,
            _resumedOpportunityId: resumedOpportunityId,
            _resumedContactId: resumedContactId,
            _agentName: agentName || null
          }),
        })

        ghlResult = await ghlResponse.json()
        
        // Capture opportunity ID from GHL response
        if (ghlResult?.opportunityId) {
          ghlOpportunityId = ghlResult.opportunityId
          console.log('✅ GoHighLevel Opportunity ID captured:', ghlOpportunityId)
        } else if (resumedOpportunityId) {
          // If updating existing opportunity, use the resumed ID
          ghlOpportunityId = resumedOpportunityId
          console.log('✅ Using resumed GoHighLevel Opportunity ID:', ghlOpportunityId)
        }
      } else {
        console.log('🔄 Renewal detected - skipping GoHighLevel to avoid duplicate entry')
      }

      // Save to Coversheet database (for both renewal and new business)
      let coversheetResult = null
      try {
        const coversheetResponse = await fetch('/api/coversheet/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...dataWithBusinessType,
            _agentName: agentName || null,
            ghlOpportunityId: ghlOpportunityId // Pass the opportunity ID to Coversheet
          }),
        })
        coversheetResult = await coversheetResponse.json()
        
        if (coversheetResponse.ok && coversheetResult.success) {
          setSubmissionId(coversheetResult.submissionId)
          setPublicAccessToken(coversheetResult.publicAccessToken)
          console.log('✅ Saved to Coversheet:', {
            submissionId: coversheetResult.submissionId,
            publicAccessToken: coversheetResult.publicAccessToken
          })
        }
      } catch (coversheetError: any) {
        console.error('Error saving to Coversheet:', coversheetError)
        // Don't fail the whole submission if Coversheet save fails
      }

      // Send to webhook endpoint (only for new business) - This runs regardless of Coversheet success/failure
      console.log('═══════════════════════════════════════════════════════')
      console.log('🌐 WEBHOOK: Starting webhook process...')
      console.log('🌐 WEBHOOK DEBUG: About to check businessType for webhook. Current value:', businessType)
      console.log('🌐 WEBHOOK DEBUG: businessType type:', typeof businessType)
      
      let webhookSuccess = false
      let webhookError = null
      
      if (businessType === 'newBusiness') {
        console.log('🌐 WEBHOOK DEBUG: businessType is newBusiness, proceeding with webhook call')
        try {
          console.log('🌐 WEBHOOK: Starting webhook submission...')
          console.log('🌐 WEBHOOK: Business Type:', businessType)
          console.log('📤 Sending data to webhook endpoint...')
          
          const webhookResponse = await fetch('/api/webhook/application', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...dataWithBusinessType,
              _submissionId: coversheetResult?.submissionId || null // Pass submissionId for dashboard_link
            }),
          })

          console.log('🌐 WEBHOOK: Response status:', webhookResponse.status)
          const webhookResult = await webhookResponse.json()
          console.log('🌐 WEBHOOK: Response data:', webhookResult)
          
          // Check if webhook was successful (202 Accepted or 200 OK are both success)
          if (webhookResponse.ok || webhookResponse.status === 202) {
            webhookSuccess = true
            console.log('✅ Data sent to webhook (Ezylynx) successfully:', webhookResult.webhookResponse)
          } else {
            webhookSuccess = false
            webhookError = webhookResult.error || webhookResult.message || `HTTP ${webhookResponse.status}`
            console.warn('⚠️ Webhook submission failed:', webhookError)
          }
        } catch (webhookErr: any) {
          webhookSuccess = false
          webhookError = webhookErr.message || 'Network error'
          console.error('❌ Error sending to webhook:', webhookErr)
          console.error('❌ Webhook error details:', webhookErr.message, webhookErr.stack)
        }
      } else {
        console.log('🌐 WEBHOOK: Skipped (Business Type:', businessType, '- not newBusiness)')
      }

      if (businessType === 'newBusiness') {
        // Build message with all status information
        let messageParts = []
        
        if (ghlResponse && ghlResponse.ok && ghlResult?.success) {
          messageParts.push(`✅ GoHighLevel: Success (Contact ID: ${ghlResult.contactId || 'N/A'})`)
        } else {
          messageParts.push(`⚠️ GoHighLevel: Failed (${ghlResult?.error || 'Unknown error'})`)
        }
        
        if (coversheetResult?.success) {
          messageParts.push(`✅ Coversheet: Success`)
        } else {
          messageParts.push(`⚠️ Coversheet: Failed (${coversheetResult?.error || 'Unknown error'})`)
        }
        
        // Add Ezylynx webhook status
        if (webhookSuccess) {
          messageParts.push(`✅ Ezylynx: Successfully sent`)
        } else {
          messageParts.push(`❌ Ezylynx: Failed (${webhookError || 'Unknown error'})`)
        }
        
        const message = messageParts.join(' | ')
        setGhlMessage(message)
    setIsSubmitted(true)
    setShowSuccess(true)
      } else {
        // Renewal - only saved to Coversheet (no webhook for renewal)
        const message = coversheetResult?.success
          ? `✅ Renewal saved to Coversheet! (Skipped GoHighLevel and Ezylynx to avoid duplicate entry)`
          : `⚠️ Renewal submitted, but Coversheet save failed: ${coversheetResult?.error || 'Unknown error'}`
        setGhlMessage(message)
        setIsSubmitted(true)
        setShowSuccess(true)
      }
    } catch (error: any) {
      console.error('Error saving:', error)
      setGhlMessage(`⚠️ Form submitted, but error occurred: ${error.message || 'Unknown error'}`)
      setIsSubmitted(true)
      setShowSuccess(true)
    } finally {
      setIsSavingToGHL(false)
      setPendingFormData(null)
      setBusinessType('')
      setBusinessDescription('')
    setTimeout(() => {
      setShowSuccess(false)
        setGhlMessage(null)
      }, 5000)
    }
  }

  // Original onSubmit for backward compatibility (now calls handleFormSubmit)
  const onSubmit = handleFormSubmit

  const saveToGHL = async () => {
    // Get current form values
    const formData = watch()
    
    // Validate required fields for full submission
    if (!formData.corporationName || !formData.contactName || !formData.contactEmail || !formData.contactNumber || !formData.leadSource) {
      setGhlMessage('❌ Please fill in all required fields: Corporation Name, Contact Name, Contact Email, Contact Number, and Lead Source')
      setTimeout(() => setGhlMessage(null), 5000)
      return
    }

    setIsSavingToGHL(true)
    setGhlMessage(null)

    try {
      console.log('📤 Saving to GoHighLevel...', {
        corporationName: formData.corporationName,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactNumber: formData.contactNumber
      })

      // Get agent name from localStorage
      const agentName = typeof window !== 'undefined' ? localStorage.getItem('agentProfile') : null
      
      const response = await fetch('/api/ghl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _resumedOpportunityId: resumedOpportunityId,
          _resumedContactId: resumedContactId,
          _agentName: agentName || null
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setGhlMessage(`✅ Successfully saved to GoHighLevel! Contact ID: ${result.contactId || 'N/A'}. Complete JSON saved in note.`)
        setTimeout(() => setGhlMessage(null), 5000)
      } else {
        setGhlMessage(`❌ Failed to save: ${result.error || 'Unknown error'}`)
        setTimeout(() => setGhlMessage(null), 5000)
      }
    } catch (error: any) {
      console.error('Error saving to GHL:', error)
      setGhlMessage(`❌ Error: ${error.message || 'Failed to save to GoHighLevel'}`)
      setTimeout(() => setGhlMessage(null), 5000)
    } finally {
      setIsSavingToGHL(false)
    }
  }

  const downloadPDF = () => {
    if (submittedData) {
      console.log('Downloading PDF with data:', submittedData)
      const pdf = generatePDF(submittedData)
      pdf.save('convenience-store-application.pdf')
    }
  }

  const resetForm = () => {
    reset()
    setIsSubmitted(false)
    setSubmittedData(null)
    setShowSuccess(false)
    setShowSidePanelData(false)
    setSmartyData(null)
    setGhlMessage(null)
    setIsSavingToGHL(false)
    setResumedOpportunityId(null)
    setResumedContactId(null)
    setSelectedResumeForm(null)
    setNeonInsights(null)
    setOwnershipInfo(null)
    setSubmissionId(null)
    setPublicAccessToken(null)
  }

  const handleStartQuote = () => {
    if (submissionId) {
      // Use production URL for deployment
      const coversheetUrl = `https://carrier-submission-tracker-system-for-insurance-production.up.railway.app/agent/submission/${submissionId}`
      window.location.href = coversheetUrl
    } else {
      alert('Submission data not available. Please submit the form again.')
    }
  }

  // Resume a form from GHL
  const handleResumeForm = (form: any) => {
    if (!form.formData) return

    // Set resumed opportunity and contact IDs
    setResumedOpportunityId(form.opportunityId)
    setResumedContactId(form.contactId)
    setSelectedResumeForm(form.opportunityId)

    // Map form data back to form fields
    const formData = form.formData

    // Personal Info
    if (formData.personalInfo) {
      if (formData.personalInfo.contactName) setValue('contactName', formData.personalInfo.contactName)
      if (formData.personalInfo.contactEmail) setValue('contactEmail', formData.personalInfo.contactEmail)
      if (formData.personalInfo.contactNumber) setValue('contactNumber', formData.personalInfo.contactNumber)
      if (formData.personalInfo.corporationName) setValue('corporationName', formData.personalInfo.corporationName)
      if (formData.personalInfo.leadSource) setValue('leadSource', formData.personalInfo.leadSource)
    }

    // Company Info
    if (formData.companyInfo) {
      if (formData.companyInfo.address) setValue('address', formData.companyInfo.address)
      if (formData.companyInfo.dba) setValue('dba', formData.companyInfo.dba)
      if (formData.companyInfo.applicantType) setValue('applicantType', formData.companyInfo.applicantType)
      if (formData.companyInfo.yearsInBusiness) setValue('yearsInBusiness', formData.companyInfo.yearsInBusiness)
      if (formData.companyInfo.ownershipType) setValue('ownershipType', formData.companyInfo.ownershipType)
      if (formData.companyInfo.operationDescription) setValue('operationDescription', formData.companyInfo.operationDescription)
    }

    // Property Details
    if (formData.propertyDetails) {
      if (formData.propertyDetails.hoursOfOperation) setValue('hoursOfOperation', formData.propertyDetails.hoursOfOperation)
      if (formData.propertyDetails.numberOfMPDs) setValue('noOfMPDs', formData.propertyDetails.numberOfMPDs)
      if (formData.propertyDetails.constructionType) setValue('constructionType', formData.propertyDetails.constructionType)
      if (formData.propertyDetails.totalSqFootage) setValue('totalSqFootage', formData.propertyDetails.totalSqFootage)
      if (formData.propertyDetails.yearBuilt) setValue('yearBuilt', formData.propertyDetails.yearBuilt)
      if (formData.propertyDetails.yearsInCurrentLocation) setValue('yearsAtLocation', formData.propertyDetails.yearsInCurrentLocation)
      if (formData.propertyDetails.leasedSpace) setValue('anyLeasedOutSpace', formData.propertyDetails.leasedSpace)
      if (formData.propertyDetails.protectionClass) setValue('protectionClass', formData.propertyDetails.protectionClass)
      // Additional Insured now uses dropdown section (additionalInsuredType, additionalInsuredName, additionalInsuredAddress)
      if (formData.propertyDetails.burglarAlarm) {
        const burglarAlarm = formData.propertyDetails.burglarAlarm
        if (burglarAlarm === 'Central Station' || burglarAlarm === 'Both') {
          setValue('burglarAlarm', { centralStation: true, local: burglarAlarm === 'Both' })
        } else if (burglarAlarm === 'Local') {
          setValue('burglarAlarm', { centralStation: false, local: true })
        } else {
          setValue('burglarAlarm', { centralStation: false, local: false })
        }
      }
      if (formData.propertyDetails.fireAlarm) {
        const fireAlarm = formData.propertyDetails.fireAlarm
        if (fireAlarm === 'Central Station' || fireAlarm === 'Both') {
          setValue('fireAlarm', { centralStation: true, local: fireAlarm === 'Both' })
        } else if (fireAlarm === 'Local') {
          setValue('fireAlarm', { centralStation: false, local: true })
        } else {
          setValue('fireAlarm', { centralStation: false, local: false })
        }
      }
    }

    // Sales Data
    if (formData.salesData) {
      if (formData.salesData.inside?.monthly) setValue('insideSalesMonthly', formData.salesData.inside.monthly)
      if (formData.salesData.inside?.yearly) setValue('insideSalesYearly', formData.salesData.inside.yearly)
      if (formData.salesData.liquor?.monthly) setValue('liquorSalesMonthly', formData.salesData.liquor.monthly)
      if (formData.salesData.liquor?.yearly) setValue('liquorSalesYearly', formData.salesData.liquor.yearly)
      if (formData.salesData.gasoline?.monthly) setValue('gasolineSalesMonthly', formData.salesData.gasoline.monthly)
      if (formData.salesData.gasoline?.yearly) setValue('gasolineSalesYearly', formData.salesData.gasoline.yearly)
      if (formData.salesData.propane?.monthly) setValue('propaneSalesMonthly', formData.salesData.propane.monthly)
      if (formData.salesData.propane?.yearly) setValue('propaneSalesYearly', formData.salesData.propane.yearly)
      if (formData.salesData.carwash?.monthly) setValue('carwashMonthly', formData.salesData.carwash.monthly)
      if (formData.salesData.carwash?.yearly) setValue('carwashYearly', formData.salesData.carwash.yearly)
      if (formData.salesData.cooking?.monthly) setValue('cookingMonthly', formData.salesData.cooking.monthly)
      if (formData.salesData.cooking?.yearly) setValue('cookingYearly', formData.salesData.cooking.yearly)
    }

    // Coverage
    if (formData.coverage) {
      if (formData.coverage.building) setValue('building', formData.coverage.building)
      if (formData.coverage.bpp) setValue('bpp', formData.coverage.bpp)
      if (formData.coverage.bi) setValue('bi', formData.coverage.bi)
      if (formData.coverage.canopy) setValue('canopy', formData.coverage.canopy)
      if (formData.coverage.pumps) setValue('pumps', formData.coverage.pumps)
      if (formData.coverage.signsLighting) setValue('ms', formData.coverage.signsLighting)
    }

    // Business Details
    if (formData.businessDetails) {
      if (formData.businessDetails.fein) setValue('fein', formData.businessDetails.fein)
      if (formData.businessDetails.numberOfEmployees) setValue('noOfEmployees', formData.businessDetails.numberOfEmployees)
      if (formData.businessDetails.annualPayroll) setValue('payroll', formData.businessDetails.annualPayroll)
      if (formData.businessDetails.officers) setValue('officersInclExcl', formData.businessDetails.officers)
      if (formData.businessDetails.ownershipPercentage) setValue('ownership', formData.businessDetails.ownershipPercentage)
    }

    // Close panel after loading
    setShowResumePanel(false)
    setGhlMessage(`✅ Form resumed: ${form.contactName} - ${form.corporationName}`)
    setTimeout(() => setGhlMessage(null), 5000)
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, fieldName: keyof FormData) => {
    e.preventDefault()
    
    // Try to get data from the global variable (more reliable than dataTransfer)
    const draggedData = (window as any).draggedSmartyData
    
    if (draggedData && draggedData.value) {
      setValue(fieldName, draggedData.value as any)
      setFetchMessage(`✅ Filled "${fieldName}" with: ${draggedData.value}`)
      setTimeout(() => setFetchMessage(null), 3000)
    } else {
      // Fallback to dataTransfer
      const data = e.dataTransfer.getData('text/plain')
      if (data) {
        setValue(fieldName, data as any)
        setFetchMessage(`✅ Filled "${fieldName}" with: ${data}`)
        setTimeout(() => setFetchMessage(null), 3000)
      }
    }
  }

  // Drag and drop form field component
  const DragDropFormField = ({ 
    name, 
    label, 
    placeholder, 
    type = 'text', 
    multiline = false,
    required = false 
  }: {
    name: keyof FormData
    label: string
    placeholder?: string
    type?: string
    multiline?: boolean
    required?: boolean
  }) => {
    const [isDragOver, setIsDragOver] = useState(false)
    
    const fieldProps = {
      ...register(name, required ? { required: `${label} is required` } : {}),
      className: `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        isDragOver ? 'border-blue-500 bg-blue-50' : ''
      }`,
      placeholder: placeholder || '',
      onDragOver: (e: React.DragEvent) => {
        handleDragOver(e)
        setIsDragOver(true)
      },
      onDragLeave: () => setIsDragOver(false),
      onDrop: (e: React.DragEvent) => {
        handleDrop(e, name)
        setIsDragOver(false)
      }
    }

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {isDragOver && (
            <span className="ml-2 text-blue-600 text-xs animate-pulse">Drop here!</span>
          )}
        </label>
        {multiline ? (
          <textarea rows={3} {...fieldProps} />
        ) : (
          <input type={type} {...fieldProps} />
        )}
        {errors[name] && (
          <p className="text-red-600 text-sm mt-1">{(errors[name] as any)?.message}</p>
        )}
      </div>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('agentProfile')
    localStorage.removeItem('agentLoginTime')
    router.push('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Business Type Modal */}
      {showBusinessTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Business Type Selection
            </h2>
            <p className="text-gray-600 mb-6">
              Please select whether this is a renewal or new business application.
            </p>

            {/* Radio Buttons */}
            <div className="space-y-4 mb-6">
              <label className="flex items-center space-x-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="radio"
                  name="businessType"
                  value="renewal"
                  checked={businessType === 'renewal'}
                  onChange={(e) => setBusinessType(e.target.value as 'renewal' | 'newBusiness')}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-700">Renewal</span>
                  <p className="text-sm text-gray-500">Data will NOT be sent to GoHighLevel to avoid duplicate entry</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="radio"
                  name="businessType"
                  value="newBusiness"
                  checked={businessType === 'newBusiness'}
                  onChange={(e) => setBusinessType(e.target.value as 'renewal' | 'newBusiness')}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-700">New Business</span>
                  <p className="text-sm text-gray-500">Data will be sent to GoHighLevel and Coversheet</p>
                </div>
              </label>
            </div>

            {/* Description Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Enter any additional notes or description..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBusinessTypeModal(false)
                  setPendingFormData(null)
                  setBusinessType('')
                  setBusinessDescription('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processSubmission}
                disabled={!businessType || isSavingToGHL}
                className={`px-6 py-2 rounded-lg text-white transition-colors ${
                  businessType && !isSavingToGHL
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSavingToGHL ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Building Modal */}
      {showBuildingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Add a Building
            </h2>
            <p className="text-gray-600 mb-6">
              Add building information (all fields are optional)
            </p>

            <div className="space-y-4">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={currentBuilding.address}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Address (mapped from main form)"
                />
              </div>

              {/* Square Footage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Square Footage
                </label>
                <input
                  type="text"
                  value={currentBuilding.sqFootage}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, sqFootage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Square footage"
                />
              </div>

              {/* Construction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Construction
                </label>
                <input
                  type="text"
                  value={currentBuilding.construction}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, construction: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Construction type"
                />
              </div>

              {/* Year Built */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Built
                </label>
                <input
                  type="text"
                  value={currentBuilding.yearBuilt}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, yearBuilt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Year built"
                />
              </div>

              {/* Business Income */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Income
                </label>
                <input
                  type="text"
                  value={currentBuilding.businessIncome}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, businessIncome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Business income"
                />
              </div>

              {/* Business Personal Property */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Personal Property
                </label>
                <input
                  type="text"
                  value={currentBuilding.businessPersonalProperty}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, businessPersonalProperty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Business personal property"
                />
              </div>

              {/* Sales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales
                </label>
                <input
                  type="text"
                  value={currentBuilding.sales}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, sales: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Sales"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={currentBuilding.description}
                  onChange={(e) => setCurrentBuilding({ ...currentBuilding, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description"
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBuildingModal(false)
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
                  })
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBuilding}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add Building
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Header - Minimal Black Bar */}
      <div className="bg-black text-white py-3 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="font-light tracking-wide">{agentProfile}</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setShowResumePanel(!showResumePanel)
              if (!showResumePanel) {
                fetchResumeForms()
              }
            }}
            className="text-white hover:text-gray-300 transition-colors font-light text-sm tracking-wide flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Resume Forms ({resumeForms.length})</span>
          </button>
        <button
          onClick={handleLogout}
          className="text-white hover:text-gray-300 transition-colors font-light text-sm tracking-wide"
        >
          Logout
        </button>
        </div>
      </div>

      {/* Resume Panel - Left Side Overlay */}
      {showResumePanel && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowResumePanel(false)}
          ></div>
          
          {/* Panel */}
          <div className="relative w-96 bg-white shadow-2xl overflow-y-auto">
            {/* Panel Header */}
            <div className="sticky top-0 bg-black text-white py-4 px-6 flex justify-between items-center z-10">
              <h2 className="text-lg font-semibold">Resume Forms</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fetchResumeForms(true)}
                  disabled={isLoadingResumeForms}
                  className="text-white hover:text-gray-300 transition-colors disabled:opacity-50"
                  title="Refresh forms"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowResumePanel(false)}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="p-4">
              {isLoadingResumeForms ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading forms...</p>
                </div>
              ) : resumeForms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No forms found</p>
                  <button
                    onClick={() => fetchResumeForms(true)}
                    disabled={isLoadingResumeForms}
                    className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isLoadingResumeForms ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {resumeForms.map((form) => (
                    <div
                      key={form.opportunityId}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedResumeForm === form.opportunityId
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedResumeForm === form.opportunityId}
                          onChange={() => setSelectedResumeForm(
                            selectedResumeForm === form.opportunityId ? null : form.opportunityId
                          )}
                          className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {form.corporationName}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {form.contactName}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(form.dateSaved).toLocaleDateString()}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              form.completionPercent >= 80
                                ? 'bg-green-100 text-green-800'
                                : form.completionPercent >= 50
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {form.completionPercent}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Continue Button */}
                  {selectedResumeForm && (
                    <button
                      onClick={() => {
                        const selectedForm = resumeForms.find(f => f.opportunityId === selectedResumeForm)
                        if (selectedForm) {
                          handleResumeForm(selectedForm)
                        }
                      }}
                      className="w-full mt-4 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                    >
                      Continue with Selected Form
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto h-full">
          {/* Header matching PDF */}
          <div className="text-center mb-8 relative">
            <a href="https://deployment-delta-eight.vercel.app/" className="absolute left-0 top-0 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back to Dashboard</span>
            </a>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Mckinney & Co. Insurance</h1>
            <h2 className="text-xl font-semibold text-gray-600">Convenience Store Application - Agent Form</h2>
            <p className="text-sm text-gray-500 mt-1">Only for Agents</p>
          </div>
        
        {/* Test the side panel structure */}
        <div className="flex gap-8 relative min-h-[calc(100vh-200px)]">
          <div className={`transition-all duration-300 ${showSidePanelData ? 'w-1/2' : 'w-full'} overflow-y-auto`}>
            <div className="bg-white p-6 rounded-lg shadow">
              
              {!isSubmitted ? (
                <>
                  <h2 className="text-2xl font-semibold mb-6">Convenience Store Insurance Application</h2>
                  
                  {/* Address Search Section */}
                  <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">🏢 Property Address Lookup</h3>
                    <div className="flex gap-4">
                      <input
                        ref={addressInputRef}
                        id="address-autocomplete"
                        type="text"
                        autoComplete="off"
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                        placeholder="Start typing address... (e.g., 4964 Lavista Rd)"
                        onChange={(e) => setSearchAddress(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault() // Prevent form submission
                            const address = addressInputRef.current?.value || ''
                            if (address.trim()) {
                              setSearchAddress(address)
                              fetchData()
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          // Get value directly from input
                          const address = addressInputRef.current?.value || ''
                          if (address.trim()) {
                            setSearchAddress(address)
                            fetchData()
                          }
                        }}
                        disabled={isLoading}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 font-medium"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span>Fetch Data</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Fetch Status Message */}
                    {fetchMessage && (
                      <div className={`mt-4 p-3 rounded-md text-sm ${
                        fetchMessage.includes('✅') 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {fetchMessage}
                      </div>
                    )}

                    {neonInsights && (
                      <div className="mt-6 space-y-4">
                        <div className={`p-4 rounded-lg ${ownershipBadgeStyles}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs uppercase font-semibold tracking-wide">Ownership Insight</p>
                              <p className="mt-1 text-base font-semibold">{ownershipLabel}</p>
                              <p className="mt-2 text-sm opacity-80">{ownershipReason}</p>
                            </div>
                            <div className="text-xs font-medium opacity-70">Powered by Neon & GSOS</div>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {neonInsights.license && (
                            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-800">Tobacco License</h4>
                                <span className="text-xs text-gray-500">{neonInsights.license.tbl_license_type || 'N/A'}</span>
                              </div>
                              <dl className="space-y-2 text-sm text-gray-700">
                                <div className="flex justify-between">
                                  <dt className="font-medium">Business</dt>
                                  <dd className="text-right ml-4 max-w-[60%]">{neonInsights.license.list_format_name || 'N/A'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">License ID</dt>
                                  <dd className="text-right ml-4">{neonInsights.license.license_id || 'N/A'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">Address</dt>
                                  <dd className="text-right ml-4 max-w-[60%]">{neonInsights.license.list_format_address || 'N/A'}</dd>
                                </div>
                              </dl>
                            </div>
                          )}

                          {neonInsights.business && (
                            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-800">GSOS Business Details</h4>
                                <span className="text-xs text-gray-500">{neonInsights.business.business_status || 'Status Unknown'}</span>
                              </div>
                              <dl className="space-y-2 text-sm text-gray-700">
                                <div className="flex justify-between">
                                  <dt className="font-medium">Business Name</dt>
                                  <dd className="text-right ml-4 max-w-[60%]">{neonInsights.business.business_name || 'N/A'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">NAICS Code</dt>
                                  <dd className="text-right ml-4">{neonInsights.business.naics_code || 'N/A'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">NAICS Subcode</dt>
                                  <dd className="text-right ml-4">{neonInsights.business.naics_sub_code || 'N/A'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">Years at Location</dt>
                                  <dd className="text-right ml-4">{neonInsights.business.yearsAtLocation ?? 'N/A'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">Agent</dt>
                                  <dd className="text-right ml-4 max-w-[60%]">{neonInsights.business.registered_agent_name || 'N/A'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">Agent Address</dt>
                                  <dd className="text-right ml-4 max-w-[60%]">{neonInsights.business.registered_agent_physical_address || 'N/A'}</dd>
                                </div>
                              </dl>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ownership Type Selection */}
                  <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">👤 Ownership Type</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <label className="flex items-center space-x-3 p-3 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                        <input
                          type="radio"
                          {...register('ownershipType')}
                          value="Owner"
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="font-medium text-gray-700">Owner</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 p-3 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                        <input
                          type="radio"
                          {...register('ownershipType')}
                          value="Tenant"
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="font-medium text-gray-700">Tenant</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 p-3 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                        <input
                          type="radio"
                          {...register('ownershipType')}
                          value="Lessor's Risk"
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="font-medium text-gray-700">Lessor's Risk</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 p-3 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                        <input
                          type="radio"
                          {...register('ownershipType')}
                          value="Triple Net Lease"
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="font-medium text-gray-700">Triple Net Lease</span>
                      </label>
                    </div>
                  </div>

                  {/* Data Validation Warning - Only show for FAILED validation */}
                  {showSidePanelData && smartyData?.validation && !smartyData.validation.isValid && smartyData.validation.warnings && smartyData.validation.warnings.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-red-800 font-bold text-lg">⚠️ DATA VERIFICATION REQUIRED</span>
                      </div>
                      <div className="ml-8 space-y-1">
                        {smartyData.validation.warnings.map((warning: string, idx: number) => (
                          <p key={idx} className="text-red-700 font-medium">{warning}</p>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-white border border-red-200 rounded">
                        <p className="text-red-900 font-semibold text-sm">
                          🔍 AGENT ACTION REQUIRED: The automated data sources may have outdated or incorrect information. 
                          Please manually verify all fields below, especially:
                        </p>
                        <ul className="mt-2 ml-4 text-red-800 text-sm list-disc space-y-1">
                          <li>Business name and type (is this actually a convenience store/gas station?)</li>
                          <li>Current owner and contact information</li>
                          <li>Hours of operation and business status</li>
                          <li>Property usage and occupancy</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Informational Messages - Only show for VALID properties with info */}
                  {showSidePanelData && smartyData?.validation?.isValid && smartyData.validation.info && smartyData.validation.info.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-blue-800 font-semibold">ℹ️ Information</span>
                      </div>
                      <div className="ml-7 space-y-1">
                        {smartyData.validation.info.map((info: string, idx: number) => (
                          <p key={idx} className="text-blue-700 text-sm">{info}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drag and Drop Instructions */}
                  {showSidePanelData && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-yellow-800 font-medium">Drag & Drop Enabled!</span>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        Drag any field from the side panel and drop it onto the form fields below to auto-fill them.
                      </p>
                    </div>
                  )}

                  {/* Comprehensive Insurance Application Form - Compact Layout */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    
                    {/* Row 1: Corporation Name + Contact Name + Contact Number */}
                    <div className="grid grid-cols-3 gap-3">
                      <DragDropFormField 
                        name="corporationName" 
                        label="Corporation Name" 
                        placeholder="Enter corporation name"
                        required
                      />
                      <DragDropFormField 
                        name="contactName" 
                        label="Contact Name" 
                        placeholder="Enter contact name"
                        required
                      />
                      <DragDropFormField 
                        name="contactNumber" 
                        label="Contact Number" 
                        placeholder="Enter contact number"
                        required
                      />
                    </div>

                    {/* Row 2: Contact Email + Lead Source + Proposed Date + Prior Carrier + Target Premium */}
                    <div className="grid grid-cols-5 gap-3">
                      <DragDropFormField 
                        name="contactEmail" 
                        label="Contact Email" 
                        placeholder="Enter email address"
                        type="email"
                        required
                      />
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lead Source <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('leadSource', { required: 'Lead Source is required' })}
                          type="text"
                          value={watch('leadSource') || ''}
                          onChange={(e) => {
                            setValue('leadSource', e.target.value)
                            setShowLeadSourceDropdown(true)
                          }}
                          onFocus={() => {
                            setShowLeadSourceDropdown(true)
                          }}
                          onBlur={() => {
                            // Delay hiding dropdown to allow click selection
                            setTimeout(() => setShowLeadSourceDropdown(false), 200)
                          }}
                          placeholder="Type to search lead source..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {showLeadSourceDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {leadSourceOptions
                              .filter(option => 
                                option.toLowerCase().includes((watch('leadSource') || '').toLowerCase())
                              )
                              .map((option, index) => (
                                <div
                                  key={index}
                                  onMouseDown={(e) => {
                                    e.preventDefault() // Prevent onBlur from firing before click
                                    setValue('leadSource', option)
                                    setShowLeadSourceDropdown(false)
                                  }}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  {option}
                                </div>
                              ))}
                            {leadSourceOptions.filter(option => 
                              option.toLowerCase().includes((watch('leadSource') || '').toLowerCase())
                            ).length === 0 && (
                              <div className="px-3 py-2 text-gray-500 text-sm">No matches found</div>
                            )}
                          </div>
                        )}
                        {errors.leadSource && (
                          <p className="mt-1 text-sm text-red-600">{errors.leadSource.message as string}</p>
                        )}
                      </div>
                      <DragDropFormField 
                        name="proposedEffectiveDate" 
                        label="Proposed Effective Date" 
                        type="date"
                      />
                      <DragDropFormField 
                        name="priorCarrier" 
                        label="Prior Carrier" 
                        placeholder="Enter prior carrier"
                      />
                      <DragDropFormField 
                        name="targetPremium" 
                        label="Target Premium" 
                        placeholder="Enter target premium"
                      />
                    </div>

                    {/* Row 3: Applicant Type (Inline Radio Buttons) */}
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Applicant is
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: 'individual', label: 'Individual' },
                          { value: 'partnership', label: 'Partnership' },
                          { value: 'corporation', label: 'Corporation' },
                          { value: 'jointVenture', label: 'Joint Venture' },
                          { value: 'llc', label: 'LLC' },
                          { value: 'other', label: 'other' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="radio"
                              {...register('applicantType', { required: 'Please select applicant type' })}
                              value={option.value}
                              className="mr-1"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      {errors.applicantType && (
                        <p className="text-red-600 text-xs mt-1">{errors.applicantType.message}</p>
                      )}
                    </div>

                    {/* Row 4: Operation Description + DBA */}
                    <div className="grid grid-cols-2 gap-3">
                      <DragDropFormField 
                        name="operationDescription" 
                        label="Operation Description:" 
                        placeholder="Describe your business operations..."
                        multiline
                      />
                      <div className="space-y-3">
                        <DragDropFormField 
                          name="dba" 
                          label="DBA" 
                          placeholder="Enter DBA (Doing Business As)"
                        />
                        <DragDropFormField 
                          name="address" 
                          label="Address" 
                          placeholder="Enter property address"
                        />
                        <DragDropFormField 
                          name="mailingAddress" 
                          label="Mailing Address" 
                          placeholder="Enter mailing address"
                        />
                      </div>
                    </div>

                    {/* Row 6: Hours + MPDs + Construction Type + Years in Business */}
                    <div className="grid grid-cols-4 gap-3">
                      <DragDropFormField 
                        name="hoursOfOperation" 
                        label="Hours of operation" 
                        placeholder="Enter hours"
                      />
                      <DragDropFormField 
                        name="noOfMPDs" 
                        label="No. Of MPDs" 
                        placeholder="Enter number"
                      />
                      <DragDropFormField 
                        name="constructionType" 
                        label="Construction type :" 
                        placeholder="Enter type"
                      />
                      <DragDropFormField 
                        name="yearsInBusiness" 
                        label="Years Exp. in business" 
                        placeholder="Enter years"
                      />
                    </div>

                    {/* Row 7: Years at Location + Year Built + Year Update + Total Sq Footage + Leased Space */}
                    <div className="grid grid-cols-5 gap-3">
                      <DragDropFormField 
                        name="yearsAtLocation" 
                        label="Years at this Location" 
                        placeholder="Enter years"
                      />
                      <DragDropFormField 
                        name="yearBuilt" 
                        label="Year built" 
                        placeholder="Year"
                      />
                      <DragDropFormField 
                        name="yearOfLatestUpdate" 
                        label="Year of latest update" 
                        placeholder="Year"
                      />
                      <DragDropFormField 
                        name="totalSqFootage" 
                        label="Total sq. Footage" 
                        placeholder="Sq ft"
                      />
                      <DragDropFormField 
                        name="anyLeasedOutSpace" 
                        label="Any leased out space :" 
                        placeholder="Yes/No"
                      />
                    </div>

                    {/* Row 8: Protection Class */}
                    <div className="grid grid-cols-1 gap-3">
                      <DragDropFormField 
                        name="protectionClass" 
                        label="Protection Class:" 
                        placeholder="Enter protection class"
                      />
                    </div>

                    {/* Additional Interests Section */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Additional Interests (Max 3)</h3>
                        {additionalInterests.length < 3 && (
                          <button
                            type="button"
                            onClick={handleAddAdditionalInterest}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Additional Interest
                          </button>
                        )}
                      </div>

                      {/* List of Added Additional Interests */}
                      {additionalInterests.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {additionalInterests.map((interest, index) => (
                            <div key={interest.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-start">
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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Form to Add New Additional Interest */}
                      {additionalInterests.length < 3 && (
                        <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-300">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Type
                            </label>
                            <select
                              value={currentAdditionalInterest.type}
                              onChange={(e) => setCurrentAdditionalInterest({ ...currentAdditionalInterest, type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select type</option>
                              <option value="Additional Insured">Additional Insured</option>
                              <option value="Loss Payee">Loss Payee</option>
                              <option value="Lenders">Lenders</option>
                              <option value="Mortgagee">Mortgagee</option>
                            </select>
                          </div>

                          {currentAdditionalInterest.type && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={currentAdditionalInterest.name}
                                  onChange={(e) => setCurrentAdditionalInterest({ ...currentAdditionalInterest, name: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder={`Enter ${currentAdditionalInterest.type} name`}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Address
                                </label>
                                <input
                                  type="text"
                                  value={currentAdditionalInterest.address}
                                  onChange={(e) => setCurrentAdditionalInterest({ ...currentAdditionalInterest, address: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder={`Enter ${currentAdditionalInterest.type} address`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {additionalInterests.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No additional interests added yet. Click "Add Additional Interest" to get started.</p>
                      )}
                    </div>

                    {/* Row 9: Alarm (Compact Inline) */}
                    <div className="border border-gray-300 p-2 rounded">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium text-gray-700">Alarm:</span>
                        <span className="text-gray-700">Burglar</span>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('burglarAlarm.centralStation')}
                            className="mr-1"
                          />
                          <span>Central Station</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('burglarAlarm.local')}
                            className="mr-1"
                          />
                          <span>Local</span>
                        </label>
                        <span className="text-gray-700 ml-4">Fire</span>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('fireAlarm.centralStation')}
                            className="mr-1"
                          />
                          <span>Central Station</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('fireAlarm.local')}
                            className="mr-1"
                          />
                          <span>Local</span>
                        </label>
                      </div>
                    </div>

                    {/* 10. Combined Table: Property Section + General Liability + Worker's Compensation (Compact) */}
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        {/* Table Headers */}
                        <thead>
                          <tr className="bg-gray-100">
                            <th colSpan={2} className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-800 text-xs">
                              Property Section
                            </th>
                            <th colSpan={3} className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-800 text-xs">
                              GENERAL LIABILITY (Exposure)
                            </th>
                            <th className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-800 text-xs">
                              Worker's Compensation
                            </th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs">Coverage</th>
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs">Limits</th>
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs"></th>
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs">Monthly</th>
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs">Yearly</th>
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs"></th>
                          </tr>
                        </thead>
                        <tbody className="text-xs">
                          {/* Row 1: Building / Inside Sales Total / FEIN */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Building</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('building')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'building')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Inside Sales Total</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('insideSalesMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'insideSalesMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('insideSalesYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'insideSalesYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('fein')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'fein')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="FEIN"
                              />
                            </td>
                          </tr>

                          {/* Row 2: BPP / Liquor Sales / No. of Employees */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">BPP</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('bpp')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'bpp')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Liquor Sales</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('liquorSalesMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'liquorSalesMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('liquorSalesYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'liquorSalesYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('noOfEmployees')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'noOfEmployees')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="No. of Employees"
                              />
                            </td>
                          </tr>

                          {/* Row 3: B I / Gasoline Sales / Payroll */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">B I</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('bi')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'bi')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">gasoline gallons</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('gasSalesMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'gasSalesMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('gasSalesYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'gasSalesYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('payroll')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'payroll')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="Payroll"
                              />
                            </td>
                          </tr>

                          {/* Row 4: Canopy / Propane filling/Exchange / Incl/Excl officers */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Canopy</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('canopy')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'canopy')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Propane filling/Exchange</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('propaneSalesMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'propaneSalesMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('propaneSalesYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'propaneSalesYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('officersInclExcl')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'officersInclExcl')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="Incl/Excl"
                              />
                            </td>
                          </tr>

                          {/* Row 5: Pumps / Carwash / % Ownership */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Pumps</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('pumps')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'pumps')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Carwash</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('carwashMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'carwashMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('carwashYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'carwashYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('ownership')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'ownership')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="% Ownership"
                              />
                            </td>
                          </tr>

                          {/* Row 6: M&S / Cooking / Empty */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">M&S</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('ms')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'ms')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Cooking</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('cookingMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'cookingMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('cookingYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'cookingYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1 bg-gray-50">
                              {/* Empty cell */}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* GHL Save Message */}
                    {ghlMessage && (
                      <div className={`mt-4 p-3 rounded-md text-sm ${
                        ghlMessage.includes('✅') 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {ghlMessage}
                      </div>
                    )}

                    {/* Buildings Section */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Buildings</h3>
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
                            })
                            setShowBuildingModal(true)
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add a Building
                        </button>
                      </div>
                      
                      {buildings.length > 0 && (
                        <div className="space-y-3">
                          {buildings.map((building, index) => (
                            <div key={building.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-start">
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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {buildings.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No buildings added yet. Click "Add a Building" to get started.</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-between items-center pt-6">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Reset Form
                      </button>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={saveToGHL}
                          disabled={isSavingToGHL}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                          {isSavingToGHL ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                              </svg>
                              <span>Save in GHL</span>
                            </>
                          )}
                      </button>
                      <button
                        type="submit"
                          disabled={isSavingToGHL}
                          className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                          {isSavingToGHL ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Saving to GHL...</span>
                            </>
                          ) : (
                            <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Submit Application</span>
                            </>
                          )}
                      </button>
                      </div>
                    </div>
                  </form>
                </>
              ) : (
                /* Success State */
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Application Submitted Successfully!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Thank you for submitting your convenience store application. Our team will review it and get back to you soon.
                  </p>
                  
                  {/* GHL Save Status */}
                  {ghlMessage && (
                    <div className={`mb-6 p-3 rounded-md text-sm max-w-md mx-auto ${
                      ghlMessage.includes('✅') 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : ghlMessage.includes('⚠️')
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {ghlMessage}
                    </div>
                  )}
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={downloadPDF}
                      className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Download Filled PDF
                    </button>
                    {submissionId && (
                      <button
                        onClick={handleStartQuote}
                        className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Start Quote
                      </button>
                    )}
                    <button
                      onClick={resetForm}
                      className="bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Start New Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Unified Comprehensive Data Panel */}
          {showSidePanelData && smartyData && (
            <div className="w-1/2 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto max-h-screen">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Complete Property Data</h2>
                  <button
                    onClick={() => setShowSidePanelData(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* All Data in One Organized View */}
                <div className="space-y-4">
                  
                  {/* Validation Warnings Alert - Only show when validation fails or has warnings */}
                  {smartyData.validation && !smartyData.validation.isValid && smartyData.validation.warnings && smartyData.validation.warnings.length > 0 && (
                    <div className="p-4 rounded-lg border-2 bg-red-50 border-red-400">
                      <div className="flex items-start">
                        <div className="text-2xl mr-3 text-red-600">🚫</div>
                        <div className="flex-1">
                          <h3 className="font-bold mb-2 text-red-800">
                            Property Validation Failed
                          </h3>
                          <ul className="space-y-1">
                            {smartyData.validation.warnings.map((warning: string, index: number) => (
                              <li key={index} className="text-sm flex items-start text-red-700">
                                <span className="mr-2">•</span>
                                <span className="flex-1">{warning}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {/* Property Metrics */}
                          <div className="mt-3 pt-3 border-t border-red-300">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                <span className="font-semibold text-gray-700">Building Sq Ft:</span>
                                <span className={`ml-1 ${smartyData.data.buildingSqft && parseInt(smartyData.data.buildingSqft) <= 10 ? 'text-red-700 font-bold' : 'text-gray-900'}`}>
                                  {smartyData.data.buildingSqft || 'N/A'}
                                </span>
                              </div>
                              <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                <span className="font-semibold text-gray-700">Land Use:</span>
                                <span className={`ml-1 ${smartyData.data.landUseStandard?.toLowerCase().includes('vacant') ? 'text-red-700 font-bold' : 'text-gray-900'}`}>
                                  {smartyData.data.landUseStandard ? smartyData.data.landUseStandard.replace(/_/g, ' ').toUpperCase() : 'N/A'}
                                </span>
                              </div>
                              <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                <span className="font-semibold text-gray-700">Property Type:</span>
                                <span className="ml-1 text-gray-900">{smartyData.validation.propertyType.replace('_', ' ').toUpperCase()}</span>
                              </div>
                              <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                <span className="font-semibold text-gray-700">Confidence:</span>
                                <span className={`ml-1 font-semibold ${
                                  smartyData.validation.confidence === 'high' ? 'text-green-700' :
                                  smartyData.validation.confidence === 'medium' ? 'text-yellow-700' :
                                  'text-red-700'
                                }`}>
                                  {smartyData.validation.confidence.toUpperCase()}
                                </span>
                              </div>
                              {smartyData.data.yearBuilt && (
                                <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                  <span className="font-semibold text-gray-700">Year Built:</span>
                                  <span className="ml-1 text-gray-900">{smartyData.data.yearBuilt}</span>
                                </div>
                              )}
                              {smartyData.data.assessedValue && (
                                <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                  <span className="font-semibold text-gray-700">Assessed Value:</span>
                                  <span className="ml-1 text-gray-900">${parseInt(smartyData.data.assessedValue).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Helper function to render draggable field */}
                  {(() => {
                    const DraggableField = ({ label, value, bgColor = 'bg-blue-100' }: { label: string, value: any, bgColor?: string }) => {
                      if (!value || value === '') return null;
                      return (
                        <div className="flex justify-between items-start gap-2 py-1">
                          <span className="font-medium text-gray-600 text-xs">{label}:</span>
                          <span 
                            className={`text-gray-800 cursor-move hover:${bgColor} px-2 py-1 rounded text-xs font-mono flex-1 text-right`}
                            draggable
                            title={`Drag to fill: ${value}`}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', String(value));
                              (window as any).draggedSmartyData = { label, value: String(value) };
                            }}
                          >
                            {String(value)}
                          </span>
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* 1. ADDRESS INFORMATION */}
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <h3 className="text-sm font-bold text-blue-900 mb-2">📍 ADDRESS INFORMATION</h3>
                          <div className="space-y-1">
                            {smartyData.data.matchedAddress && (
                              <>
                                <DraggableField 
                                  label="Street" 
                                  value={smartyData.data.matchedAddress.street} 
                                  bgColor="bg-blue-200"
                                />
                                <DraggableField 
                                  label="City" 
                                  value={smartyData.data.matchedAddress.city} 
                                  bgColor="bg-blue-200"
                                />
                                <DraggableField 
                                  label="State" 
                                  value={smartyData.data.matchedAddress.state} 
                                  bgColor="bg-blue-200"
                                />
                                <DraggableField 
                                  label="ZIP Code" 
                                  value={smartyData.data.matchedAddress.zipcode} 
                                  bgColor="bg-blue-200"
                                />
                              </>
                            )}
                            <DraggableField 
                              label="Full Address" 
                              value={smartyData.data.address} 
                              bgColor="bg-blue-200"
                            />
                          </div>
                        </div>

                        {/* 2. MAILING ADDRESS */}
                        {smartyData.data.fullMailingAddress && (
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <h3 className="text-sm font-bold text-purple-900 mb-2">📬 MAILING ADDRESS</h3>
                            <div className="space-y-1">
                              <DraggableField 
                                label="Full Mailing Address" 
                                value={smartyData.data.fullMailingAddress} 
                                bgColor="bg-purple-200"
                              />
                              {smartyData.data.mailingAddress && (
                                <>
                                  <DraggableField 
                                    label="Mailing City" 
                                    value={smartyData.data.mailingAddress.city} 
                                    bgColor="bg-purple-200"
                                  />
                                  <DraggableField 
                                    label="Mailing State" 
                                    value={smartyData.data.mailingAddress.state} 
                                    bgColor="bg-purple-200"
                                  />
                                  <DraggableField 
                                    label="Mailing ZIP" 
                                    value={smartyData.data.mailingAddress.zipcode} 
                                    bgColor="bg-purple-200"
                                  />
                                  <DraggableField 
                                    label="Mailing County" 
                                    value={smartyData.data.mailingAddress.county} 
                                    bgColor="bg-purple-200"
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 3. OWNER & DEED INFORMATION */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <h3 className="text-sm font-bold text-green-900 mb-2">👤 OWNER & DEED INFORMATION</h3>
                          <div className="space-y-1">
                            <DraggableField 
                              label="Deed Owner Full Name" 
                              value={smartyData.data.deedOwnerFullName} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Deed Owner Last Name" 
                              value={smartyData.data.deedOwnerLastName} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Owner Full Name" 
                              value={smartyData.data.ownerFullName} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Corporation Name" 
                              value={smartyData.data.corporationName} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Owner Occupancy Status" 
                              value={smartyData.data.ownerOccupancyStatus} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Ownership Type" 
                              value={smartyData.data.ownershipType} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Company Flag" 
                              value={smartyData.data.companyFlag} 
                              bgColor="bg-green-200"
                            />
                          </div>
                        </div>

                        {/* 3b. MORTGAGE & LENDER INFORMATION */}
                        {(smartyData.data.lenderName || smartyData.data.mortgageAmount) && (
                          <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                            <h3 className="text-sm font-bold text-teal-900 mb-2">💰 MORTGAGE & LENDER INFORMATION</h3>
                            <div className="space-y-1">
                              <DraggableField 
                                label="Lender Name" 
                                value={smartyData.data.lenderName} 
                                bgColor="bg-teal-200"
                              />
                              <DraggableField 
                                label="Mortgage Amount" 
                                value={smartyData.data.mortgageAmount ? `$${parseInt(smartyData.data.mortgageAmount).toLocaleString()}` : ''} 
                                bgColor="bg-teal-200"
                              />
                              <DraggableField 
                                label="Mortgage Due Date" 
                                value={smartyData.data.mortgageDueDate} 
                                bgColor="bg-teal-200"
                              />
                              <DraggableField 
                                label="Mortgage Recording Date" 
                                value={smartyData.data.mortgageRecordingDate} 
                                bgColor="bg-teal-200"
                              />
                              <DraggableField 
                                label="Mortgage Term" 
                                value={smartyData.data.mortgageTerm ? `${smartyData.data.mortgageTerm} ${smartyData.data.mortgageTermType || 'months'}` : ''} 
                                bgColor="bg-teal-200"
                              />
                              <DraggableField 
                                label="Mortgage Type" 
                                value={smartyData.data.mortgageType} 
                                bgColor="bg-teal-200"
                              />
                              {smartyData.data.additionalInsured && (
                                <div className="mt-2 pt-2 border-t border-teal-300">
                                  <DraggableField 
                                    label="Additional Insured (Auto-Generated)" 
                                    value={smartyData.data.additionalInsured} 
                                    bgColor="bg-teal-300"
                                  />
                                  <p className="text-xs text-teal-700 mt-1 italic">
                                    ↑ Drag this to "Additional Insured" field in the form
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 4. BUILDING & PROPERTY DETAILS */}
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <h3 className="text-sm font-bold text-orange-900 mb-2">🏢 BUILDING & PROPERTY DETAILS</h3>
                          <div className="space-y-1">
                            <DraggableField 
                              label="Building Sq Ft" 
                              value={smartyData.data.buildingSqft} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Assessed Value" 
                              value={smartyData.data.assessedValue} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Year Built" 
                              value={smartyData.data.yearBuilt} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Stories Number" 
                              value={smartyData.data.storiesNumber} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Number of Buildings" 
                              value={smartyData.data.numberOfBuildings} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Elevation (Feet)" 
                              value={smartyData.data.elevationFeet} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Exterior Walls" 
                              value={smartyData.data.exteriorWalls} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Flooring" 
                              value={smartyData.data.flooring} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Construction Type" 
                              value={smartyData.data.construction_type} 
                              bgColor="bg-orange-200"
                            />
                          </div>
                        </div>

                        {/* 5. CANOPY INFORMATION (for gas stations/c-stores) */}
                        {(smartyData.data.canopy || smartyData.data.canopySqft) && (
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <h3 className="text-sm font-bold text-yellow-900 mb-2">⛽ CANOPY INFORMATION</h3>
                            <div className="space-y-1">
                              <DraggableField 
                                label="Canopy Status" 
                                value={smartyData.data.canopy} 
                                bgColor="bg-yellow-200"
                              />
                              <DraggableField 
                                label="Canopy Sq Ft" 
                                value={smartyData.data.canopySqft} 
                                bgColor="bg-yellow-200"
                              />
                            </div>
                          </div>
                        )}

                        {/* 6. LAND USE & LEGAL */}
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                          <h3 className="text-sm font-bold text-indigo-900 mb-2">📜 LAND USE & LEGAL</h3>
                          <div className="space-y-1">
                            <DraggableField 
                              label="Land Use Group" 
                              value={smartyData.data.landUseGroup} 
                              bgColor="bg-indigo-200"
                            />
                            <DraggableField 
                              label="Land Use Standard" 
                              value={smartyData.data.landUseStandard} 
                              bgColor="bg-indigo-200"
                            />
                            <DraggableField 
                              label="Legal Description" 
                              value={smartyData.data.legalDescription} 
                              bgColor="bg-indigo-200"
                            />
                          </div>
                        </div>

                        {/* 7. ALL OTHER DYNAMIC ATTRIBUTES */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                          <h3 className="text-sm font-bold text-gray-900 mb-2">📋 ALL OTHER ATTRIBUTES ({Object.keys(smartyData.data).filter(k => {
                            const v = smartyData.data[k];
                            return v !== null && v !== undefined && v !== '' && typeof v !== 'object';
                          }).length})</h3>
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {Object.entries(smartyData.data)
                              .filter(([key, value]) => 
                                value !== null && 
                                value !== undefined && 
                                value !== '' && 
                                typeof value !== 'object'
                              )
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([key, value]) => (
                                <DraggableField 
                                  key={key}
                                  label={key.replace(/([A-Z_])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                                  value={value}
                                  bgColor="bg-gray-200"
                                />
                              ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Fill All Button */}
                  <button
                    onClick={fillFieldsFromSmarty}
                    className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                  >
                    Fill All Available Form Fields ({Object.keys(smartyData.data).length} attributes)
                  </button>
                </div>

                {/* 3D Interactive Street View Map */}
                {smartyData.data.mapEmbedUrl && (
                  <div className="mt-6 p-4 bg-blue-50 border-t border-blue-200">
                    <div className="mb-3 flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">🗺️ Interactive 3D Street View</h3>
                        <p className="text-sm text-blue-700">
                          Drag to look around 360°, click arrows to move, zoom in/out to explore. Use this to count fuel dispensers (MPDs).
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAreaMeasurementTool(true)}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        📐 Measure Area
                      </button>
                    </div>
                    
                    <div className="rounded-lg overflow-hidden border-2 border-blue-400 shadow-lg">
                      <iframe
                        width="100%"
                        height="450"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={smartyData.data.mapEmbedUrl}
                      />
                    </div>

                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="font-semibold text-green-800 mb-2 text-sm">🎯 How to Count MPDs:</h4>
                      <ul className="text-xs text-green-700 space-y-1">
                        <li>• <strong>Ignore</strong> the tall pylon sign (pricing billboard)</li>
                        <li>• <strong>Find the canopy</strong> (horizontal roof over pumps)</li>
                        <li>• <strong>Count rectangular islands</strong> under the canopy</li>
                        <li>• Each island = 1 MPD (Motor Fuel Pump Dispenser)</li>
                        <li>• <strong>Drag</strong> to rotate view, <strong>click arrows</strong> to move around</li>
                      </ul>
                    </div>

                    {/* MPD Counter - Easy Selection */}
                    <div className="mt-4 bg-white border-2 border-blue-300 rounded-lg p-4 shadow-md">
                      <label className="block text-sm font-bold text-gray-800 mb-2">
                        🔢 Number of MPDs
                      </label>
                      <select
                        value={watch('noOfMPDs') || ''}
                        onChange={(e) => setValue('noOfMPDs', e.target.value)}
                        className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <option value="">Select number of MPDs...</option>
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num} className="text-lg">
                            {num} MPD{num > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Count the fuel pump islands visible in the Street View above
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Area Measurement Tool Modal */}
      <AreaMeasurementModal
        isOpen={showAreaMeasurementTool}
        onClose={() => setShowAreaMeasurementTool(false)}
        latitude={smartyData?.data?.latitude || smartyData?.latitude || 33.8551043}
        longitude={smartyData?.data?.longitude || smartyData?.longitude || -84.2179044}
        onAreaCalculated={(area) => {
          setMeasuredArea(area)
          console.log('Measured area:', area, 'sq ft')
        }}
      />

      </div>
    </div>
  )
}