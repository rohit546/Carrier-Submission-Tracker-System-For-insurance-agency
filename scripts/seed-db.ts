import bcrypt from 'bcryptjs';
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

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...\n');

    // Check if users already exist
    const existingUsers = await sql`SELECT username FROM users WHERE username IN ('admin', 'agent')`;
    
    if (existingUsers.length > 0) {
      console.log('⚠️  Users already exist. Skipping user creation.');
    } else {
      // Create admin user
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      await sql`
        INSERT INTO users (username, password, role, name)
        VALUES ('admin', ${hashedAdminPassword}, 'admin', 'Admin User')
      `;
      console.log('✅ Admin user created (admin/admin123)');
    }

    // Check if agent exists
    const existingAgent = await sql`SELECT username FROM users WHERE username = 'agent'`;
    if (existingAgent.length === 0) {
      const hashedAgentPassword = await bcrypt.hash('agent123', 10);
      await sql`
        INSERT INTO users (username, password, role, name)
        VALUES ('agent', ${hashedAgentPassword}, 'agent', 'Agent Smith')
      `;
      console.log('✅ Agent user created (agent/agent123)');
    }

    // Seed business types
    const businessTypes = [
      'C-Store',
      'Restaurant',
      'Gas Station',
      'Daycare',
      'Spa',
      'Retail',
      'Warehouse',
      'Office Building',
    ];

    for (const name of businessTypes) {
      await sql`
        INSERT INTO business_types (name)
        VALUES (${name})
        ON CONFLICT (name) DO NOTHING
      `;
    }
    console.log('✅ Business types seeded');

    // Seed carriers
    const carriers = [
      'State Farm',
      'Travelers',
      'Liberty Mutual',
      'Nationwide',
      'Progressive',
      'Allstate',
    ];

    for (const name of carriers) {
      await sql`
        INSERT INTO carriers (name)
        VALUES (${name})
        ON CONFLICT (name) DO NOTHING
      `;
    }
    console.log('✅ Carriers seeded');

    console.log('\n🎉 Database seeding complete!');
    console.log('\nLogin credentials:');
    console.log('Admin: username: admin, password: admin123');
    console.log('Agent: username: agent, password: agent123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
