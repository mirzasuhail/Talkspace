import { FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import fs from 'fs';
import { ImageService } from '../services/imageService';
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
        return reply.status(400).send({ error: 'File Too Large', message: `Image exceeds maximum size of ${CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.` });
      }

      const uploadResult = await ImageService.processAndStore(buffer);
      return reply.send(uploadResult);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Upload Failed', message: err.message || 'Could not process image.' });
    }
  }

  static async serveFile(req: FastifyRequest<{ Params: { fileKey: string } }>, reply: FastifyReply) {
    const { fileKey } = req.params;
    const safeKey = path.basename(fileKey);
    const filePath = path.join(CONFIG.UPLOAD_DIR, safeKey);

    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'Not Found', message: 'Image file not found.' });
    }

    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    reply.type('image/webp');
    return reply.send(fs.createReadStream(filePath));
  }

  static async serveThumbnail(req: FastifyRequest<{ Params: { thumbKey: string } }>, reply: FastifyReply) {
    const { thumbKey } = req.params;
    const safeKey = path.basename(thumbKey);
    const filePath = path.join(CONFIG.UPLOAD_DIR, 'thumbnails', safeKey);

    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'Not Found', message: 'Thumbnail file not found.' });
    }

    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    reply.type('image/webp');
    return reply.send(fs.createReadStream(filePath));
  }
}
