import { NextRequest, NextResponse } from 'next/server';
import { sparkService } from '@/lib/spark-service';
import { requireAuth } from '@/lib/auth-helpers';
import { securityHeaders } from '@/lib/security';

/**
 * POST /api/admin/sparks/[id]/approve
 * Approves a pending spark, making it visible on the public globe
 * Requirements: 5.2
 * Protected: Requires admin authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    const sparkId = params.id;
    
    // Validate spark ID
    if (!sparkId) {
      return NextResponse.json(
        { error: 'Spark ID is required', code: 'VALIDATION_ERROR' },
        { status: 400, headers: securityHeaders }
      );
    }
    
    // Approve the spark
    const approvedSpark = await sparkService.approveSpark(sparkId);
    
    // Log moderation action for audit trail
    console.log(`[ADMIN] Spark ${sparkId} approved by ${session.user.email} at ${new Date().toISOString()}`);
    
    return NextResponse.json({
      message: 'Spark approved successfully',
      spark: approvedSpark
    }, {
      headers: securityHeaders,
    });
  } catch (error) {
    console.error('Error approving spark:', error);
    
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
      { error: 'Failed to approve spark', code: 'APPROVE_ERROR' },
      { status: 500, headers: securityHeaders }
    );
  }
}
