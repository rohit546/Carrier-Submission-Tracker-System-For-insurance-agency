// Direct Smarty API Test - Get Full JSON Data
require('dotenv').config();

const SMARTY_AUTH_ID = process.env.SMARTY_AUTH_ID;
const SMARTY_AUTH_TOKEN = process.env.SMARTY_AUTH_TOKEN;
const BASE_URL = "https://us-enrichment.api.smarty.com";

const address = '280 Griffin Street, McDonough, GA 30253';

async function getFullSmartyData() {
  try {
    console.log('🔍 Testing Address:', address);
    console.log('📡 Fetching data from Smarty API...\n');
    
    // Step 1: Get Principal Data (includes SmartyKey)
    const principalUrl = `${BASE_URL}/lookup/search/property/principal`;
    const principalParams = new URLSearchParams({
      freeform: address,
      'auth-id': SMARTY_AUTH_ID,
      'auth-token': SMARTY_AUTH_TOKEN,
      features: 'financial'
    });

    console.log('Step 1: Fetching Principal Data...');
    const principalResponse = await fetch(`${principalUrl}?${principalParams.toString()}`);
    
    if (!principalResponse.ok) {
      throw new Error(`API Error: ${principalResponse.status} ${principalResponse.statusText}`);
    }

    const principalData = await principalResponse.json();
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('              PRINCIPAL DATA (WITH FINANCIAL)');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(JSON.stringify(principalData, null, 2));
    
    if (!principalData || principalData.length === 0) {
      console.log('\n❌ No data found for this address');
      return;
    }

    const smartyKey = principalData[0].smarty_key;
    console.log(`\n🔑 SmartyKey: ${smartyKey}\n`);

    // Step 2: Fetch all available datasets
    const datasets = [
      'property/financial',
      'property/principal',
      'geo/reference',
      'secondary',
      'secondary/count',
      'risk'
    ];

    console.log('Step 2: Fetching Additional Datasets...\n');
    
    for (const dataset of datasets) {
      try {
        const datasetUrl = `${BASE_URL}/lookup/${smartyKey}/${dataset}`;
        const datasetParams = new URLSearchParams({
          'auth-id': SMARTY_AUTH_ID,
          'auth-token': SMARTY_AUTH_TOKEN
        });

        console.log(`Fetching: ${dataset}...`);
        const datasetResponse = await fetch(`${datasetUrl}?${datasetParams.toString()}`);
        
        if (datasetResponse.ok) {
          const datasetData = await datasetResponse.json();
          
          console.log(`\n═══════════════════════════════════════════════════════════`);
          console.log(`              ${dataset.toUpperCase()} DATASET`);
          console.log(`═══════════════════════════════════════════════════════════\n`);
          console.log(JSON.stringify(datasetData, null, 2));
          console.log('\n');
        } else {
          console.log(`⚠️  ${dataset}: Not available (${datasetResponse.status})\n`);
        }
      } catch (err) {
        console.log(`❌ ${dataset}: Error - ${err.message}\n`);
      }
    }

    console.log('\n✅ Complete data fetch finished!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getFullSmartyData();
