import { NextRequest, NextResponse } from 'next/server';
import { sparkService } from '@/lib/spark-service';
import { requireAuth } from '@/lib/auth-helpers';
import { securityHeaders } from '@/lib/security';

/**
 * POST /api/admin/sparks/[id]/reject
 * Rejects a pending spark, preventing it from appearing on the globe
 * Requirements: 5.3
 * Protected: Requires admin authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const session = await requireAuth();

    // CSRF protection: Verify origin header matches host (if origin is present)
    const origin = request.headers?.get('origin');
    const host = request.headers?.get('host');
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json(
        { error: 'Invalid origin', code: 'CSRF_ERROR' },
        { status: 403, headers: securityHeaders }
      );
    }

    const sparkId = (await params).id;

    // Validate spark ID
    if (!sparkId) {
      return NextResponse.json(
        { error: 'Spark ID is required', code: 'VALIDATION_ERROR' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Reject the spark
    await sparkService.rejectSpark(sparkId);

    // Log moderation action for audit trail
    console.log(`[ADMIN] Spark ${sparkId} rejected by ${session.user.email} at ${new Date().toISOString()}`);

    return NextResponse.json({
      message: 'Spark rejected successfully'
    }, {
      headers: securityHeaders,
    });
  } catch (error) {
    console.error('Error rejecting spark:', error);

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_ERROR' },
        { status: 401, headers: securityHeaders }
      );
    }

    // Handle not found errors (Prisma throws if record doesn't exist)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Spark not found', code: 'NOT_FOUND' },
        { status: 404, headers: securityHeaders }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: 'Failed to reject spark', code: 'REJECT_ERROR' },
      { status: 500, headers: securityHeaders }
    );
  }
}
