/**
 * Content sanitization utilities
 * Protects against XSS attacks by sanitizing user-generated content
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes potentially dangerous tags and attributes
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text content
 * Strips all HTML tags and returns plain text
 */
export function sanitizePlainText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize thought content for display
 * Allows basic formatting but removes dangerous content
 */
export function sanitizeThoughtContent(content: string): string {
  // For now, treat all thought content as plain text
  // In the future, we could allow basic markdown
  return sanitizePlainText(content);
}

/**
 * Validate and sanitize category name
 * Category names should be simple alphanumeric strings with basic punctuation
 */
export function sanitizeCategoryName(name: string): string {
  // Remove HTML
  const cleaned = sanitizePlainText(name);
  
  // Trim whitespace
  const trimmed = cleaned.trim();
  
  // Limit length
  const maxLength = 50;
  return trimmed.substring(0, maxLength);
}

/**
 * Validate and sanitize cluster name
 * Cluster names should be simple strings
 */
export function sanitizeClusterName(name: string): string {
  // Remove HTML
  const cleaned = sanitizePlainText(name);
  
  // Trim whitespace
  const trimmed = cleaned.trim();
  
  // Limit length
  const maxLength = 100;
  return trimmed.substring(0, maxLength);
}
