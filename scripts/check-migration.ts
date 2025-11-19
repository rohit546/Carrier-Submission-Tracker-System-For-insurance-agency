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

async function checkMigration() {
  try {
    console.log('🔍 Checking if insured_information table exists...');
    
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'insured_information'
      );
    `;
    
    const exists = result[0].exists;
    
    if (exists) {
      console.log('✅ insured_information table already exists!');
      console.log('✅ Migration not needed.');
    } else {
      console.log('⚠️  insured_information table does NOT exist.');
      console.log('📋 You need to run the migration:');
      console.log('   psql "your-database-url" -f database/migration_add_insured_information.sql');
      console.log('\n   Or execute the SQL file in your database client.');
    }
    
    // Also check for public_access_token column
    const tokenColumnCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'submissions'
        AND column_name = 'public_access_token'
      );
    `;
    
    const tokenColumnExists = tokenColumnCheck[0].exists;
    
    if (!tokenColumnExists && exists) {
      console.log('\n⚠️  public_access_token column missing in submissions table.');
      console.log('📋 Please run the full migration script.');
    } else if (tokenColumnExists) {
      console.log('✅ public_access_token column exists.');
    }
    
  } catch (error: any) {
    console.error('❌ Error checking migration:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

checkMigration();

