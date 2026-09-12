import { describe, it, expect } from 'vitest';
import { generateAvatarSvg } from '../lib/avatar';

describe('Frontend Avatar Generator', () => {
  it('generates deterministic SVG data URI for nickname', () => {
    const svg1 = generateAvatarSvg('seed123', 'Alex');
    const svg2 = generateAvatarSvg('seed123', 'Alex');
    expect(svg1).toBe(svg2);
    expect(svg1).toContain('data:image/svg+xml');
    expect(svg1).toContain('A');
  });

  it('handles fallback initials when nickname is empty', () => {
    const svg = generateAvatarSvg('seed456', '');
    expect(svg).toContain('data:image/svg+xml');
    expect(svg).toContain('T');
  });
});
