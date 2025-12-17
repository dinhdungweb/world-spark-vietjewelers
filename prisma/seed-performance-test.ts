/**
 * Performance test seed script
 * Creates 10,000 approved sparks for performance testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = ['Thought', 'Question', 'Observation', 'Dream', 'Memory'];

const SAMPLE_TEXTS = [
  'The stars remind me that we are all made of stardust.',
  'What if every decision creates a parallel universe?',
  'I noticed how the morning light changes everything.',
  'Last night I dreamed I could fly over the ocean.',
  'I remember the smell of rain on summer afternoons.',
  'Sometimes silence speaks louder than words.',
  'Why do we fear the unknown when it holds infinite possibilities?',
  'The way clouds move tells stories we never hear.',
  'I once believed time was linear, now I know better.',
  'Coffee tastes different when shared with a friend.',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomCoordinate(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

async function main() {
  console.log('Starting performance test seed...');
  console.log('Creating 10,000 approved sparks...');

  const startTime = Date.now();
  const batchSize = 1000;
  const totalSparks = 10000;

  for (let i = 0; i < totalSparks; i += batchSize) {
    const sparks = [];
    
    for (let j = 0; j < batchSize && (i + j) < totalSparks; j++) {
      sparks.push({
        text: getRandomElement(SAMPLE_TEXTS),
        latitude: getRandomCoordinate(-90, 90),
        longitude: getRandomCoordinate(-180, 180),
        category: getRandomElement(CATEGORIES),
        locationDisplay: `Near City ${i + j}, Country`,
        status: 'approved',
        approvedAt: new Date(),
      });
    }

    await prisma.spark.createMany({
      data: sparks,
    });

    console.log(`Created ${i + batchSize} / ${totalSparks} sparks...`);
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(`✅ Successfully created ${totalSparks} approved sparks in ${duration.toFixed(2)}s`);
  
  const count = await prisma.spark.count({
    where: { status: 'approved' },
  });
  
  console.log(`Total approved sparks in database: ${count}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
