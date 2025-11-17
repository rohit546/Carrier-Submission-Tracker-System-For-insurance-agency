import bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data');

async function ensureDir() {
  try {
    await fs.mkdir(dataPath, { recursive: true });
  } catch (error) {
    // Directory exists
  }
}

async function seed() {
  await ensureDir();

  // Seed users
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedAgentPassword = await bcrypt.hash('agent123', 10);

  const users = [
    {
      id: '1',
      username: 'admin',
      password: hashedAdminPassword,
      role: 'admin',
      name: 'Admin User',
    },
    {
      id: '2',
      username: 'agent',
      password: hashedAgentPassword,
      role: 'agent',
      name: 'Agent Smith',
    },
  ];

  // Seed business types
  const businessTypes = [
    { id: '1', name: 'C-Store' },
    { id: '2', name: 'Restaurant' },
    { id: '3', name: 'Gas Station' },
    { id: '4', name: 'Daycare' },
    { id: '5', name: 'Spa' },
    { id: '6', name: 'Retail' },
    { id: '7', name: 'Warehouse' },
    { id: '8', name: 'Office Building' },
  ];

  // Seed carriers
  const carriers = [
    { id: '1', name: 'State Farm' },
    { id: '2', name: 'Travelers' },
    { id: '3', name: 'Liberty Mutual' },
    { id: '4', name: 'Nationwide' },
    { id: '5', name: 'Progressive' },
    { id: '6', name: 'Allstate' },
  ];

  // Seed carrier appetite (example: some carriers cover all, some are selective)
  const carrierAppetite = [
    // C-Store
    { carrierId: '1', businessTypeId: '1' },
    { carrierId: '2', businessTypeId: '1' },
    { carrierId: '3', businessTypeId: '1' },
    // Restaurant
    { carrierId: '1', businessTypeId: '2' },
    { carrierId: '4', businessTypeId: '2' },
    { carrierId: '5', businessTypeId: '2' },
    // Gas Station
    { carrierId: '2', businessTypeId: '3' },
    { carrierId: '6', businessTypeId: '3' },
    // Daycare
    { carrierId: '1', businessTypeId: '4' },
    { carrierId: '3', businessTypeId: '4' },
    // Spa
    { carrierId: '4', businessTypeId: '5' },
    { carrierId: '5', businessTypeId: '5' },
  ];

  await fs.writeFile(
    path.join(dataPath, 'users.json'),
    JSON.stringify(users, null, 2)
  );
  await fs.writeFile(
    path.join(dataPath, 'businessTypes.json'),
    JSON.stringify(businessTypes, null, 2)
  );
  await fs.writeFile(
    path.join(dataPath, 'carriers.json'),
    JSON.stringify(carriers, null, 2)
  );
  await fs.writeFile(
    path.join(dataPath, 'carrierAppetite.json'),
    JSON.stringify(carrierAppetite, null, 2)
  );
  await fs.writeFile(
    path.join(dataPath, 'submissions.json'),
    JSON.stringify([], null, 2)
  );

  console.log('✓ Database seeded successfully!');
  console.log('\nDemo credentials:');
  console.log('Admin: username: admin, password: admin123');
  console.log('Agent: username: agent, password: agent123');
}

seed().catch(console.error);
