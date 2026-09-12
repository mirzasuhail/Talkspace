import { describe, it, expect } from 'vitest';
import { slugify, sanitizeText } from '../middleware/sanitizer';

describe('Room & Sanitizer Utils', () => {
  it('slugifies room names correctly', () => {
    expect(slugify('Late Night Study!')).toBe('late-night-study');
    expect(slugify('   Project   Alpha 123   ')).toBe('project-alpha-123');
    expect(slugify('Special@#$Characters')).toBe('specialcharacters');
  });

  it('sanitizes text inputs to prevent XSS', () => {
    const malicious = '<script>alert("xss")</script>Hello <b>World</b>';
    expect(sanitizeText(malicious)).toBe('Hello World');
  });
});
