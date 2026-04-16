/**
 * @jest-environment node
 *
 * Tests for lib/sanitize.ts — input sanitization utilities.
 */

import {
  escapeHtml,
  sanitizeTextInput,
  sanitizeEmail,
  stripControlChars,
  isNonEmptyString,
  isValidSeverity,
  sanitizeChatMessage,
} from '@/lib/sanitize';

describe('escapeHtml', () => {
  it('escapes < and > characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('escapes quotes', () => {
    expect(escapeHtml("it's \"fine\"")).toBe("it&#039;s &quot;fine&quot;");
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('leaves safe text unchanged', () => {
    expect(escapeHtml('Hello, world!')).toBe('Hello, world!');
  });
});

describe('sanitizeTextInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeTextInput('  hello  ')).toBe('hello');
  });

  it('collapses internal whitespace', () => {
    expect(sanitizeTextInput('a   b    c')).toBe('a b c');
  });

  it('truncates to maxLength', () => {
    expect(sanitizeTextInput('abcde', 3)).toBe('abc');
  });

  it('uses default maxLength of 2000', () => {
    const long = 'x'.repeat(3000);
    expect(sanitizeTextInput(long)).toHaveLength(2000);
  });

  it('handles empty string', () => {
    expect(sanitizeTextInput('')).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('validates correct email', () => {
    const result = sanitizeEmail('Test@Example.COM');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('test@example.com');
  });

  it('rejects invalid email', () => {
    expect(sanitizeEmail('not-an-email').valid).toBe(false);
  });

  it('rejects empty string', () => {
    expect(sanitizeEmail('').valid).toBe(false);
  });

  it('trims whitespace', () => {
    const result = sanitizeEmail('  user@test.com  ');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('user@test.com');
  });

  it('lowercases email', () => {
    expect(sanitizeEmail('USER@TEST.COM').sanitized).toBe('user@test.com');
  });
});

describe('stripControlChars', () => {
  it('removes null bytes', () => {
    expect(stripControlChars('hello\x00world')).toBe('helloworld');
  });

  it('preserves newlines and tabs', () => {
    expect(stripControlChars('hello\n\tworld')).toBe('hello\n\tworld');
  });

  it('removes BEL character', () => {
    expect(stripControlChars('test\x07value')).toBe('testvalue');
  });

  it('handles empty string', () => {
    expect(stripControlChars('')).toBe('');
  });
});

describe('isNonEmptyString', () => {
  it('returns true for non-empty string', () => {
    expect(isNonEmptyString('hello')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isNonEmptyString('')).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(isNonEmptyString('   ')).toBe(false);
  });

  it('returns false for number', () => {
    expect(isNonEmptyString(123)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isNonEmptyString(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isNonEmptyString(undefined)).toBe(false);
  });
});

describe('isValidSeverity', () => {
  it('accepts info', () => {
    expect(isValidSeverity('info')).toBe(true);
  });

  it('accepts warning', () => {
    expect(isValidSeverity('warning')).toBe(true);
  });

  it('accepts critical', () => {
    expect(isValidSeverity('critical')).toBe(true);
  });

  it('rejects unknown severity', () => {
    expect(isValidSeverity('danger')).toBe(false);
  });

  it('rejects non-string', () => {
    expect(isValidSeverity(123)).toBe(false);
  });
});

describe('sanitizeChatMessage', () => {
  it('strips control chars and trims', () => {
    expect(sanitizeChatMessage('  hello\x00world  ')).toBe('helloworld');
  });

  it('collapses whitespace', () => {
    expect(sanitizeChatMessage('a    b')).toBe('a b');
  });

  it('respects maxLength', () => {
    expect(sanitizeChatMessage('abcdefghij', 5)).toBe('abcde');
  });
});
