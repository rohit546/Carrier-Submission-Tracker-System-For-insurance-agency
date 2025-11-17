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

async function cleanupBusinessTypes() {
  try {
    console.log('🧹 Cleaning up business types...\n');

    // Correct business types from playbook (exact names)
    // These are the ONLY business types we want to keep
    const correctBusinessTypes = [
      'Grocery Stores',
      'C-Stores without Gas (lottery and tobacco)',
      'C-Stores with Gas (18 hours and 24 hours)',
      'Offices (occupied or LRO)/1 story or more',
      'Laundromat',
      'Hotel/Motel',
      'Restaurants',  // Note: plural "Restaurants" from playbook
      'Day Spa and Incidental Med Spa',
      'Child Day Care',  // Note: "Child Day Care" not "Daycare"
    ];

    // Business types to remove (dummy/incorrect ones)
    const dummyTypesToRemove = [
      'Retail',
      'Spa',
      'Warehouse',
      'Office Building',  // Old name, new one is "Offices (occupied or LRO)/1 story or more"
      'C-Store',  // Old generic name
      'Cstore',  // Old name
      'Restaurant',  // Singular (should be "Restaurants")
      'Gas Station',  // Old name
      'Daycare',  // Old name (should be "Child Day Care")
    ];

    // Get all existing business types
    const existing = await sql`SELECT id, name FROM business_types`;
    console.log(`Found ${existing.length} existing business types\n`);

    // Delete business types that are NOT in the correct list
    const toDelete: string[] = [];
    const toKeep: string[] = [];

    for (const bt of existing) {
      if (correctBusinessTypes.includes(bt.name)) {
        toKeep.push(bt.name);
        console.log(`✅ Keeping: ${bt.name}`);
      } else {
        toDelete.push(bt.id);
        console.log(`❌ Will delete: ${bt.name}`);
      }
    }

    if (toDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${toDelete.length} business types and related data...\n`);
      
      // Delete in batches to avoid timeout
      for (let i = 0; i < toDelete.length; i++) {
        const id = toDelete[i];
        try {
          // Delete carrier appetite records first (foreign key constraint)
          const appetiteResult = await sql`
            DELETE FROM carrier_appetite
            WHERE business_type_id = ${id}
          `;
          
          // Delete carrier quotes for submissions
          await sql`
            DELETE FROM carrier_quotes
            WHERE submission_id IN (SELECT id FROM submissions WHERE business_type_id = ${id})
          `;
          
          // Delete submissions
          await sql`
            DELETE FROM submissions
            WHERE business_type_id = ${id}
          `;
          
          // Delete business type
          await sql`
            DELETE FROM business_types
            WHERE id = ${id}
          `;
          
          console.log(`✅ Deleted business type ${i + 1}/${toDelete.length}`);
        } catch (error: any) {
          console.error(`❌ Error deleting business type ${id}:`, error.message);
        }
      }

      console.log(`\n✅ Deleted ${toDelete.length} business types and related data`);
    } else {
      console.log('✅ No business types to delete');
    }

    // Show what's kept
    console.log(`\n✅ Kept ${toKeep.length} business types:`);
    toKeep.forEach(name => console.log(`   - ${name}`));

    // Verify final state
    const final = await sql`SELECT name FROM business_types ORDER BY name`;
    console.log(`\n📊 Final business types (${final.length}):`);
    final.forEach((row: any) => console.log(`   - ${row.name}`));

    console.log('\n🎉 Cleanup complete!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

cleanupBusinessTypes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
