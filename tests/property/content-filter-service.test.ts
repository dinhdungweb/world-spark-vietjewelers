import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { ContentFilterService } from '@/lib/content-filter-service';

describe('ContentFilterService Property Tests', () => {
  const contentFilter = new ContentFilterService();

  // Feature: world-spark, Property 3: Content filter detection
  // Validates: Requirements 4.1, 4.2, 4.3, 4.4
  test('Property 3: Content filter detects prohibited content (emails, phones, URLs)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Generate text with valid email addresses that match our regex
          fc.tuple(
            fc.string({ maxLength: 20 }), 
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 10 }),
            fc.constantFrom('gmail', 'yahoo', 'hotmail', 'example', 'test'),
            fc.constantFrom('com', 'org', 'net'),
            fc.string({ maxLength: 20 })
          ).map(
            ([prefix, user, domain, tld, suffix]) => `${prefix} ${user}@${domain}.${tld} ${suffix}`.trim()
          ),
          // Generate text with phone numbers (10 digits)
          fc.tuple(
            fc.string({ maxLength: 20 }), 
            fc.integer({ min: 1000000000, max: 9999999999 }), 
            fc.string({ maxLength: 20 })
          ).map(
            ([prefix, phone, suffix]) => `${prefix} ${phone} ${suffix}`.trim()
          ),
          // Generate text with phone numbers (formatted)
          fc.tuple(
            fc.string({ maxLength: 20 }), 
            fc.integer({ min: 100, max: 999 }), 
            fc.integer({ min: 100, max: 999 }), 
            fc.integer({ min: 1000, max: 9999 }), 
            fc.string({ maxLength: 20 })
          ).map(
            ([prefix, area, exchange, number, suffix]) => `${prefix} ${area}-${exchange}-${number} ${suffix}`.trim()
          ),
          // Generate text with URLs (http/https)
          fc.tuple(
            fc.string({ maxLength: 20 }), 
            fc.webUrl(), 
            fc.string({ maxLength: 20 })
          ).map(
            ([prefix, url, suffix]) => `${prefix} ${url} ${suffix}`.trim()
          ),
          // Generate text with www URLs
          fc.tuple(
            fc.string({ maxLength: 20 }), 
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')), { minLength: 3, maxLength: 15 }),
            fc.constantFrom('com', 'org', 'net', 'io'),
            fc.string({ maxLength: 20 })
          ).map(
            ([prefix, domain, tld, suffix]) => `${prefix} www.${domain}.${tld} ${suffix}`.trim()
          ),
          // Generate text with bare domains (3+ chars)
          fc.tuple(
            fc.string({ maxLength: 20 }), 
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')), { minLength: 3, maxLength: 15 }),
            fc.constantFrom('com', 'org', 'net', 'io'),
            fc.string({ maxLength: 20 })
          ).map(
            ([prefix, domain, tld, suffix]) => `${prefix} ${domain}.${tld} ${suffix}`.trim()
          )
        ),
        (prohibitedText) => {
          const result = contentFilter.validate(prohibitedText);
          
          // Property: Text with prohibited content should be invalid
          expect(result.isValid).toBe(false);
          
          // Property: Should have at least one error message
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Property: Error messages should be specific
          const hasSpecificError = result.errors.some(error => 
            error.includes('email') || 
            error.includes('phone') || 
            error.includes('URL')
          );
          expect(hasSpecificError).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: world-spark, Property 4: Empty text rejection
  // Validates: Requirements 3.6
  test('Property 4: Empty text rejection prevents submission of empty or whitespace-only text', () => {
    fc.assert(
      fc.property(
        // Generate strings that are empty or contain only whitespace
        fc.oneof(
          fc.constant(''),
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
        ),
        (emptyText) => {
          const result = contentFilter.validate(emptyText);
          
          // Property: Empty or whitespace-only text should be invalid
          expect(result.isValid).toBe(false);
          
          // Property: Should have at least one error
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Property: Error should mention empty text
          const hasEmptyError = result.errors.some(error => 
            error.toLowerCase().includes('empty')
          );
          expect(hasEmptyError).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Valid text should pass validation
  test('Property: Valid text without prohibited content should pass validation', () => {
    fc.assert(
      fc.property(
        // Generate text that doesn't contain prohibited patterns
        fc.string({ minLength: 1, maxLength: 500 }).filter(text => {
          // Filter out strings that accidentally contain prohibited content
          const trimmed = text.trim();
          if (trimmed.length === 0) return false;
          
          // Basic check to avoid accidental matches
          return !contentFilter.containsEmail(text) &&
                 !contentFilter.containsPhone(text) &&
                 !contentFilter.containsUrl(text);
        }),
        (validText) => {
          const result = contentFilter.validate(validText);
          
          // Property: Valid text should pass validation
          expect(result.isValid).toBe(true);
          expect(result.errors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
