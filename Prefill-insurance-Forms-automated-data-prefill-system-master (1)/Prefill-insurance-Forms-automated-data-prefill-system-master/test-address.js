// Test script to fetch all Smarty API data for a specific address
const address = '280 Griffin St, McDonough, GA 30253-3100';

console.log('🔍 Testing address:', address);
console.log('📡 Fetching data from API...\n');

fetch(`http://localhost:3000/api/prefill?address=${encodeURIComponent(address)}`)
  .then(response => response.json())
  .then(data => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                  COMPLETE API RESPONSE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    DATA SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (data.success) {
      console.log('✅ Success: true');
      console.log('📊 Total attributes found:', Object.keys(data.data).length);
      console.log('📍 Address validated:', data.message);
      console.log('\n📋 All Available Fields:\n');
      
      Object.entries(data.data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          console.log(`  ${key}: ${value}`);
        }
      });
    } else {
      console.log('❌ Error:', data.message);
    }
  })
  .catch(err => {
    console.error('❌ Fetch Error:', err.message);
  });
