import { NextRequest, NextResponse } from 'next/server';
import { sparkService } from '@/lib/spark-service';
import { sparkRateLimiter } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/ip-utils';
import { sanitizeSparkData, securityHeaders } from '@/lib/security';

export async function GET() {
  try {
    const sparks = await sparkService.getApprovedSparks();
    return NextResponse.json(sparks, { headers: securityHeaders });
  } catch (error) {
    console.error('Error fetching sparks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sparks', code: 'FETCH_ERROR' },
      { status: 500, headers: securityHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const isAllowed = sparkRateLimiter.check(clientIp);

    if (!isAllowed) {
      const resetTime = sparkRateLimiter.getResetTime(clientIp);
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
        {
          status: 429,
          headers: {
            'Retry-After': resetTime.toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + resetTime * 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();

    if (!body.text || body.latitude == null || body.longitude == null || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400, headers: securityHeaders }
      );
    }

    const sanitizedData = sanitizeSparkData({
      text: body.text,
      latitude: body.latitude,
      longitude: body.longitude,
      category: body.category,
    });

    if (sanitizedData.latitude < -90 || sanitizedData.latitude > 90) {
      return NextResponse.json(
        { error: 'Invalid latitude', code: 'VALIDATION_ERROR' },
        { status: 400, headers: securityHeaders }
      );
    }

    if (sanitizedData.longitude < -180 || sanitizedData.longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid longitude', code: 'VALIDATION_ERROR' },
        { status: 400, headers: securityHeaders }
      );
    }

    const spark = await sparkService.createSpark(sanitizedData);
    const remaining = sparkRateLimiter.getRemaining(clientIp);
    const resetTime = sparkRateLimiter.getResetTime(clientIp);

    return NextResponse.json(
      { message: 'Spark submitted successfully', spark },
      {
        status: 201,
        headers: {
          ...securityHeaders,
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': (Date.now() + resetTime * 1000).toString(),
        },
      }
    );
  } catch (error) {
    console.error('Error creating spark:', error);

    if (error instanceof Error && error.message.includes('cannot contain')) {
      return NextResponse.json(
        { error: error.message, code: 'CONTENT_FILTER_ERROR' },
        { status: 400, headers: securityHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create spark', code: 'CREATE_ERROR' },
      { status: 500, headers: securityHeaders }
    );
  }
}
