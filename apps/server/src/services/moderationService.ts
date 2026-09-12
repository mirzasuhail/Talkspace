import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { redisClient } from '../lib/redis';

export class ModerationService {
  static hashSession(sessionId: string): string {
    return crypto.createHash('sha256').update(sessionId).digest('hex');
  }

  static async banUser(roomId: string, targetSessionId: string, reason?: string) {
    const hash = this.hashSession(targetSessionId);
    await prisma.ban.create({
      data: {
        roomId,
        sessionIdHash: hash,
        reason,
      },
    });

    // Cache in redis/memory
    await redisClient.set(`ban:${roomId}:${hash}`, '1', 'EX', 86400 * 30);
  }

  static async isBanned(roomId: string, sessionId: string): Promise<boolean> {
    const hash = this.hashSession(sessionId);
    const cached = await redisClient.get(`ban:${roomId}:${hash}`);
    if (cached) return true;

    const dbBan = await prisma.ban.findFirst({
      where: {
        roomId,
        sessionIdHash: hash,
      },
    });

    if (dbBan) {
      await redisClient.set(`ban:${roomId}:${hash}`, '1', 'EX', 86400 * 30);
      return true;
    }

    return false;
  }

  static async muteUser(roomId: string, targetSessionId: string, durationSeconds: number = 3600) {
    await redisClient.set(`mute:${roomId}:${targetSessionId}`, '1', 'EX', durationSeconds);
  }

  static async unmuteUser(roomId: string, targetSessionId: string) {
    await redisClient.del(`mute:${roomId}:${targetSessionId}`);
  }

  static async isMuted(roomId: string, sessionId: string): Promise<boolean> {
    const cached = await redisClient.get(`mute:${roomId}:${sessionId}`);
    return !!cached;
  }

  static async reportMessage(roomId: string, messageId: string, reporterSessionId: string, reason: string) {
    return prisma.report.create({
      data: {
        roomId,
        messageId,
        reporterSessionId,
        reason,
      },
    });
  }
}
