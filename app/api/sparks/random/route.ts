import { NextResponse } from 'next/server';
import { sparkService } from '@/lib/spark-service';
import { securityHeaders } from '@/lib/security';

export async function GET() {
  try {
    const spark = await sparkService.getRandomSpark();

    if (!spark) {
      return NextResponse.json(
        { error: 'No sparks available', code: 'NOT_FOUND' },
        { status: 404, headers: securityHeaders }
      );
    }

    return NextResponse.json(spark, { headers: securityHeaders });
  } catch (error) {
    console.error('Error fetching random spark:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random spark', code: 'FETCH_ERROR' },
      { status: 500, headers: securityHeaders }
    );
  }
}
