import { describe, it, expect } from 'vitest';
import { ImageService } from '../services/imageService';

describe('Image Signature Validation', () => {
  it('validates PNG header correctly', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = ImageService.validateMagicNumber(pngHeader);
    expect(res.isValid).toBe(true);
    expect(res.mimeType).toBe('image/png');
  });

  it('validates JPEG header correctly', () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const res = ImageService.validateMagicNumber(jpegHeader);
    expect(res.isValid).toBe(true);
    expect(res.mimeType).toBe('image/jpeg');
  });

  it('rejects executable / invalid binary files', () => {
    const exeBuffer = Buffer.from('MZ90000300000004000000ffff', 'hex');
    const res = ImageService.validateMagicNumber(exeBuffer);
    expect(res.isValid).toBe(false);
  });
});
