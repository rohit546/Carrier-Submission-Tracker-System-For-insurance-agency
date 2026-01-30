const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  const connectionString = process.env.NEON_CONNECTION_STRING;
  
  if (!connectionString) {
    console.error('❌ NEON_CONNECTION_STRING not found in environment variables');
    console.log('Please add NEON_CONNECTION_STRING to your .env.local file');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-coversheet-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Creating tables...');
    await client.query(sql);
    console.log('✅ Tables created successfully!');

    // Verify tables exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('insured_information', 'submissions')
      ORDER BY table_name;
    `);

    console.log('\n📊 Created tables:');
    tablesCheck.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();

