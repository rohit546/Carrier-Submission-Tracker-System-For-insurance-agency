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

async function cleanupSimple() {
  try {
    console.log('🧹 Cleaning up dummy business types...\n');

    // Business types to delete
    const typesToDelete = [
      'C-Store',
      'Restaurant',
      'Gas Station',
      'Daycare',
      'Spa',
      'Retail',
      'Warehouse',
      'Office Building',
    ];

    console.log(`Will delete: ${typesToDelete.join(', ')}\n`);

    for (const typeName of typesToDelete) {
      try {
        // Get the business type ID
        const result = await sql`
          SELECT id FROM business_types WHERE name = ${typeName}
        `;

        if (result.length === 0) {
          console.log(`⚠️  ${typeName} not found, skipping`);
          continue;
        }

        const id = result[0].id;
        console.log(`Deleting: ${typeName} (${id})...`);

        // Delete in correct order (respecting foreign keys)
        await sql`DELETE FROM carrier_appetite WHERE business_type_id = ${id}`;
        await sql`DELETE FROM carrier_quotes WHERE submission_id IN (SELECT id FROM submissions WHERE business_type_id = ${id})`;
        await sql`DELETE FROM submissions WHERE business_type_id = ${id}`;
        await sql`DELETE FROM business_types WHERE id = ${id}`;

        console.log(`✅ Deleted: ${typeName}`);
      } catch (error: any) {
        console.error(`❌ Error deleting ${typeName}:`, error.message);
      }
    }

    // Show remaining business types
    const remaining = await sql`SELECT name FROM business_types ORDER BY name`;
    console.log(`\n✅ Remaining business types (${remaining.length}):`);
    remaining.forEach((row: any) => console.log(`   - ${row.name}`));

    console.log('\n🎉 Cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

cleanupSimple()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
