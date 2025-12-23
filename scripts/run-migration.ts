import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function runMigration() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    
    console.log('Running migration: migration_add_rpa_tasks.sql');
    
    // Execute migration SQL statements separately
    await sql`
      ALTER TABLE submissions 
      ADD COLUMN IF NOT EXISTS rpa_tasks JSONB DEFAULT '{}'
    `;
    
    // Add comment (if supported)
    try {
      await sql`
        COMMENT ON COLUMN submissions.rpa_tasks IS 'Stores RPA automation task status: { carrier: { task_id, status, submitted_at, completed_at, result/error } }'
      `;
    } catch (e) {
      // Comment might not be supported, that's okay
      console.log('Note: Could not add comment (this is okay)');
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('Column rpa_tasks has been added to submissions table.');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42703') {
      console.log('Note: Column might already exist. This is okay.');
    }
    process.exit(1);
  }
}

runMigration();
