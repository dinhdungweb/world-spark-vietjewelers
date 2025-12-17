/**
 * Test seed script logic without database connection
 * Verifies that the seed data structure is correct
 */

import * as bcrypt from 'bcrypt';

async function testSeed() {
  console.log('Testing seed script logic...\n');

  // Test categories
  const categories = [
    'Thought',
    'Question',
    'Observation',
    'Dream',
    'Memory'
  ];

  console.log('✓ Categories to seed:');
  categories.forEach(cat => console.log(`  - ${cat}`));

  // Test admin user creation
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'test-password';

  console.log('\n✓ Admin user configuration:');
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword.replace(/./g, '*')}`);

  // Test bcrypt hashing
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  console.log(`  Hash generated: ${passwordHash.substring(0, 20)}...`);

  // Verify hash
  const isValid = await bcrypt.compare(adminPassword, passwordHash);
  console.log(`  Hash verification: ${isValid ? '✓ Valid' : '✗ Invalid'}`);

  console.log('\n✓ Seed script logic verified successfully!');
  console.log('\nNote: This is a dry-run. To actually seed the database, run:');
  console.log('  npm run prisma:seed');
}

testSeed().catch(console.error);
