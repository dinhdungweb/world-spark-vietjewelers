import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Lat and Lng are required' }, { status: 400 });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'WorldSpark/1.0 (contact@vietjewelers.com)',
                'Referer': 'https://world-spark-vietjewelers.vercel.app'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Nominatim API Error:', response.status, text);
            throw new Error(`Nominatim API responded with ${response.status}: ${text}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Geocoding error details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch location data' },
            { status: 500 }
        );
    }
}
