import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  RoomJoinPayload,
  SendMessagePayload,
  EditMessagePayload,
  DeleteMessagePayload,
  TypingPayload,
  ReactionTogglePayload,
  ModerationActionPayload,
} from '@talksy/shared';
import { RoomService } from '../services/roomService';
import { SessionService } from '../services/sessionService';
import { MessageService } from '../services/messageService';
import { ModerationService } from '../services/moderationService';
import { PresenceManager } from './presenceManager';
import { CONFIG } from '../config';

export function setupSocketServer(httpServer: HttpServer) {
  const allowedOrigins =
    CONFIG.ALLOWED_ORIGIN === '*'
      ? '*'
      : [CONFIG.ALLOWED_ORIGIN, CONFIG.PUBLIC_WEB_URL, 'http://localhost:3000'].filter(Boolean);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket: Socket) => {
    // 1. Join Room
    socket.on(SOCKET_EVENTS.ROOM_JOIN, async (payload: RoomJoinPayload) => {
      try {
        const { roomSlug, sessionId, nickname, password } = payload;
        const roomResult = await RoomService.getRoomBySlug(roomSlug);

        if (!roomResult || !roomResult.room) {
          socket.emit(SOCKET_EVENTS.ERROR, { code: 'NOT_FOUND', message: 'Room does not exist.' });
          return;
        }

        if (roomResult.isExpired) {
          socket.emit(SOCKET_EVENTS.ROOM_EXPIRED, { roomSlug, message: 'This room has expired.' });
          return;
        }

        const room = roomResult.room;

        // Check if banned
        const isBanned = await ModerationService.isBanned(room.id, sessionId);
        if (isBanned) {
          socket.emit(SOCKET_EVENTS.ERROR, { code: 'BANNED', message: 'You have been banned from this room.' });
          return;
        }

        // Verify Password if private
        if (room.passwordHash && room.ownerSessionId !== sessionId) {
          const isValidPass = await RoomService.verifyPassword(roomSlug, password || '');
          if (!isValidPass) {
            socket.emit(SOCKET_EVENTS.ERROR, { code: 'INVALID_PASSWORD', message: 'Incorrect room password.' });
            return;
          }
        }

        // Session setup
        const session = await SessionService.getOrCreateSession(sessionId, nickname);
        const isOwner = room.ownerSessionId === session.id;

        // Leave existing rooms on this socket if any
        for (const r of socket.rooms) {
          if (r !== socket.id) socket.leave(r);
        }

        socket.join(roomSlug);
        await PresenceManager.addMember(roomSlug, session.id, socket.id, isOwner);

        // Notify client
        const members = await PresenceManager.getOnlineMembers(roomSlug, room.ownerSessionId);
        const onlineCount = members.length;

        socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
          roomSlug,
          member: {
            sessionId: session.id,
            nickname: session.nickname,
            avatarSeed: session.avatarSeed,
            isOwner,
            isMuted: false,
            joinedAt: session.createdAt.toISOString(),
          },
          onlineCount,
        });

        // Broadcast updated presence to room
        io.to(roomSlug).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
          roomSlug,
          onlineCount,
          members,
        });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'SERVER_ERROR', message: err.message });
      }
    });

    // 2. Send Message
    socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload: SendMessagePayload) => {
      try {
        const { roomSlug, sessionId, content, type, uploadIds, replyToId, clientTempId } = payload;
        const roomResult = await RoomService.getRoomBySlug(roomSlug);

        if (!roomResult || !roomResult.room) return;

        // Check if muted
        const isMuted = await ModerationService.isMuted(roomResult.room.id, sessionId);
        if (isMuted) {
          socket.emit(SOCKET_EVENTS.ERROR, { code: 'MUTED', message: 'You are currently muted in this room.' });
          return;
        }

        const message = await MessageService.createMessage({
          roomId: roomResult.room.id,
          sessionId,
          content,
          type,
          uploadIds,
          replyToId,
        });

        // Stop typing status
        await PresenceManager.stopTyping(roomSlug, sessionId);
        const typingUsers = await PresenceManager.getTypingUsers(roomSlug);
        io.to(roomSlug).emit(SOCKET_EVENTS.TYPING_UPDATE, { roomSlug, typingUsers });

        // Broadcast new message to room
        io.to(roomSlug).emit(SOCKET_EVENTS.MESSAGE_NEW, {
          message,
          clientTempId,
        });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'MESSAGE_FAILED', message: err.message });
      }
    });

    // 3. Typing events
    socket.on(SOCKET_EVENTS.TYPING_START, async (payload: TypingPayload) => {
      try {
        const { roomSlug, sessionId } = payload;
        await PresenceManager.startTyping(roomSlug, sessionId);
        const typingUsers = await PresenceManager.getTypingUsers(roomSlug);
        io.to(roomSlug).emit(SOCKET_EVENTS.TYPING_UPDATE, { roomSlug, typingUsers });
      } catch {}
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, async (payload: TypingPayload) => {
      try {
        const { roomSlug, sessionId } = payload;
        await PresenceManager.stopTyping(roomSlug, sessionId);
        const typingUsers = await PresenceManager.getTypingUsers(roomSlug);
        io.to(roomSlug).emit(SOCKET_EVENTS.TYPING_UPDATE, { roomSlug, typingUsers });
      } catch {}
    });

    // 4. Reaction toggle
    socket.on(SOCKET_EVENTS.REACTION_TOGGLE, async (payload: ReactionTogglePayload) => {
      try {
        const { messageId, roomSlug, sessionId, emoji } = payload;
        const updatedReactions = await MessageService.toggleReaction(messageId, sessionId, emoji);
        io.to(roomSlug).emit(SOCKET_EVENTS.REACTION_UPDATED, {
          messageId,
          reactions: updatedReactions,
        });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'REACTION_FAILED', message: err.message });
      }
    });

    // 5. Message edit
    socket.on(SOCKET_EVENTS.MESSAGE_EDIT, async (payload: EditMessagePayload) => {
      try {
        const { messageId, roomSlug, sessionId, content } = payload;
        const updated = await MessageService.editMessage(messageId, sessionId, content);
        io.to(roomSlug).emit(SOCKET_EVENTS.MESSAGE_UPDATED, {
          messageId,
          content: updated.content,
          updatedAt: updated.updatedAt.toISOString(),
        });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'EDIT_FAILED', message: err.message });
      }
    });

    // 6. Message delete
    socket.on(SOCKET_EVENTS.MESSAGE_DELETE, async (payload: DeleteMessagePayload) => {
      try {
        const { messageId, roomSlug, sessionId } = payload;
        const roomResult = await RoomService.getRoomBySlug(roomSlug);
        if (!roomResult || !roomResult.room) return;

        const isOwner = roomResult.room.ownerSessionId === sessionId;
        const deleted = await MessageService.deleteMessage(messageId, sessionId, isOwner);

        io.to(roomSlug).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
          messageId,
          deletedAt: deleted.deletedAt ? deleted.deletedAt.toISOString() : new Date().toISOString(),
        });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'DELETE_FAILED', message: err.message });
      }
    });

    // 7. Moderation actions (Kick, Ban, Mute, Unmute)
    socket.on(SOCKET_EVENTS.MODERATION_ACTION, async (payload: ModerationActionPayload) => {
      try {
        const { roomSlug, ownerSessionId, targetSessionId, action, reason } = payload;
        const roomResult = await RoomService.getRoomBySlug(roomSlug);
        if (!roomResult || !roomResult.room) return;

        // Verify sender is owner
        if (roomResult.room.ownerSessionId !== ownerSessionId) {
          socket.emit(SOCKET_EVENTS.ERROR, { code: 'UNAUTHORIZED', message: 'Only room owner can perform moderation actions.' });
          return;
        }

        const roomId = roomResult.room.id;

        if (action === 'kick' || action === 'ban') {
          if (action === 'ban') {
            await ModerationService.banUser(roomId, targetSessionId, reason);
          }
          io.to(roomSlug).emit(SOCKET_EVENTS.MEMBER_KICKED, {
            targetSessionId,
            reason,
            action,
          });
        } else if (action === 'mute') {
          await ModerationService.muteUser(roomId, targetSessionId);
          io.to(roomSlug).emit(SOCKET_EVENTS.MEMBER_MUTED, {
            targetSessionId,
            isMuted: true,
          });
        } else if (action === 'unmute') {
          await ModerationService.unmuteUser(roomId, targetSessionId);
          io.to(roomSlug).emit(SOCKET_EVENTS.MEMBER_MUTED, {
            targetSessionId,
            isMuted: false,
          });
        }
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'MODERATION_FAILED', message: err.message });
      }
    });

    // 8. Disconnection handler
    socket.on('disconnect', async () => {
      const removed = await PresenceManager.removeMember(socket.id);
      if (removed) {
        const { roomSlug } = removed;
        const roomResult = await RoomService.getRoomBySlug(roomSlug);
        const ownerId = roomResult?.room?.ownerSessionId || '';
        const members = await PresenceManager.getOnlineMembers(roomSlug, ownerId);
        const onlineCount = members.length;

        io.to(roomSlug).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
          roomSlug,
          onlineCount,
          members,
        });

        const typingUsers = await PresenceManager.getTypingUsers(roomSlug);
        io.to(roomSlug).emit(SOCKET_EVENTS.TYPING_UPDATE, { roomSlug, typingUsers });
      }
    });
  });

  return io;
}
