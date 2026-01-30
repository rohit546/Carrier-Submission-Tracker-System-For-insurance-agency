const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verifySubmission() {
  const connectionString = process.env.NEON_CONNECTION_STRING;
  
  if (!connectionString) {
    console.error('❌ NEON_CONNECTION_STRING not found');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check insured_information table
    const insuredInfoCount = await client.query('SELECT COUNT(*) as count FROM insured_information');
    console.log(`📊 Total records in insured_information: ${insuredInfoCount.rows[0].count}`);

    const recentInsured = await client.query(`
      SELECT id, corporation_name, contact_name, created_at, eform_submission_id
      FROM insured_information
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\n📋 Recent insured_information records:');
    recentInsured.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ID: ${row.id}`);
      console.log(`     Corporation: ${row.corporation_name}`);
      console.log(`     Contact: ${row.contact_name || 'N/A'}`);
      console.log(`     Created: ${row.created_at}`);
      console.log(`     Eform ID: ${row.eform_submission_id}`);
      console.log('');
    });

    // Check submissions table
    const submissionsCount = await client.query('SELECT COUNT(*) as count FROM submissions');
    console.log(`📊 Total records in submissions: ${submissionsCount.rows[0].count}`);

    const recentSubmissions = await client.query(`
      SELECT id, business_name, status, insured_info_id, public_access_token, created_at, eform_submission_id
      FROM submissions
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\n📋 Recent submissions records:');
    recentSubmissions.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ID: ${row.id}`);
      console.log(`     Business: ${row.business_name}`);
      console.log(`     Status: ${row.status}`);
      console.log(`     Insured Info ID: ${row.insured_info_id}`);
      console.log(`     Public Token: ${row.public_access_token}`);
      console.log(`     Created: ${row.created_at}`);
      console.log(`     Eform ID: ${row.eform_submission_id}`);
      console.log('');
    });

    // Check for the specific IDs from the error
    const specificInsuredId = 'bf3ce4f9-4de2-462f-a866-e38240ee7b4b';
    const specificSubmissionId = '2c779a89-d7ea-482d-bfb6-10c3e415ed7c';
    
    console.log(`\n🔍 Checking for specific IDs:`);
    const foundInsured = await client.query('SELECT * FROM insured_information WHERE id = $1', [specificInsuredId]);
    console.log(`   Insured Info ID ${specificInsuredId}: ${foundInsured.rows.length > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    const foundSubmission = await client.query('SELECT * FROM submissions WHERE id = $1', [specificSubmissionId]);
    console.log(`   Submission ID ${specificSubmissionId}: ${foundSubmission.rows.length > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifySubmission();

