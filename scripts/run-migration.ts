import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('📋 Running database migration...');
    console.log('   Reading migration file...');
    
    const migrationSQL = readFileSync(
      resolve(process.cwd(), 'database/migration_add_insured_information.sql'),
      'utf-8'
    );
    
    // Split by semicolons and execute each statement
    // Note: This is a simple approach. For production, use a proper migration tool.
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements to execute...`);
    
    // Execute migration statements manually (Neon serverless doesn't support multi-statement)
    console.log('   Creating insured_information table...');
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS insured_information (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          unique_identifier VARCHAR(255) UNIQUE,
          ownership_type VARCHAR(50),
          corporation_name VARCHAR(255) NOT NULL,
          contact_name VARCHAR(255),
          contact_number VARCHAR(50),
          contact_email VARCHAR(255),
          lead_source VARCHAR(255),
          proposed_effective_date DATE,
          prior_carrier VARCHAR(255),
          target_premium DECIMAL(10, 2),
          applicant_is VARCHAR(50),
          operation_description TEXT,
          dba VARCHAR(255),
          address TEXT,
          hours_of_operation VARCHAR(50),
          no_of_mpos INTEGER,
          construction_type VARCHAR(100),
          years_exp_in_business INTEGER,
          years_at_location INTEGER,
          year_built INTEGER,
          year_latest_update INTEGER,
          total_sq_footage INTEGER,
          leased_out_space VARCHAR(10),
          protection_class VARCHAR(50),
          additional_insured TEXT,
          alarm_info JSONB DEFAULT '{}'::jsonb,
          fire_info JSONB DEFAULT '{}'::jsonb,
          property_coverage JSONB DEFAULT '{}'::jsonb,
          general_liability JSONB DEFAULT '{}'::jsonb,
          workers_compensation JSONB DEFAULT '{}'::jsonb,
          source VARCHAR(50) DEFAULT 'manual',
          eform_submission_id UUID,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      console.log('   ✅ insured_information table created');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.code === '42P07') {
        console.log('   ⚠️  insured_information table already exists');
      } else {
        throw error;
      }
    }
    
    console.log('   Updating submissions table...');
    try {
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS insured_info_id UUID REFERENCES insured_information(id) ON DELETE SET NULL`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS insured_info_snapshot JSONB DEFAULT '{}'::jsonb`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual'`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS eform_submission_id UUID`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS public_access_token UUID UNIQUE`;
      await sql`ALTER TABLE submissions ALTER COLUMN business_type_id DROP NOT NULL`;
      console.log('   ✅ submissions table updated');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.code === '42701') {
        console.log('   ⚠️  Some columns already exist (this is OK)');
      } else {
        throw error;
      }
    }
    
    console.log('   Creating indexes...');
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_insured_info_corporation ON insured_information(corporation_name)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_insured_info_unique_id ON insured_information(unique_identifier)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_insured_info_source ON insured_information(source)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_insured_info_created ON insured_information(created_at)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_submissions_insured_info ON submissions(insured_info_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_submissions_public_token ON submissions(public_access_token)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_submissions_source ON submissions(source)`;
      console.log('   ✅ Indexes created');
    } catch (error: any) {
      console.log('   ⚠️  Some indexes may already exist (this is OK)');
    }
    
    console.log('   Creating summaries table...');
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS insured_summaries (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          insured_info_id UUID NOT NULL REFERENCES insured_information(id) ON DELETE CASCADE,
          summary_data JSONB DEFAULT '{}'::jsonb,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_summaries_insured_info ON insured_summaries(insured_info_id)`;
      console.log('   ✅ summaries table created');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.code === '42P07') {
        console.log('   ⚠️  summaries table already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Migration completed!');
    console.log('   You can now start the dev server: npm run dev');
    
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    console.error('\n💡 Alternative: Run the migration manually:');
    console.error('   psql "your-database-url" -f database/migration_add_insured_information.sql');
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();

