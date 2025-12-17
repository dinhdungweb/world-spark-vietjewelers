import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== 'vietjewelers') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Create Admin User
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || '123456';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const admin = await prisma.adminUser.upsert({
            where: { email: adminEmail },
            update: { passwordHash: hashedPassword },
            create: {
                email: adminEmail,
                passwordHash: hashedPassword,
            },
        });

        // 2. Create Categories
        const categories = ['Dreams', 'Confessions', 'Ideas', 'Love', 'Memory', 'Wisdom'];
        for (const name of categories) {
            await prisma.category.upsert({
                where: { name },
                update: {},
                create: { name },
            });
        }

        // 3. Create Sparks (If count is low)
        const count = await prisma.spark.count();
        let createdCount = 0;

        // Trigger seeding if we have fewer than 100 sparks
        if (count < 100) {
            // Generate 300 sparks needed for a nice globe
            const sampleTexts = [
                "I wish I could fly to the moon.",
                "Hope everyone has a great day!",
                "Looking for the meaning of life...",
                "Just passed my exams! So happy.",
                "Missing my family back home.",
                "The world is beautiful if you look closely.",
                "Coffee is the best invention ever.",
                "Dreaming of a peaceful world.",
                "Why is coding so addictive?",
                "Rainy days make me feel nostalgic.",
                "Sending love to everyone ❤️",
                "Peace and love from my corner of the world.",
                "Starry nights are the best.",
                "Believe in yourself!",
                "Travel is the only thing you buy that makes you richer.",
                "Music heals the soul."
            ];

            for (let i = 0; i < 300; i++) {
                // Fully random global coordinates
                // Lat: -60 to 80 (avoid extreme poles where map distorts or is uninhabited)
                const lat = (Math.random() * 140) - 60;
                // Lng: -180 to 180
                const lng = (Math.random() * 360) - 180;

                const cityName = faker.location.city();
                const countryName = faker.location.country();

                await prisma.spark.create({
                    data: {
                        text: i % 4 === 0 ? sampleTexts[i % sampleTexts.length] : faker.lorem.sentence({ min: 3, max: 10 }),
                        latitude: lat,
                        longitude: lng,
                        category: categories[Math.floor(Math.random() * categories.length)],
                        locationDisplay: `${cityName}, ${countryName}`,
                        status: Math.random() > 0.05 ? 'approved' : 'pending', // 95% approved
                        createdAt: faker.date.recent({ days: 60 }),
                        approvedAt: new Date(),
                    },
                });
                createdCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Seeding completed!',
            admin: admin.email,
            sparksCreated: createdCount
        });

    } catch (error: any) {
        console.error('Seeding error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
