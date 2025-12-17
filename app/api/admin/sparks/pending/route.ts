import { NextResponse } from 'next/server';
import { sparkService } from '@/lib/spark-service';
import { requireAuth } from '@/lib/auth-helpers';
import { securityHeaders } from '@/lib/security';

/**
 * GET /api/admin/sparks/pending
 * Fetches all pending sparks for admin moderation
 * Requirements: 5.1
 * Protected: Requires admin authentication
 */
export async function GET() {
  try {
    // Verify admin authentication
    const session = await requireAuth();
    
    // Log access for audit trail
    console.log(`[ADMIN] Pending sparks accessed by ${session.user.email} at ${new Date().toISOString()}`);
    
    // Fetch pending sparks
    const pendingSparks = await sparkService.getPendingSparks();
    
    return NextResponse.json(pendingSparks, {
      headers: securityHeaders,
    });
  } catch (error) {
    console.error('Error fetching pending sparks:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_ERROR' },
        { status: 401, headers: securityHeaders }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: 'Failed to fetch pending sparks', code: 'FETCH_ERROR' },
      { status: 500, headers: securityHeaders }
    );
  }
}
