import crypto from 'crypto';
import sharp from 'sharp';
import { prisma } from '../lib/prisma';
import { StorageService } from './storageService';
import { UploadResponse } from '@talksy/shared';

export class ImageService {
  static validateMagicNumber(buffer: Buffer): { isValid: boolean; mimeType: string } {
    if (buffer.length < 4) return { isValid: false, mimeType: '' };

    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return { isValid: true, mimeType: 'image/png' };
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { isValid: true, mimeType: 'image/jpeg' };
    }
    // GIF: 47 49 46 38
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return { isValid: true, mimeType: 'image/gif' };
    }
    // WEBP: 52 49 46 46 ... 57 45 42 50
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer.length >= 12 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return { isValid: true, mimeType: 'image/webp' };
    }

    return { isValid: false, mimeType: '' };
  }

  static async processAndStore(fileBuffer: Buffer, roomId?: string): Promise<UploadResponse> {
    // 1. Validate magic bytes
    const validation = this.validateMagicNumber(fileBuffer);
    if (!validation.isValid) {
      throw new Error('Unsupported image format. Allowed: JPEG, PNG, WebP, GIF.');
    }

    // 2. Generate unique storage object keys (e.g. rooms/{roomId}/images/{uuid}.webp)
    const uuid = crypto.randomUUID();
    const folder = roomId ? `rooms/${roomId}` : `uploads`;
    const mainStorageKey = `${folder}/images/${uuid}.webp`;
    const thumbStorageKey = `${folder}/thumbnails/${uuid}_thumb.webp`;

    // 3. Process main image with sharp (strip EXIF, convert to WebP, resize if > 2560px)
    const pipeline = sharp(fileBuffer);
    const metadata = await pipeline.metadata();

    const originalWidth = metadata.width || 1200;
    const originalHeight = metadata.height || 800;

    let processedPipeline = pipeline.rotate().withMetadata({ exif: undefined });

    if (originalWidth > 2560 || originalHeight > 2560) {
      processedPipeline = processedPipeline.resize(2560, 2560, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const processedBuffer = await processedPipeline.webp({ quality: 82 }).toBuffer();

    // 4. Generate thumbnail (max 400px width/height)
    const thumbBuffer = await sharp(fileBuffer)
      .rotate()
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    // 5. Upload to Supabase Storage (or local dev fallback)
    await StorageService.uploadBuffer(mainStorageKey, processedBuffer, 'image/webp');
    await StorageService.uploadBuffer(thumbStorageKey, thumbBuffer, 'image/webp');

    // 6. Store metadata record in Database
    const uploadRecord = await prisma.upload.create({
      data: {
        storageKey: mainStorageKey,
        thumbnailKey: thumbStorageKey,
        mimeType: 'image/webp',
        size: processedBuffer.length,
        width: originalWidth,
        height: originalHeight,
      },
    });

    const publicBase = `/api/uploads/files`;

    return {
      id: uploadRecord.id,
      storageKey: uploadRecord.storageKey,
      thumbnailKey: uploadRecord.thumbnailKey,
      mimeType: uploadRecord.mimeType,
      size: uploadRecord.size,
      width: uploadRecord.width,
      height: uploadRecord.height,
      url: `${publicBase}?key=${encodeURIComponent(uploadRecord.storageKey)}`,
      thumbnailUrl: `${publicBase}?key=${encodeURIComponent(uploadRecord.thumbnailKey)}`,
    };
  }
}
