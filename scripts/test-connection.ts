import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...\n');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...\n');
    
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Connection successful!');
    console.log('Current time:', result[0].current_time);
    console.log('PostgreSQL version:', result[0].pg_version.substring(0, 50) + '...\n');
    
    // Test querying business types
    const businessTypes = await sql`SELECT COUNT(*) as count FROM business_types`;
    console.log(`Business types in database: ${businessTypes[0].count}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause.message);
    }
    return false;
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  });
