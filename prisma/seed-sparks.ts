/**
 * Seed script to create sample approved sparks for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sample sparks...');

  // Sample sparks from around the world
  const sampleSparks = [
    {
      text: 'Watching the sunrise over the mountains, feeling grateful for this moment.',
      latitude: 35.7,
      longitude: 139.7,
      category: 'Thought',
      locationDisplay: 'Near Tokyo, Japan',
      status: 'approved',
    },
    {
      text: 'What if we could see the world through the eyes of others?',
      latitude: 40.7,
      longitude: -74.0,
      category: 'Question',
      locationDisplay: 'Near New York, United States',
      status: 'approved',
    },
    {
      text: 'The coffee shop on the corner closed today after 50 years. End of an era.',
      latitude: 51.5,
      longitude: -0.1,
      category: 'Observation',
      locationDisplay: 'Near London, United Kingdom',
      status: 'approved',
    },
    {
      text: 'Dreamed I could fly over the ocean, touching the clouds with my fingertips.',
      latitude: -33.9,
      longitude: 151.2,
      category: 'Dream',
      locationDisplay: 'Near Sydney, Australia',
      status: 'approved',
    },
    {
      text: 'My grandmother used to say: "The stars remember everything we forget."',
      latitude: 48.9,
      longitude: 2.3,
      category: 'Memory',
      locationDisplay: 'Near Paris, France',
      status: 'approved',
    },
    {
      text: 'Sometimes silence speaks louder than words ever could.',
      latitude: 52.5,
      longitude: 13.4,
      category: 'Thought',
      locationDisplay: 'Near Berlin, Germany',
      status: 'approved',
    },
    {
      text: 'Why do we always rush towards tomorrow instead of living today?',
      latitude: 41.9,
      longitude: 12.5,
      category: 'Question',
      locationDisplay: 'Near Rome, Italy',
      status: 'approved',
    },
    {
      text: 'The old tree in the park finally bloomed after years of waiting.',
      latitude: 55.8,
      longitude: 37.6,
      category: 'Observation',
      locationDisplay: 'Near Moscow, Russia',
      status: 'approved',
    },
    {
      text: 'In my dream, I walked through a library where books wrote themselves.',
      latitude: 19.4,
      longitude: -99.1,
      category: 'Dream',
      locationDisplay: 'Near Mexico City, Mexico',
      status: 'approved',
    },
    {
      text: 'I remember the smell of rain on hot summer afternoons as a child.',
      latitude: 21.0,
      longitude: 105.8,
      category: 'Memory',
      locationDisplay: 'Near Hanoi, Vietnam',
      status: 'approved',
    },
    {
      text: 'Every ending is just a new beginning in disguise.',
      latitude: -23.5,
      longitude: -46.6,
      category: 'Thought',
      locationDisplay: 'Near São Paulo, Brazil',
      status: 'approved',
    },
    {
      text: 'How many thoughts have been lost because we forgot to write them down?',
      latitude: 28.6,
      longitude: 77.2,
      category: 'Question',
      locationDisplay: 'Near New Delhi, India',
      status: 'approved',
    },
    {
      text: 'The moon looks different from every window in this city.',
      latitude: 39.9,
      longitude: 116.4,
      category: 'Observation',
      locationDisplay: 'Near Beijing, China',
      status: 'approved',
    },
    {
      text: 'Dreamed of a world where music was visible, floating in the air like colors.',
      latitude: 59.3,
      longitude: 18.1,
      category: 'Dream',
      locationDisplay: 'Near Stockholm, Sweden',
      status: 'approved',
    },
    {
      text: 'The sound of my father whistling while cooking breakfast on Sunday mornings.',
      latitude: -34.6,
      longitude: -58.4,
      category: 'Memory',
      locationDisplay: 'Near Buenos Aires, Argentina',
      status: 'approved',
    },
    {
      text: 'In the quiet moments, we find ourselves.',
      latitude: 1.3,
      longitude: 103.8,
      category: 'Thought',
      locationDisplay: 'Near Singapore, Singapore',
      status: 'approved',
    },
    {
      text: 'What would you tell your younger self if you could?',
      latitude: 37.6,
      longitude: 126.9,
      category: 'Question',
      locationDisplay: 'Near Seoul, South Korea',
      status: 'approved',
    },
    {
      text: 'A stranger smiled at me today. It changed my whole afternoon.',
      latitude: 50.1,
      longitude: 8.7,
      category: 'Observation',
      locationDisplay: 'Near Frankfurt, Germany',
      status: 'approved',
    },
    {
      text: 'I was swimming in an ocean made of stars, each one a different memory.',
      latitude: 25.3,
      longitude: 55.3,
      category: 'Dream',
      locationDisplay: 'Near Dubai, United Arab Emirates',
      status: 'approved',
    },
    {
      text: 'The way my mother hummed while gardening, always the same melody.',
      latitude: 45.5,
      longitude: -73.6,
      category: 'Memory',
      locationDisplay: 'Near Montreal, Canada',
      status: 'approved',
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const spark of sampleSparks) {
    try {
      // Check if a similar spark already exists
      const existing = await prisma.spark.findFirst({
        where: {
          text: spark.text,
        },
      });

      if (existing) {
        console.log(`  ⊘ Skipped: "${spark.text.substring(0, 50)}..." (already exists)`);
        skippedCount++;
        continue;
      }

      await prisma.spark.create({
        data: {
          ...spark,
          approvedAt: new Date(),
        },
      });

      console.log(`  ✓ Created: "${spark.text.substring(0, 50)}..." at ${spark.locationDisplay}`);
      createdCount++;
    } catch (error) {
      console.error(`  ✗ Error creating spark: ${error}`);
    }
  }

  console.log(`\nSeed completed!`);
  console.log(`  Created: ${createdCount} sparks`);
  console.log(`  Skipped: ${skippedCount} sparks (already exist)`);
  console.log(`  Total: ${createdCount + skippedCount} sparks processed`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
