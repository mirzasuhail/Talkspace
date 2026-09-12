import { FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import fs from 'fs';
import { ImageService } from '../services/imageService';
import { StorageService } from '../services/storageService';
import { CONFIG } from '../config';
import { rateLimitMiddleware } from '../middleware/rateLimiter';

export class UploadController {
  static async uploadImage(req: FastifyRequest, reply: FastifyReply) {
    await rateLimitMiddleware(req, reply, 15, 60);

    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ error: 'Bad Request', message: 'No image file uploaded.' });
    }

    try {
      const buffer = await data.toBuffer();
      if (buffer.length > CONFIG.MAX_FILE_SIZE_BYTES) {
        return reply.status(400).send({
          error: 'File Too Large',
          message: `Image exceeds maximum size of ${CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
        });
      }

      // Extract optional roomId from form fields if present
      const fields = data.fields as any;
      const roomId = fields?.roomId?.value || fields?.roomId || undefined;

      const uploadResult = await ImageService.processAndStore(buffer, roomId);
      return reply.send(uploadResult);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Upload Failed', message: err.message || 'Could not process image.' });
    }
  }

  static async serveFile(
    req: FastifyRequest<{ Params: { fileKey?: string }; Querystring: { key?: string } }>,
    reply: FastifyReply
  ) {
    const rawKey = req.query?.key || req.params?.fileKey;
    if (!rawKey) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Missing storage key.' });
    }

    const targetKey = decodeURIComponent(rawKey);

    if (StorageService.isConfigured()) {
      const signedUrl = await StorageService.getSignedUrl(targetKey, 3600);
      if (signedUrl) {
        reply.header('Cache-Control', 'private, max-age=300');
        return reply.redirect(302, signedUrl);
      }
      return reply.status(404).send({ error: 'Not Found', message: 'Image object not found in Supabase Storage.' });
    } else {
      // Local development fallback
      const safeKey = targetKey.includes('thumbnails')
        ? path.basename(targetKey)
        : path.basename(targetKey);

      let filePath = path.join(CONFIG.UPLOAD_DIR, targetKey.replace(/\//g, '_'));
      if (!fs.existsSync(filePath)) {
        filePath = path.join(CONFIG.UPLOAD_DIR, safeKey);
      }
      if (!fs.existsSync(filePath) && targetKey.includes('thumbnails')) {
        filePath = path.join(CONFIG.UPLOAD_DIR, 'thumbnails', safeKey);
      }

      if (!fs.existsSync(filePath)) {
        return reply.status(404).send({ error: 'Not Found', message: 'Local image file not found.' });
      }

      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      reply.type('image/webp');
      return reply.send(fs.createReadStream(filePath));
    }
  }

  static async serveThumbnail(
    req: FastifyRequest<{ Params: { thumbKey: string }; Querystring: { key?: string } }>,
    reply: FastifyReply
  ) {
    return UploadController.serveFile(req as any, reply);
  }
}
