// Google Maps API Test - Get Business Data
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
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('              GEOCODING DATA');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(JSON.stringify(geocodeData.results[0], null, 2));
    console.log('\n');
    
    // Step 2: Find nearby places (to get business details)
    console.log('Step 2: Searching for nearby businesses...');
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=50&key=${GOOGLE_MAPS_API_KEY}`;
    
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();
    
    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      throw new Error(`Places search failed: ${placesData.status}`);
    }
    
    console.log(`✅ Found ${placesData.results.length} nearby businesses\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('              NEARBY PLACES DATA');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(JSON.stringify(placesData, null, 2));
    console.log('\n');
    
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
      
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,formatted_address,opening_hours,website,rating,user_ratings_total,business_status,types,price_level,reviews,photos,url&key=${GOOGLE_MAPS_API_KEY}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('              PLACE DETAILS (COMPLETE DATA)');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log(JSON.stringify(detailsData, null, 2));
      console.log('\n');
      
      // Summary of useful data
      if (detailsData.result) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('              EXTRACTED BUSINESS INFO');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        const result = detailsData.result;
        console.log(`📍 Business Name (DBA): ${result.name || 'N/A'}`);
        console.log(`📞 Phone Number: ${result.formatted_phone_number || 'N/A'}`);
        console.log(`🌐 Website: ${result.website || 'N/A'}`);
        console.log(`⭐ Rating: ${result.rating || 'N/A'} (${result.user_ratings_total || 0} reviews)`);
        console.log(`🏢 Business Status: ${result.business_status || 'N/A'}`);
        console.log(`💰 Price Level: ${result.price_level || 'N/A'}`);
        console.log(`🏷️  Types: ${result.types ? result.types.join(', ') : 'N/A'}`);
        
        if (result.opening_hours) {
          console.log(`\n⏰ Hours of Operation:`);
          if (result.opening_hours.weekday_text) {
            result.opening_hours.weekday_text.forEach(day => {
              console.log(`   ${day}`);
            });
          }
          console.log(`   Open Now: ${result.opening_hours.open_now ? 'Yes' : 'No'}`);
        }
        
        if (result.reviews && result.reviews.length > 0) {
          console.log(`\n📝 Recent Review Sample:`);
          console.log(`   "${result.reviews[0].text.substring(0, 100)}..."`);
        }
        
        // Generate Street View and Satellite imagery URLs for canopy identification
        console.log(`\n�️  CANOPY IDENTIFICATION IMAGES`);
        console.log(`═══════════════════════════════════════════════════════════\n`);
        
        // Street View URL - Shows front/side view of gas station with canopy
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${location.lat},${location.lng}&fov=90&heading=0&pitch=0&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`📷 Street View (Front View - Count Pumps):`);
        console.log(`   ${streetViewUrl}\n`);
        
        // Alternative Street View from different angle
        const streetViewUrl2 = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${location.lat},${location.lng}&fov=90&heading=180&pitch=0&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`📷 Street View (Rear View):`);
        console.log(`   ${streetViewUrl2}\n`);
        
        // Satellite View URL - Shows overhead view of canopy
        const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=20&size=800x600&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`🛰️  Satellite View (Overhead - See Canopy Size):`);
        console.log(`   ${satelliteUrl}\n`);
        
        // Hybrid View URL - Satellite with street labels
        const hybridUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=20&size=800x600&maptype=hybrid&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`🗺️  Hybrid View (Satellite + Labels):`);
        console.log(`   ${hybridUrl}\n`);
        
        console.log(`💡 TIP: Use these images to manually count MPDs:`);
        console.log(`   - Street View: Count visible fuel dispensers`);
        console.log(`   - Satellite View: Measure canopy area (canopy sqft ÷ 125 = estimated MPDs)`);
        console.log(`   - Show these images to the user for manual verification\n`);
        
        console.log(`\n🔗 Google Maps URL: ${result.url || 'N/A'}`);
      }
    }
    
    console.log('\n✅ Complete data fetch finished!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getGooglePlacesData();
