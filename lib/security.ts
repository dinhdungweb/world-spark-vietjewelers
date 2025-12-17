/**
 * Security utilities for input sanitization and validation
 * Requirements: All (security)
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * Removes all HTML tags and potentially dangerous content
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Use DOMPurify to sanitize, but strip all HTML tags
  // We only want plain text for sparks
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  });
  
  return sanitized.trim();
}

/**
 * Validate and sanitize spark submission data
 */
export function sanitizeSparkData(data: {
  text: string;
  latitude: number;
  longitude: number;
  category: string;
}): {
  text: string;
  latitude: number;
  longitude: number;
  category: string;
} {
  return {
    text: sanitizeInput(data.text),
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    category: sanitizeInput(data.category),
  };
}

/**
 * Generate a CSRF token for admin actions
 * In production, this should use a more robust implementation
 */
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return token === expectedToken;
}

/**
 * Security headers for API responses
 */
export const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Content Security Policy
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
};
