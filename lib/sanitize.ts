/**
 * lib/sanitize.ts
 *
 * Shared input sanitization and validation utilities for NexArena.
 * Used across API routes and client components to prevent XSS,
 * injection attacks, and malformed input.
 *
 * ✅ Zero external dependencies
 * ✅ Isomorphic — works in both Node.js and browser
 * ✅ Composable — chain sanitizers for different contexts
 */

/**
 * Escape HTML special characters to prevent XSS injection.
 *
 * @param input - Raw string that may contain HTML characters
 * @returns Escaped string safe for insertion into HTML
 *
 * @example
 * ```ts
 * escapeHtml('<script>alert("xss")</script>')
 * // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize user text input: trim whitespace, collapse internal whitespace,
 * and enforce a maximum length.
 *
 * @param input - Raw user input string
 * @param maxLength - Maximum allowed length (default 2000)
 * @returns Cleaned, truncated string
 */
export function sanitizeTextInput(input: string, maxLength = 2000): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

/**
 * Validate and sanitize an email address.
 * Performs basic format check and normalisation.
 *
 * @param email - Raw email string
 * @returns Object with `valid` boolean and `sanitized` email string
 */
export function sanitizeEmail(email: string): { valid: boolean; sanitized: string } {
  const trimmed = email.trim().toLowerCase();
  // RFC 5322 simplified pattern — covers 99%+ of real-world emails
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  return {
    valid: emailPattern.test(trimmed),
    sanitized: trimmed,
  };
}

/**
 * Strip control characters from a string.
 * Preserves newlines and tabs but removes null bytes, BEL, etc.
 *
 * @param input - Raw string potentially containing control characters
 * @returns Cleaned string
 */
export function stripControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate that a value is a non-empty string.
 *
 * @param value - Value to check
 * @returns True if value is a non-empty string after trimming
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate that a value is a valid severity level for alerts.
 *
 * @param value - Value to check
 * @returns True if value is one of the valid severity levels
 */
export function isValidSeverity(value: unknown): value is 'info' | 'warning' | 'critical' {
  return typeof value === 'string' && ['info', 'warning', 'critical'].includes(value);
}

/**
 * Sanitize a full chat message payload — combines text sanitization
 * with control character stripping.
 *
 * @param message - Raw message from user
 * @param maxLength - Maximum allowed message length
 * @returns Sanitized message ready for processing
 */
export function sanitizeChatMessage(message: string, maxLength = 2000): string {
  return sanitizeTextInput(stripControlChars(message), maxLength);
}
