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

        // 3. Create Sparks (Only if empty or few)
        const count = await prisma.spark.count();
        let createdCount = 0;

        if (count < 20) {
            // Generate 50 sparks
            const locations = [
                { lat: 21.0285, lng: 105.8542, name: 'Hanoi, Vietnam' },
                { lat: 10.8231, lng: 106.6297, name: 'Ho Chi Minh City, Vietnam' },
                { lat: 40.7128, lng: -74.0060, name: 'New York, USA' },
                { lat: 48.8566, lng: 2.3522, name: 'Paris, France' },
                { lat: 35.6762, lng: 139.6503, name: 'Tokyo, Japan' },
                { lat: 51.5074, lng: -0.1278, name: 'London, UK' },
                { lat: -33.8688, lng: 151.2093, name: 'Sydney, Australia' },
                { lat: 55.7558, lng: 37.6173, name: 'Moscow, Russia' },
                { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
                { lat: 37.5665, lng: 126.9780, name: 'Seoul, South Korea' },
                // ... add random variates around these
            ];

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
                "Rainy days make me feel nostalgic."
            ];

            for (let i = 0; i < 50; i++) {
                const baseLoc = locations[Math.floor(Math.random() * locations.length)];
                // Randomize location slightly within ~50km
                const lat = baseLoc.lat + (Math.random() - 0.5) * 0.5;
                const lng = baseLoc.lng + (Math.random() - 0.5) * 0.5;

                await prisma.spark.create({
                    data: {
                        text: i % 3 === 0 ? sampleTexts[i % sampleTexts.length] : faker.lorem.sentence(),
                        latitude: lat,
                        longitude: lng,
                        category: categories[Math.floor(Math.random() * categories.length)],
                        locationDisplay: baseLoc.name,
                        status: Math.random() > 0.1 ? 'approved' : 'pending',
                        createdAt: faker.date.recent({ days: 30 }),
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
