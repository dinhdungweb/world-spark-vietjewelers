# Rate Limiting

## Overview

World Spark implements IP-based rate limiting on spark submissions to prevent spam and abuse. This ensures the moderation queue remains manageable and the service remains available for all users.

## Configuration

- **Limit**: 5 submissions per IP address
- **Time Window**: 1 hour (3600 seconds)
- **Scope**: Only applies to POST /api/sparks endpoint (spark submissions)

## Implementation

### Components

1. **RateLimiter** (`lib/rate-limiter.ts`)
   - In-memory store tracking submission counts per IP
   - Automatic cleanup of expired entries
   - Configurable limits and time windows

2. **IP Extraction** (`lib/ip-utils.ts`)
   - Extracts client IP from various proxy headers
   - Supports Vercel, Cloudflare, and standard proxy configurations
   - Fallback to 'unknown' if IP cannot be determined

3. **API Integration** (`app/api/sparks/route.ts`)
   - Rate limit check before processing submission
   - Returns 429 status code when limit exceeded
   - Includes rate limit headers in all responses

## Response Headers

All responses from POST /api/sparks include rate limit information:

- `X-RateLimit-Limit`: Maximum requests allowed (5)
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

When rate limit is exceeded (429 response):
- `Retry-After`: Seconds until the limit resets

## Error Response

When rate limit is exceeded, the API returns:

```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": "Too many submissions. Try again in 3456 seconds."
}
```

Status Code: `429 Too Many Requests`

## Testing

Rate limiting is tested at multiple levels:

1. **Unit Tests** (`tests/unit/rate-limiter.test.ts`)
   - Core rate limiter logic
   - Time window expiration
   - Cleanup functionality

2. **IP Extraction Tests** (`tests/unit/ip-utils.test.ts`)
   - Header parsing
   - Priority order
   - Fallback behavior

3. **Integration Tests** (`tests/unit/api-sparks-rate-limit.test.ts`)
   - End-to-end rate limiting behavior
   - Response headers
   - Multiple IP tracking

## Production Considerations

### Memory Management

The rate limiter uses an in-memory store that automatically cleans up expired entries every 10 minutes. In a serverless environment (like Vercel), each function instance maintains its own rate limit state.

### Scaling

For high-traffic scenarios or multi-instance deployments, consider:
- Using a distributed cache (Redis, Memcached)
- Implementing rate limiting at the CDN/proxy level
- Adjusting limits based on usage patterns

### Bypass for Testing

In test environments, the rate limiter can be cleared using:

```typescript
import { sparkRateLimiter } from '@/lib/rate-limiter';

// Clear all rate limit data
sparkRateLimiter.clear();
```

## Future Enhancements

Potential improvements to the rate limiting system:

- Per-user rate limits (for authenticated users)
- Dynamic rate limits based on behavior
- Whitelist/blacklist functionality
- Rate limit metrics and monitoring
- Distributed rate limiting with Redis
