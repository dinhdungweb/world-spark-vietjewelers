
import { NextRequest, NextResponse } from 'next/server';
import { sparkService, SparkStatus } from '@/lib/spark-service';
import { requireAuth } from '@/lib/auth-helpers';
import { securityHeaders } from '@/lib/security';

/**
 * GET /api/admin/sparks
 * Fetches sparks by status for admin management
 * Query Params: status (pending | approved | rejected)
 */
export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const session = await requireAuth();

        const searchParams = request.nextUrl.searchParams;
        const statusParam = searchParams.get('status') || 'pending';

        // Validate status
        let status: SparkStatus;
        switch (statusParam.toLowerCase()) {
            case 'approved':
                status = SparkStatus.APPROVED;
                break;
            case 'rejected':
                status = SparkStatus.REJECTED;
                break;
            case 'pending':
            default:
                status = SparkStatus.PENDING;
                break;
        }


        const take = parseInt(searchParams.get('take') || '50', 10);
        const skip = parseInt(searchParams.get('skip') || '0', 10);

        console.log(`[ADMIN] Fetching ${status} sparks (skip: ${skip}, take: ${take}) accessed by ${session.user.email}`);

        // Fetch sparks
        const sparks = await sparkService.getSparksByStatus(status, take, skip);

        return NextResponse.json(sparks, {
            headers: securityHeaders,
        });
    } catch (error) {
        console.error('Error fetching admin sparks:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: securityHeaders }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch sparks' },
            { status: 500, headers: securityHeaders }
        );
    }
}
