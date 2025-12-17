/**
 * IP Address Utilities
 * Helper functions for extracting client IP addresses from requests
 */

import { NextRequest } from 'next/server';

/**
 * Extract the client IP address from a Next.js request
 * Handles various proxy scenarios (Vercel, Cloudflare, etc.)
 * 
 * @param request - Next.js request object
 * @returns IP address string, or 'unknown' if unable to determine
 */
export function getClientIp(request: NextRequest): string {
  // Try various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    if (ips[0]) {
      return ips[0];
    }
  }

  // Vercel-specific header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Cloudflare header
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to connection remote address (may not be available in all environments)
  // In serverless environments, this might not work
  return 'unknown';
}
