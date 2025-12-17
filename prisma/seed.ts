import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Seed categories
  const categories = [
    'Thought',
    'Question',
    'Observation',
    'Dream',
    'Memory'
  ];

  console.log('Seeding categories...');
  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName }
    });
    console.log(`  ✓ Category: ${categoryName}`);
  }

  // Seed initial admin user if environment variables are set
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    console.log('Seeding admin user...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        passwordHash: passwordHash
      }
    });
    console.log(`  ✓ Admin user: ${adminEmail}`);
  } else {
    console.log('Skipping admin user seed (ADMIN_EMAIL or ADMIN_PASSWORD not set)');
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
