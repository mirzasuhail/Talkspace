import fs from 'fs';
import { buildApp } from './app';
import { CONFIG } from './config';
import { setupSocketServer } from './websocket/socketServer';
import { prisma } from './lib/prisma';

import { StorageService } from './services/storageService';

async function start() {
  if (!StorageService.isConfigured() && CONFIG.NODE_ENV === 'development') {
    try {
      if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
        fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
      }
    } catch (err: any) {
      console.warn(`[Local Storage Notice] Could not create local upload dir ${CONFIG.UPLOAD_DIR}:`, err.message);
    }
  }


  const app = buildApp();

  try {
    const address = await app.listen({ port: CONFIG.PORT, host: CONFIG.HOST });
    console.log(`[Talksy Server] Running at ${address}`);

    const httpServer = app.server;
    setupSocketServer(httpServer);
    console.log(`[Talksy WebSocket Gateway] Listening for real-time connections.`);
  } catch (err) {
    console.error('[Talksy Startup Error]', err);
    process.exit(1);
  }
}

// Graceful Shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
