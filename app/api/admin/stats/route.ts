
import { NextResponse } from 'next/server';
import { sparkService } from '@/lib/spark-service';
import { requireAuth } from '@/lib/auth-helpers';
import { securityHeaders } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * Fetches counts of sparks by status
 */
export async function GET() {
    try {
        await requireAuth();

        const counts = await sparkService.getSparkCounts();

        return NextResponse.json(counts, {
            headers: securityHeaders,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
