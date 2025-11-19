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

interface BusinessType {
  id: string;
  name: string;
}

interface CarrierAppetite {
  id: string;
  carrier_id: string;
  business_type_id: string;
}

async function cleanupToTwoLOBs() {
  console.log('🧹 Starting cleanup to keep only 2 LOBs...\n');

  try {
    // Step 1: Get all current business types
    const allBusinessTypes = await sql`
      SELECT id, name FROM business_types ORDER BY name
    ` as BusinessType[];

    console.log(`📊 Found ${allBusinessTypes.length} existing business types:`);
    allBusinessTypes.forEach(bt => {
      console.log(`   - ${bt.name} (${bt.id})`);
    });

    // Step 2: Define the business types we want to keep
    // User wants: 1) C-Store/Grocery Store, 2) Gas Station (18 hours), 3) Gas Station (24 hours)
    const keepBusinessTypes = [
      'C-Store/Grocery Store',
      'Gas Station (18 hours)',
      'Gas Station (24 hours)'
    ];

    // Step 3: Find which business types to delete
    const businessTypesToDelete = allBusinessTypes.filter(
      bt => !keepBusinessTypes.includes(bt.name)
    );

    if (businessTypesToDelete.length === 0) {
      console.log('\n✅ No business types to delete. All match the target list.');
      return;
    }

    console.log(`\n❌ Will delete ${businessTypesToDelete.length} business types:`);
    businessTypesToDelete.forEach(bt => {
      console.log(`   - ${bt.name} (${bt.id})`);
    });

    // Step 4: Get carrier appetite records for business types to be deleted
    const carrierAppetiteToDelete = await sql`
      SELECT id, carrier_id, business_type_id 
      FROM carrier_appetite 
      WHERE business_type_id = ANY(${businessTypesToDelete.map(bt => bt.id)})
    ` as CarrierAppetite[];

    console.log(`\n📋 Found ${carrierAppetiteToDelete.length} carrier appetite records to delete`);

    // Step 5: Get submissions for business types to be deleted
    const submissionsToDelete = await sql`
      SELECT id, business_name, business_type_id 
      FROM submissions 
      WHERE business_type_id = ANY(${businessTypesToDelete.map(bt => bt.id)})
    `;

    console.log(`📋 Found ${submissionsToDelete.length} submissions to delete`);

    if (submissionsToDelete.length > 0) {
      console.log('\n⚠️  WARNING: The following submissions will be deleted:');
      submissionsToDelete.forEach((sub: any) => {
        console.log(`   - ${sub.business_name} (${sub.id})`);
      });
    }

    // Step 6: Check if target business types exist, create if they don't
    console.log('\n🔍 Checking target business types...');
    for (const targetName of keepBusinessTypes) {
      const existing = await sql`
        SELECT id FROM business_types WHERE name = ${targetName}
      `;
      
      if (existing.length === 0) {
        console.log(`   ➕ Creating: ${targetName}`);
        await sql`
          INSERT INTO business_types (name)
          VALUES (${targetName})
        `;
      } else {
        console.log(`   ✅ Exists: ${targetName}`);
      }
    }

    // Step 7: Delete carrier quotes for submissions to be deleted
    if (submissionsToDelete.length > 0) {
      const submissionIds = submissionsToDelete.map((s: any) => s.id);
      await sql`
        DELETE FROM carrier_quotes 
        WHERE submission_id = ANY(${submissionIds})
      `;
      console.log(`\n🗑️  Deleted carrier quotes for ${submissionsToDelete.length} submissions`);
    }

    // Step 8: Delete submissions
    if (submissionsToDelete.length > 0) {
      const submissionIds = submissionsToDelete.map((s: any) => s.id);
      await sql`
        DELETE FROM submissions 
        WHERE id = ANY(${submissionIds})
      `;
      console.log(`🗑️  Deleted ${submissionsToDelete.length} submissions`);
    }

    // Step 9: Delete carrier appetite
    if (carrierAppetiteToDelete.length > 0) {
      await sql`
        DELETE FROM carrier_appetite 
        WHERE business_type_id = ANY(${businessTypesToDelete.map(bt => bt.id)})
      `;
      console.log(`🗑️  Deleted ${carrierAppetiteToDelete.length} carrier appetite records`);
    }

    // Step 10: Delete business types
    if (businessTypesToDelete.length > 0) {
      await sql`
        DELETE FROM business_types 
        WHERE id = ANY(${businessTypesToDelete.map(bt => bt.id)})
      `;
      console.log(`🗑️  Deleted ${businessTypesToDelete.length} business types`);
    }

    // Step 11: Verify final state
    console.log('\n✅ Cleanup complete! Final business types:');
    const finalBusinessTypes = await sql`
      SELECT id, name FROM business_types ORDER BY name
    ` as BusinessType[];
    
    finalBusinessTypes.forEach(bt => {
      console.log(`   - ${bt.name}`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`   - Business types kept: ${finalBusinessTypes.length}`);
    console.log(`   - Business types deleted: ${businessTypesToDelete.length}`);
    console.log(`   - Carrier appetite deleted: ${carrierAppetiteToDelete.length}`);
    console.log(`   - Submissions deleted: ${submissionsToDelete.length}`);

  } catch (error: any) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
cleanupToTwoLOBs()
  .then(() => {
    console.log('\n✨ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });

