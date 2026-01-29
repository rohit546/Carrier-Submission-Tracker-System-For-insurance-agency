const fs = require('fs');
const https = require('https');

// Read the JSON file
const jsonData = fs.readFileSync('test-insured-information.json', 'utf8');

// Parse to validate it's valid JSON
const data = JSON.parse(jsonData);
console.log('✅ JSON file is valid');
console.log('📋 Sending data for:', data.corporation_name);

// Prepare the request
const options = {
  hostname: 'webhook.mightyinvestmentgroup.com',
  port: 443,
  path: '/application',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(jsonData),
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9'
  },
  timeout: 10000 // 10 second timeout
};

// Make the request
const req = https.request(options, (res) => {
  console.log(`\n📡 Response Status: ${res.statusCode}`);
  console.log(`📋 Response Headers:`, res.headers);

  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('\n✅ Response Body:');
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request Error:', error.message);
  if (error.code === 'ETIMEDOUT') {
    console.error('⏱️  Request timed out. The webhook endpoint may be down or unreachable.');
  }
});

req.on('timeout', () => {
  console.error('\n⏱️  Request timed out after 10 seconds');
  req.destroy();
});

// Send the data
req.write(jsonData);
req.end();

console.log('\n🚀 Sending POST request to webhook endpoint...\n');

