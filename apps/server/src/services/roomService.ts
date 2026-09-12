import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { redisClient } from '../lib/redis';
import { CONFIG } from '../config';
import { slugify, sanitizeText } from '../middleware/sanitizer';
import { CreateRoomDTO, RoomExpiration } from '@talksy/shared';

export class RoomService {
  private static calculateExpiresAt(expiration?: RoomExpiration): Date | null {
    if (!expiration || expiration === 'never') return null;
    const now = new Date();
    if (expiration === '1h') return new Date(now.getTime() + 60 * 60 * 1000);
    if (expiration === '24h') return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (expiration === '7d') return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return null;
  }

  static async checkRoomExists(slug: string) {
    const safeSlug = slugify(slug);
    if (!safeSlug) return { exists: false, isExpired: false, isPasswordProtected: false };

    const room = await prisma.room.findUnique({
      where: { slug: safeSlug },
    });

    if (!room) return { exists: false, isExpired: false, isPasswordProtected: false };

    const isExpired = !!(room.expiresAt && new Date() > room.expiresAt);
    return {
      exists: !isExpired,
      isExpired,
      isPasswordProtected: !!room.passwordHash,
      name: room.name,
    };
  }

  static async createRoom(dto: CreateRoomDTO, ownerSessionId: string) {
    const rawSlug = dto.slug || dto.name;
    let baseSlug = slugify(rawSlug);
    if (!baseSlug) baseSlug = `room-${Math.floor(1000 + Math.random() * 9000)}`;

    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.room.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const name = sanitizeText(dto.name || finalSlug).substring(0, 50);
    const description = dto.description ? sanitizeText(dto.description).substring(0, 200) : null;
    const visibility = dto.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
    const expiresAt = this.calculateExpiresAt(dto.expiration);

    let passwordHash: string | null = null;
    if (visibility === 'PRIVATE' && dto.password && dto.password.trim()) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const room = await prisma.room.create({
      data: {
        slug: finalSlug,
        name,
        description,
        visibility,
        passwordHash,
        ownerSessionId,
        expiresAt,
      },
    });

    return room;
  }

  static async getRoomBySlug(slug: string) {
    const safeSlug = slugify(slug);
    const room = await prisma.room.findUnique({
      where: { slug: safeSlug },
    });

    if (!room) return null;

    if (room.expiresAt && new Date() > room.expiresAt) {
      return { room, isExpired: true };
    }

    return { room, isExpired: false };
  }

  static async verifyPassword(roomSlug: string, passwordInput: string): Promise<boolean> {
    const safeSlug = slugify(roomSlug);
    const room = await prisma.room.findUnique({ where: { slug: safeSlug } });
    if (!room || !room.passwordHash) return false;
    return bcrypt.compare(passwordInput, room.passwordHash);
  }

  static async isOwner(roomSlug: string, sessionId: string): Promise<boolean> {
    const safeSlug = slugify(roomSlug);
    const room = await prisma.room.findUnique({ where: { slug: safeSlug } });
    return room ? room.ownerSessionId === sessionId : false;
  }

  static async destroyRoomCascade(roomId: string, slug: string) {
    console.log(`[Talksy Lifecycle] Destroying empty room #${slug} (${roomId})...`);

    // 1. Find all associated upload file keys to clean up from disk
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: { uploads: true },
    });

    for (const m of messages) {
      for (const u of m.uploads) {
        try {
          const mainPath = path.join(CONFIG.UPLOAD_DIR, u.storageKey);
          const thumbPath = path.join(CONFIG.UPLOAD_DIR, 'thumbnails', u.thumbnailKey);
          if (fs.existsSync(mainPath)) fs.unlinkSync(mainPath);
          if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        } catch (err: any) {
          console.warn(`[File Delete Warning] Could not remove file ${u.storageKey}:`, err.message);
        }
      }
    }

    // 2. Cascade delete room from DB (Prisma cascade deletes messages, reactions, uploads, bans, reports)
    try {
      await prisma.room.delete({
        where: { id: roomId },
      });
    } catch (err: any) {
      console.warn(`[Room Delete Warning] ${err.message}`);
    }

    // 3. Clear Redis ephemeral state
    await redisClient.del(`room:online:${slug}`);
  }
}
