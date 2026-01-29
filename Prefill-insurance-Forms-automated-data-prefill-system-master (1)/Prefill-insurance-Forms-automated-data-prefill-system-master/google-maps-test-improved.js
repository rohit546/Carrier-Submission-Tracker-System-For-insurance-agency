// Google Maps API Test - Get Business Data with IMPROVED SATELLITE VIEWS
require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const address = '226 N Main St, Jonesboro, GA 30236, United States';

async function getGooglePlacesData() {
  try {
    console.log('🔍 Testing Address:', address);
    console.log('📡 Fetching data from Google Maps API...\n');
    
    // Step 1: Geocode the address to get coordinates
    console.log('Step 1: Geocoding address...');
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status !== 'OK') {
      throw new Error(`Geocoding failed: ${geocodeData.status}`);
    }
    
    const location = geocodeData.results[0].geometry.location;
    console.log(`✅ Coordinates: ${location.lat}, ${location.lng}\n`);
    
    // Step 2: Find nearby places (to get business details)
    console.log('Step 2: Searching for nearby businesses...');
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=50&key=${GOOGLE_MAPS_API_KEY}`;
    
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();
    
    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      throw new Error(`Places search failed: ${placesData.status}`);
    }
    
    console.log(`✅ Found ${placesData.results.length} nearby businesses\n`);
    
    // Step 3: Get detailed information for the gas station (not the city)
    if (placesData.results.length > 0) {
      // Find the gas station/convenience store, not the city
      const gasStation = placesData.results.find(place => 
        place.types.includes('gas_station') || 
        place.types.includes('convenience_store')
      );
      
      const placeId = gasStation ? gasStation.place_id : placesData.results[0].place_id;
      
      if (gasStation) {
        console.log(`✅ Found gas station: ${gasStation.name}`);
      }
      
      console.log('Step 3: Getting detailed place information...');
      console.log(`Place ID: ${placeId}\n`);
      
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,formatted_address,opening_hours,website,rating,user_ratings_total,business_status,types,price_level,reviews,url&key=${GOOGLE_MAPS_API_KEY}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      // Summary of useful data
      if (detailsData.result) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('              BUSINESS INFO');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        const result = detailsData.result;
        console.log(`📍 Business Name (DBA): ${result.name || 'N/A'}`);
        console.log(`📞 Phone Number: ${result.formatted_phone_number || 'N/A'}`);
        console.log(`🌐 Website: ${result.website || 'N/A'}`);
        console.log(`⭐ Rating: ${result.rating || 'N/A'} (${result.user_ratings_total || 0} reviews)`);
        console.log(`🏢 Business Status: ${result.business_status || 'N/A'}`);
        console.log(`🏷️  Types: ${result.types ? result.types.join(', ') : 'N/A'}`);
        
        if (result.opening_hours) {
          console.log(`\n⏰ Hours: ${result.opening_hours.weekday_text ? result.opening_hours.weekday_text[0] : 'N/A'}`);
          console.log(`   Open Now: ${result.opening_hours.open_now ? 'Yes' : 'No'}`);
        }
        
        // IMPROVED: Multiple satellite views at different zoom levels
        console.log(`\n🛰️  CANOPY IDENTIFICATION IMAGES`);
        console.log(`═══════════════════════════════════════════════════════════\n`);
        
        // BEST OPTION: High-res Satellite Views (Multiple Zoom Levels)
        console.log(`🎯 RECOMMENDED: SATELLITE VIEWS (Best for counting dispensers)\n`);
        
        const satelliteZoom21 = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=21&size=800x600&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`🛰️  Satellite Zoom 21 (HIGHEST DETAIL - Best view):`);
        console.log(`   ${satelliteZoom21}\n`);
        
        const satelliteZoom20 = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=20&size=800x600&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`🛰️  Satellite Zoom 20 (Medium detail):`);
        console.log(`   ${satelliteZoom20}\n`);
        
        const satelliteZoom19 = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=19&size=800x600&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`🛰️  Satellite Zoom 19 (Wider view - see full property):`);
        console.log(`   ${satelliteZoom19}\n`);
        
        // Hybrid with labels for context
        const hybridUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=21&size=800x600&maptype=hybrid&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`🗺️  Hybrid View (Satellite + Labels, Zoom 21):`);
        console.log(`   ${hybridUrl}\n`);
        
        // Street View (multiple angles) - Less reliable but can help
        console.log(`📷 BACKUP: Street View (May be unclear/wrong angle)\n`);
        
        const streetView0 = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${location.lat},${location.lng}&fov=90&heading=0&pitch=-10&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`   Angle 1 (North, looking down): ${streetView0}`);
        
        const streetView90 = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${location.lat},${location.lng}&fov=90&heading=90&pitch=-10&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`   Angle 2 (East, looking down): ${streetView90}`);
        
        const streetView180 = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${location.lat},${location.lng}&fov=90&heading=180&pitch=-10&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`   Angle 3 (South, looking down): ${streetView180}`);
        
        const streetView270 = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${location.lat},${location.lng}&fov=90&heading=270&pitch=-10&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`   Angle 4 (West, looking down): ${streetView270}\n`);
        
        console.log(`💡 HOW TO COUNT MPDs:`);
        console.log(`   ✅ USE SATELLITE ZOOM 21 FIRST - You can see individual dispensers from above`);
        console.log(`   ✅ Each dispenser island typically has 2-4 pump positions`);
        console.log(`   ✅ Count rectangular shapes under the canopy`);
        console.log(`   ⚠️  Street View is UNRELIABLE - use only if satellite unclear\n`);
        
        console.log(`\n🔗 Google Maps URL: ${result.url || 'N/A'}`);
      }
    }
    
    console.log('\n✅ Complete data fetch finished!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getGooglePlacesData();
