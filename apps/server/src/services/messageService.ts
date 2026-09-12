import { prisma } from '../lib/prisma';
import { sanitizeMarkdown } from '../middleware/sanitizer';
import { Message, MessageType, ReactionSummary } from '@talksy/shared';
import { CONFIG } from '../config';
import { StorageService } from './storageService';


export class MessageService {
  static async getRoomMessages(roomId: string, limit: number = 100, currentSessionId?: string): Promise<Message[]> {
    const rawMessages = await prisma.message.findMany({
      where: {
        roomId,
        deletedAt: null,
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        session: true,
        uploads: true,
        reactions: true,
        replyTo: {
          include: {
            session: true,
          },
        },
      },
    });

    const publicBase = `/api/uploads`;

    return rawMessages.map((m: any) => {
      // Group reactions
      const reactionMap = new Map<string, { count: number; sessionIds: string[]; userReacted: boolean }>();
      for (const r of m.reactions) {
        let entry = reactionMap.get(r.emoji);
        if (!entry) {
          entry = { count: 0, sessionIds: [], userReacted: false };
          reactionMap.set(r.emoji, entry);
        }
        entry.count++;
        entry.sessionIds.push(r.sessionId);
        if (currentSessionId && r.sessionId === currentSessionId) {
          entry.userReacted = true;
        }
      }

      const reactionsSummary: ReactionSummary[] = Array.from(reactionMap.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        sessionIds: data.sessionIds,
        userReacted: data.userReacted,
      }));

      const uploads = m.uploads.map((u: any) => ({
        id: u.id,
        messageId: u.messageId,
        storageKey: u.storageKey,
        thumbnailKey: u.thumbnailKey,
        mimeType: u.mimeType,
        size: u.size,
        width: u.width,
        height: u.height,
        url: `/api/uploads/files?key=${encodeURIComponent(u.storageKey)}`,
        thumbnailUrl: `/api/uploads/files?key=${encodeURIComponent(u.thumbnailKey)}`,

        createdAt: u.createdAt.toISOString(),
      }));

      return {
        id: m.id,
        roomId: m.roomId,
        sessionId: m.sessionId,
        senderNickname: m.session.nickname,
        senderAvatarSeed: m.session.avatarSeed,
        type: m.type as MessageType,
        content: m.content,
        replyToId: m.replyToId,
        replyTo: m.replyTo
          ? {
              id: m.replyTo.id,
              senderNickname: m.replyTo.session.nickname,
              content: m.replyTo.content,
              type: m.replyTo.type as MessageType,
            }
          : null,
        uploads,
        reactions: reactionsSummary,
        isEdited: m.updatedAt > m.createdAt,
        deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        isSelf: currentSessionId ? m.sessionId === currentSessionId : false,
      };
    });
  }

  static async createMessage(params: {
    roomId: string;
    sessionId: string;
    content: string;
    type?: MessageType;
    uploadIds?: string[];
    replyToId?: string;
  }): Promise<Message> {
    const session = await prisma.session.findUnique({
      where: { id: params.sessionId },
    });
    if (!session) throw new Error('Session not found');

    const sanitizedContent = sanitizeMarkdown(params.content);
    const messageType = params.type || (params.uploadIds && params.uploadIds.length > 0 ? 'IMAGE' : 'TEXT');

    const created = await prisma.message.create({
      data: {
        roomId: params.roomId,
        sessionId: params.sessionId,
        type: messageType,
        content: sanitizedContent,
        replyToId: params.replyToId || null,
      },
      include: {
        session: true,
        replyTo: {
          include: { session: true },
        },
      },
    });

    // Attach uploads if any
    if (params.uploadIds && params.uploadIds.length > 0) {
      await prisma.upload.updateMany({
        where: { id: { in: params.uploadIds } },
        data: { messageId: created.id },
      });
    }

    const uploadsList = await prisma.upload.findMany({
      where: { messageId: created.id },
    });

    const publicBase = `/api/uploads`;

    return {
      id: created.id,
      roomId: created.roomId,
      sessionId: created.sessionId,
      senderNickname: session.nickname,
      senderAvatarSeed: session.avatarSeed,
      type: created.type as MessageType,
      content: created.content,
      replyToId: created.replyToId,
      replyTo: created.replyTo
        ? {
            id: created.replyTo.id,
            senderNickname: created.replyTo.session.nickname,
            content: created.replyTo.content,
            type: created.replyTo.type as MessageType,
          }
        : null,
      uploads: uploadsList.map((u: any) => ({
        id: u.id,
        storageKey: u.storageKey,
        thumbnailKey: u.thumbnailKey,
        mimeType: u.mimeType,
        size: u.size,
        width: u.width,
        height: u.height,
        url: `/api/uploads/files?key=${encodeURIComponent(u.storageKey)}`,
        thumbnailUrl: `/api/uploads/files?key=${encodeURIComponent(u.thumbnailKey)}`,

        createdAt: u.createdAt.toISOString(),
      })),
      reactions: [],
      isEdited: false,
      deletedAt: null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  static async toggleReaction(messageId: string, sessionId: string, emoji: string) {
    const existing = await prisma.reaction.findUnique({
      where: {
        messageId_sessionId_emoji: {
          messageId,
          sessionId,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.reaction.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.reaction.create({
        data: {
          messageId,
          sessionId,
          emoji,
        },
      });
    }

    // Get updated reactions for message
    const allReactions = await prisma.reaction.findMany({
      where: { messageId },
    });

    const map = new Map<string, { count: number; sessionIds: string[] }>();
    for (const r of allReactions) {
      let item = map.get(r.emoji);
      if (!item) {
        item = { count: 0, sessionIds: [] };
        map.set(r.emoji, item);
      }
      item.count++;
      item.sessionIds.push(r.sessionId);
    }

    return Array.from(map.entries()).map(([e, data]) => ({
      emoji: e,
      count: data.count,
      sessionIds: data.sessionIds,
    }));
  }

  static async editMessage(messageId: string, sessionId: string, newContent: string) {
    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.sessionId !== sessionId) throw new Error('Unauthorized or message not found');

    const sanitized = sanitizeMarkdown(newContent);
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: sanitized,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  static async deleteMessage(messageId: string, sessionId: string, isOwner: boolean = false) {

    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      include: { uploads: true },
    });
    if (!msg) throw new Error('Message not found');

    if (!isOwner && msg.sessionId !== sessionId) {
      throw new Error('Unauthorized to delete message');
    }

    // Delete associated storage objects from Supabase Storage
    if (msg.uploads && msg.uploads.length > 0) {
      for (const u of msg.uploads) {
        try {
          await StorageService.deleteFile(u.storageKey);
          await StorageService.deleteFile(u.thumbnailKey);
        } catch (err: any) {
          console.warn(`[Storage Delete Warning] Could not delete storage object ${u.storageKey}:`, err.message);
        }
      }
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    return updated;
  }
}

