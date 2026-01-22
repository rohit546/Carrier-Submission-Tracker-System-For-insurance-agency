// Script to run the non_standard_submissions migration
// Usage: node scripts/run-migration.js

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('📝 Reading migration file...');
    const migrationPath = path.join(__dirname, '../database/migrations/create_non_standard_submissions_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running migration...');
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql(statement);
          console.log('   ✓ Executed statement');
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message && err.message.includes('already exists')) {
            console.log('   ⚠ Statement already executed (skipping)');
          } else {
            throw err;
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
