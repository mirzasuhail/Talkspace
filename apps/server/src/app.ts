import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { CONFIG } from './config';
import { RoomController } from './controllers/roomController';
import { SessionController } from './controllers/sessionController';
import { UploadController } from './controllers/uploadController';
import { MessageController } from './controllers/messageController';

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: CONFIG.NODE_ENV === 'development',
  });

  // Plugins
  const allowedOrigins =
    CONFIG.ALLOWED_ORIGIN === '*'
      ? true
      : [CONFIG.ALLOWED_ORIGIN, CONFIG.PUBLIC_WEB_URL, 'http://localhost:3000'].filter(Boolean);

  app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });

  app.register(helmet, {
    contentSecurityPolicy: false, // Disabled for serving local media files seamlessly
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  app.register(multipart, {
    limits: {
      fileSize: CONFIG.MAX_FILE_SIZE_BYTES,
      files: 1,
    },
  });

  // Static directory for uploaded files
  app.register(fastifyStatic, {
    root: CONFIG.UPLOAD_DIR,
    prefix: '/api/uploads/files/',
  });

  // Health check endpoint
  app.get('/api/health', async () => {
    return { status: 'ok', service: 'Talksy API', timestamp: new Date().toISOString() };
  });

  // REST API Routes
  app.get('/api/rooms/:slug/check', RoomController.checkRoomExists);
  app.post('/api/rooms', RoomController.createRoom);
  app.get('/api/rooms/:slug', RoomController.getRoomBySlug);
  app.post('/api/rooms/:slug/verify', RoomController.verifyPassword);

  app.post('/api/sessions', SessionController.getOrCreateSession);
  app.patch('/api/sessions/:id/nickname', SessionController.updateNickname);

  app.post('/api/uploads', UploadController.uploadImage);
  app.get('/api/uploads/thumbnails/:thumbKey', UploadController.serveThumbnail);
  app.get('/api/uploads/:fileKey', UploadController.serveFile);

  app.get('/api/rooms/:slug/messages', MessageController.getRoomMessages);
  app.post('/api/messages/:messageId/report', MessageController.reportMessage);

  return app;
}
