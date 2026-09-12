import { redisClient } from '../lib/redis';
import { RoomMember } from '@talksy/shared';
import { prisma } from '../lib/prisma';
import { RoomService } from '../services/roomService';

export class PresenceManager {
  private static userSockets = new Map<string, Set<string>>(); // sessionId -> Set<socketId>
  private static socketSessions = new Map<string, { sessionId: string; roomSlug: string }>();
  private static roomDisconnectTimers = new Map<string, NodeJS.Timeout>();

  static async addMember(roomSlug: string, sessionId: string, socketId: string, isOwner: boolean) {
    // If a room destruction grace timer is pending, cancel it!
    const pendingTimer = this.roomDisconnectTimers.get(roomSlug);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.roomDisconnectTimers.delete(roomSlug);
      console.log(`[Talksy Lifecycle] Room #${roomSlug} re-joined. Disconnect grace timer cancelled.`);
    }

    let set = this.userSockets.get(sessionId);
    if (!set) {
      set = new Set();
      this.userSockets.set(sessionId, set);
    }
    set.add(socketId);

    this.socketSessions.set(socketId, { sessionId, roomSlug });

    await redisClient.sadd(`room:online:${roomSlug}`, sessionId);
  }

  static async removeMember(socketId: string) {
    const sessionInfo = this.socketSessions.get(socketId);
    if (!sessionInfo) return null;

    const { sessionId, roomSlug } = sessionInfo;
    this.socketSessions.delete(socketId);

    const set = this.userSockets.get(sessionId);
    if (set) {
      set.delete(socketId);
      if (set.size === 0) {
        this.userSockets.delete(sessionId);
        await redisClient.srem(`room:online:${roomSlug}`, sessionId);
        await this.stopTyping(roomSlug, sessionId);
      }
    }

    // Check remaining online count for room
    const remainingCount = await this.getOnlineCount(roomSlug);
    if (remainingCount === 0) {
      this.scheduleRoomDestruction(roomSlug);
    }

    return { sessionId, roomSlug, remainingCount };
  }

  private static scheduleRoomDestruction(roomSlug: string) {
    if (this.roomDisconnectTimers.has(roomSlug)) return;

    console.log(`[Talksy Lifecycle] Room #${roomSlug} is empty. Scheduling destruction in 10 seconds...`);

    const timer = setTimeout(async () => {
      this.roomDisconnectTimers.delete(roomSlug);
      const activeCount = await this.getOnlineCount(roomSlug);
      if (activeCount === 0) {
        const roomResult = await RoomService.getRoomBySlug(roomSlug);
        if (roomResult && roomResult.room) {
          await RoomService.destroyRoomCascade(roomResult.room.id, roomSlug);
        }
      }
    }, 10000); // 10-second disconnect grace period

    this.roomDisconnectTimers.set(roomSlug, timer);
  }

  static async getOnlineMembers(roomSlug: string, ownerSessionId: string): Promise<RoomMember[]> {
    const sessionIds = await redisClient.smembers(`room:online:${roomSlug}`);
    if (sessionIds.length === 0) return [];

    const sessions = await prisma.session.findMany({
      where: { id: { in: sessionIds } },
    });

    return sessions.map((s: any) => ({
      sessionId: s.id,
      nickname: s.nickname,
      avatarSeed: s.avatarSeed,
      isOwner: s.id === ownerSessionId,
      isMuted: false,
      joinedAt: s.createdAt.toISOString(),
    }));
  }

  static async getOnlineCount(roomSlug: string): Promise<number> {
    return redisClient.scard(`room:online:${roomSlug}`);
  }

  static async startTyping(roomSlug: string, sessionId: string) {
    await redisClient.set(`typing:${roomSlug}:${sessionId}`, '1', 'EX', 4);
  }

  static async stopTyping(roomSlug: string, sessionId: string) {
    await redisClient.del(`typing:${roomSlug}:${sessionId}`);
  }

  static async getTypingUsers(roomSlug: string): Promise<{ sessionId: string; nickname: string }[]> {
    const sessionIds = await redisClient.smembers(`room:online:${roomSlug}`);
    const typingUsers: { sessionId: string; nickname: string }[] = [];

    for (const sId of sessionIds) {
      const isTyping = await redisClient.get(`typing:${roomSlug}:${sId}`);
      if (isTyping) {
        const session = await prisma.session.findUnique({ where: { id: sId } });
        if (session) {
          typingUsers.push({ sessionId: session.id, nickname: session.nickname });
        }
      }
    }

    return typingUsers;
  }
}
