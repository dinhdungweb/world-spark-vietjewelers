/**
 * ContentFilterService validates spark text content to prevent spam
 * and maintain content quality by detecting prohibited patterns.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ContentFilterService {
  // Email regex pattern - matches common email formats
  private readonly emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  
  // Phone number regex - matches various phone formats
  // Matches patterns like: 123-456-7890, (123) 456-7890, 123.456.7890, +1234567890, etc.
  private readonly phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,}/;
  
  // URL regex - matches http(s) URLs and common domain patterns
  // Balanced approach: requires minimum 3 chars before dot to avoid false positives like "a.aa"
  private readonly urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]{3,}\.(com|org|net|edu|gov|io|co|uk|de|fr|jp|cn|au|ca|in|br|ru|nl|se|no|dk|fi|pl|es|it|ch|at|be|nz|sg|hk|kr|tw|mx|ar|cl|za)[^\s]*)/i;

  /**
   * Checks if text contains an email address
   */
  containsEmail(text: string): boolean {
    return this.emailRegex.test(text);
  }

  /**
   * Checks if text contains a phone number
   */
  containsPhone(text: string): boolean {
    return this.phoneRegex.test(text);
  }

  /**
   * Checks if text contains a URL
   */
  containsUrl(text: string): boolean {
    return this.urlRegex.test(text);
  }

  /**
   * Validates spark text against all content filter rules
   * Returns validation result with specific error messages
   */
  validate(text: string): ValidationResult {
    const errors: string[] = [];

    // Check for empty or whitespace-only text
    if (!text || text.trim().length === 0) {
      errors.push('Spark text cannot be empty');
    }

    // Check for prohibited content
    if (this.containsEmail(text)) {
      errors.push('Spark text cannot contain email addresses');
    }

    if (this.containsPhone(text)) {
      errors.push('Spark text cannot contain phone numbers');
    }

    if (this.containsUrl(text)) {
      errors.push('Spark text cannot contain URLs');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const contentFilterService = new ContentFilterService();
