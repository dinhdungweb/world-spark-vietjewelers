
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = ['Thought', 'Question', 'Observation', 'Dream', 'Memory'];

const DATA_SAMPLES = {
  Thought: [
    "The world is smaller than we think.",
    "Kindness is a language which the deaf can hear and the blind can see.",
    "Happiness depends upon ourselves.",
    "Every moment is a fresh beginning.",
    "Change the world by being yourself.",
    "Simplicity is the ultimate sophistication.",
    "What we think, we become.",
    "Life is 10% what happens to us and 90% how we react to it.",
    "The only way to do great work is to love what you do.",
    "Be the change that you wish to see in the world."
  ],
  Question: [
    "What if we could see tomorrow?",
    "Is technology bringing us closer or driving us apart?",
    "What is the sound of one hand clapping?",
    "Why do we dream?",
    "What matters most in life?",
    "If not now, when?",
    "What would you do if you weren't afraid?",
    "Who would you be without your story?",
    "Is the universe friendly?",
    "What is your superpower?"
  ],
  Observation: [
    "The sunset today was purple and gold.",
    "People rush too much these days.",
    "The city lights look like stars from above.",
    "Silence is sometimes the best answer.",
    "Nature always finds a way.",
    "The rain smells like nostalgia.",
    "Everyone has a story they aren't telling.",
    "Shadows get longer before the light fades.",
    "A smile can change a stranger's day.",
    "Time moves faster when you're happy."
  ],
  Dream: [
    "I dreamt of flying over the oceans.",
    "A world without borders.",
    "Visiting Mars one day.",
    "Everyone having enough to eat.",
    "Living in a treehouse forest.",
    "Speaking every language fluently.",
    "Teleporting to breakfast in Paris.",
    "Breathing underwater with the whales.",
    "A library that contains every book ever written.",
    "Peace in every corner of the earth."
  ],
  Memory: [
    "The smell of rain on hot asphalt.",
    "My grandmother's apple pie.",
    "First day of school.",
    "Running in the fields as a child.",
    "The day I learned to ride a bike.",
    "A summer night under the stars.",
    "The sound of waves crashing on the shore.",
    "Laughing until my stomach hurt.",
    "Getting lost in a foreign city.",
    "The taste of cold water after a long run."
  ]
};

const LOCATIONS = [
  { name: "Hanoi, Vietnam", lat: 21.0285, lng: 105.8542 },
  { name: "Ho Chi Minh City, Vietnam", lat: 10.8231, lng: 106.6297 },
  { name: "Da Nang, Vietnam", lat: 16.0544, lng: 108.2022 },
  { name: "New York, USA", lat: 40.7128, lng: -74.0060 },
  { name: "San Francisco, USA", lat: 37.7749, lng: -122.4194 },
  { name: "London, UK", lat: 51.5074, lng: -0.1278 },
  { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Osaka, Japan", lat: 34.6937, lng: 135.5023 },
  { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne, Australia", lat: -37.8136, lng: 144.9631 },
  { name: "Rio de Janeiro, Brazil", lat: -22.9068, lng: -43.1729 },
  { name: "Sao Paulo, Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "Cairo, Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Mumbai, India", lat: 19.0760, lng: 72.8777 },
  { name: "New Delhi, India", lat: 28.6139, lng: 77.2090 },
  { name: "Cape Town, South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Moscow, Russia", lat: 55.7558, lng: 37.6173 },
  { name: "Beijing, China", lat: 39.9042, lng: 116.4074 },
  { name: "Shanghai, China", lat: 31.2304, lng: 121.4737 },
  { name: "Mexico City, Mexico", lat: 19.4326, lng: -99.1332 },
  { name: "Toronto, Canada", lat: 43.6510, lng: -79.3470 },
  { name: "Vancouver, Canada", lat: 49.2827, lng: -123.1207 },
  { name: "Seoul, South Korea", lat: 37.5665, lng: 126.9780 },
  { name: "Bangkok, Thailand", lat: 13.7563, lng: 100.5018 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Dubai, UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Istanbul, Turkey", lat: 41.0082, lng: 28.9784 },
  { name: "Berlin, Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Madrid, Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Lisbon, Portugal", lat: 38.7223, lng: -9.1393 },
  { name: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Buenos Aires, Argentina", lat: -34.6037, lng: -58.3816 },
  { name: "Santiago, Chile", lat: -33.4489, lng: -70.6693 },
  { name: "Lima, Peru", lat: -12.0464, lng: -77.0428 },
  { name: "Bogota, Colombia", lat: 4.7110, lng: -74.0721 },
  { name: "Jakarta, Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Manila, Philippines", lat: 14.5995, lng: 120.9842 },
  { name: "Nairobi, Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Lagos, Nigeria", lat: 6.5244, lng: 3.3792 }
];

function getRandomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('Start seeding massive sparks...');

  // Create 500 approved sparks
  // We'll batch them to avoid connection timeouts optionally, but 500 is small enough for prisma
  const promises = [];

  for (let i = 0; i < 500; i++) {
    const category = getRandomItem(CATEGORIES) as keyof typeof DATA_SAMPLES;
    const text = getRandomItem(DATA_SAMPLES[category]);
    const location = getRandomItem(LOCATIONS);

    // Bigger spread: +/- 15 degrees to cover continents better
    const lat = location.lat + getRandomFloat(-15, 15);
    const lng = location.lng + getRandomFloat(-15, 15);

    // Constrain lat
    const finalLat = Math.max(-90, Math.min(90, lat));

    promises.push(prisma.spark.create({
      data: {
        text: text,
        category: category,
        latitude: finalLat,
        longitude: lng,
        locationDisplay: `Near ${location.name}`,
        status: 'approved',
        createdAt: new Date(),
        approvedAt: new Date(),
      },
    }));
  }

  // Wait for all
  await Promise.all(promises);

  console.log('Created 500 approved sparks.');

  // Create 50 pending sparks for admin testing
  const pendingPromises = [];
  for (let i = 0; i < 50; i++) {
    const category = getRandomItem(CATEGORIES) as keyof typeof DATA_SAMPLES;
    const text = `PENDING: ${getRandomItem(DATA_SAMPLES[category])}`;
    const location = getRandomItem(LOCATIONS);

    const lat = location.lat + getRandomFloat(-5, 5);
    const lng = location.lng + getRandomFloat(-5, 5);

    pendingPromises.push(prisma.spark.create({
      data: {
        text: text + " (Waiting for approval)",
        category: category,
        latitude: lat,
        longitude: lng,
        locationDisplay: `Near ${location.name}`,
        status: 'pending',
        createdAt: new Date(),
      },
    }));
  }

  await Promise.all(pendingPromises);
  console.log('Created 50 pending sparks.');

  console.log('Massive seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
