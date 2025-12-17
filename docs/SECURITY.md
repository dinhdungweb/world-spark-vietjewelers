# Security Measures

This document outlines the security measures implemented in World Spark to protect against common web vulnerabilities.

## Overview

World Spark implements multiple layers of security to protect user data, prevent attacks, and ensure safe operation of the application.

## Security Measures Implemented

### 1. Input Sanitization (XSS Prevention)

**Implementation:** `lib/security.ts`

All user-submitted content is sanitized using DOMPurify to prevent Cross-Site Scripting (XSS) attacks:

- **Text sanitization**: All HTML tags and attributes are stripped from spark text
- **Category sanitization**: Category names are sanitized to prevent injection
- **Coordinate validation**: Numeric validation ensures coordinates are valid numbers

**Usage:**
```typescript
import { sanitizeSparkData } from '@/lib/security';

const sanitizedData = sanitizeSparkData({
  text: userInput.text,
  latitude: userInput.latitude,
  longitude: userInput.longitude,
  category: userInput.category,
});
```

### 2. CSRF Protection

**Implementation:** Admin API routes

Cross-Site Request Forgery (CSRF) protection is implemented for all admin actions:

- **Origin validation**: Verifies that the request origin matches the host
- **Same-origin policy**: Rejects requests from different origins
- **Protected endpoints**: All `/api/admin/*` routes validate origin headers

**Protected Routes:**
- `POST /api/admin/sparks/[id]/approve`
- `POST /api/admin/sparks/[id]/reject`

### 3. Parameterized Queries

**Implementation:** Prisma ORM

All database queries use Prisma ORM, which automatically uses parameterized queries to prevent SQL injection:

```typescript
// Prisma automatically parameterizes all queries
await prisma.spark.create({
  data: {
    text: sanitizedText,
    latitude: lat,
    longitude: lng,
  }
});
```

### 4. HTTP-Only Cookies

**Implementation:** `lib/auth.ts`

Admin session cookies are configured with security best practices:

- **httpOnly**: Prevents JavaScript access to cookies
- **sameSite**: Set to 'lax' to prevent CSRF
- **secure**: Enabled in production (HTTPS only)
- **Session expiry**: 24-hour maximum session duration

**Configuration:**
```typescript
cookies: {
  sessionToken: {
    name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  },
}
```

### 5. Request Size Limits

**Implementation:** `next.config.js`

API request body size is limited to prevent denial-of-service attacks:

- **Body size limit**: 1MB maximum for all API requests
- **Prevents**: Large payload attacks and memory exhaustion

**Configuration:**
```javascript
api: {
  bodyParser: {
    sizeLimit: '1mb',
  },
}
```

### 6. Security Headers

**Implementation:** `next.config.js` and `lib/security.ts`

Multiple security headers are set on all responses:

- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-XSS-Protection**: `1; mode=block` - Enables browser XSS protection
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Permissions-Policy**: Restricts camera, microphone, and geolocation access
- **Content-Security-Policy**: Restricts resource loading (configured in security.ts)

### 7. Rate Limiting

**Implementation:** `lib/rate-limiter.ts`

Spark submissions are rate-limited to prevent spam and abuse:

- **Limit**: 5 submissions per IP address per hour
- **Response**: 429 status code with retry-after header
- **Headers**: X-RateLimit-* headers inform clients of limits

### 8. Authentication & Authorization

**Implementation:** `lib/auth.ts`, `middleware.ts`

Admin routes are protected with NextAuth.js:

- **Password hashing**: bcrypt with 10+ rounds
- **JWT sessions**: Stateless authentication
- **Protected routes**: `/admin/*` and `/api/admin/*` require authentication
- **Audit logging**: All admin actions are logged with timestamps and user emails

### 9. CORS Configuration

**Implementation:** Next.js default configuration

CORS is configured to restrict API access:

- **Same-origin by default**: API routes only accept requests from the same origin
- **No wildcard origins**: Prevents unauthorized cross-origin access
- **Explicit origin validation**: Admin routes validate origin headers

## Additional Security Considerations

### Password Requirements

For admin accounts, ensure strong passwords:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, and symbols
- No common passwords or dictionary words

### Environment Variables

Sensitive configuration is stored in environment variables:
- `DATABASE_URL`: Database connection string
- `NEXTAUTH_SECRET`: Secret for JWT signing (minimum 32 characters)
- Never commit `.env` files to version control

### Database Security

- **Connection pooling**: Prevents connection exhaustion
- **Prepared statements**: Prisma uses parameterized queries
- **Least privilege**: Database user should have minimal required permissions

### Monitoring & Logging

- **Error logging**: All errors are logged with context
- **Audit trail**: Admin actions are logged with timestamps and user emails
- **Rate limit monitoring**: Track rate limit violations

## Security Checklist

- [x] Input sanitization (XSS prevention)
- [x] CSRF protection for admin actions
- [x] Parameterized queries (SQL injection prevention)
- [x] HTTP-only cookies for sessions
- [x] Request size limits
- [x] Security headers
- [x] Rate limiting
- [x] Password hashing (bcrypt)
- [x] Authentication & authorization
- [x] CORS configuration
- [x] Audit logging

## Reporting Security Issues

If you discover a security vulnerability, please email security@vietjewelers.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

Do not publicly disclose security issues until they have been addressed.

## Future Enhancements

Potential security improvements for future versions:

1. **Content Security Policy (CSP)**: More restrictive CSP headers
2. **Subresource Integrity (SRI)**: For CDN resources
3. **Two-Factor Authentication (2FA)**: For admin accounts
4. **IP allowlisting**: Restrict admin access to specific IPs
5. **Automated security scanning**: Regular vulnerability scans
6. **Security headers testing**: Automated testing of security headers
7. **Penetration testing**: Regular security audits
8. **DDoS protection**: Cloudflare or similar service
9. **Database encryption**: Encrypt sensitive data at rest
10. **Secrets rotation**: Automated rotation of API keys and secrets
