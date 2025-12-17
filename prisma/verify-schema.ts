/**
 * Verify Prisma schema and client generation
 * This script checks that the Prisma client is properly generated
 * and the schema models are accessible.
 */

import { PrismaClient } from '@prisma/client';

console.log('✓ Prisma Client imported successfully');

// Verify models are available
const prisma = new PrismaClient();

console.log('✓ PrismaClient instantiated');

// Check that all expected models exist
const models = ['spark', 'category', 'adminUser'];
const availableModels = Object.keys(prisma).filter(key => 
  !key.startsWith('_') && !key.startsWith('$')
);

console.log('\nAvailable models:', availableModels);

models.forEach(model => {
  if (availableModels.includes(model)) {
    console.log(`✓ Model '${model}' is available`);
  } else {
    console.error(`✗ Model '${model}' is NOT available`);
    process.exit(1);
  }
});

console.log('\n✓ All schema models verified successfully!');
console.log('\nNote: To create the database tables, run:');
console.log('  npx prisma migrate dev --name init');

process.exit(0);
