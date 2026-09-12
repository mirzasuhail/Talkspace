import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  SOCKET_EVENTS,
  Message,
  RoomMember,
  MessageNewBroadcast,
  MessageUpdatedBroadcast,
  MessageDeletedBroadcast,
  PresenceUpdateBroadcast,
  TypingUpdateBroadcast,
  ReactionUpdatedBroadcast,
  MemberKickedBroadcast,
  MemberMutedBroadcast,
  SendMessagePayload,
} from '@talksy/shared';
import { sounds } from '../lib/sounds';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface UseSocketOptions {
  roomSlug: string;
  sessionId: string | null;
  nickname: string | null;
  password?: string;
  onRoomJoined?: (data: { onlineCount: number }) => void;
  onKicked?: (data: MemberKickedBroadcast) => void;
  onError?: (err: { code: string; message: string }) => void;
}

export function useSocket({ roomSlug, sessionId, nickname, password, onRoomJoined, onKicked, onError }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<RoomMember[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [typingUsers, setTypingUsers] = useState<{ sessionId: string; nickname: string }[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    if (!roomSlug || !sessionId) return;

    const socketUrl = import.meta.env.VITE_WS_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      // Emit room:join
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, {
        roomSlug,
        sessionId,
        nickname,
        password,
      });
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('reconnect_attempt', () => {
      setStatus('reconnecting');
    });

    socket.on('reconnect', () => {
      setStatus('connected');
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, {
        roomSlug,
        sessionId,
        nickname,
        password,
      });
    });

    // Event Handlers
    socket.on(SOCKET_EVENTS.ROOM_JOINED, (data) => {
      setOnlineCount(data.onlineCount);
      if (onRoomJoined) onRoomJoined({ onlineCount: data.onlineCount });
    });

    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (data: PresenceUpdateBroadcast) => {
      setOnlineCount(data.onlineCount);
      setOnlineMembers(data.members);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, (data: MessageNewBroadcast) => {
      setMessages((prev) => {
        // Prevent duplicate messages if optimistic temp ID matches
        if (data.clientTempId) {
          const idx = prev.findIndex((m) => m.id === data.clientTempId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = data.message;
            return next;
          }
        }
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });

      if (data.message.sessionId !== sessionId) {
        sounds.playReceive();
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, (data: MessageUpdatedBroadcast) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, content: data.content, updatedAt: data.updatedAt, isEdited: true }
            : m
        )
      );
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, (data: MessageDeletedBroadcast) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, deletedAt: data.deletedAt }
            : m
        )
      );
    });

    socket.on(SOCKET_EVENTS.TYPING_UPDATE, (data: TypingUpdateBroadcast) => {
      // Filter out self from typing indicator
      setTypingUsers(data.typingUsers.filter((u) => u.sessionId !== sessionId));
    });

    socket.on(SOCKET_EVENTS.REACTION_UPDATED, (data: ReactionUpdatedBroadcast) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m;
          const updatedReactionsSummary = data.reactions.map((r) => ({
            emoji: r.emoji,
            count: r.count,
            sessionIds: r.sessionIds,
            userReacted: r.sessionIds.includes(sessionId),
          }));
          return { ...m, reactions: updatedReactionsSummary };
        })
      );
      sounds.playPop();
    });

    socket.on(SOCKET_EVENTS.MEMBER_KICKED, (data: MemberKickedBroadcast) => {
      if (data.targetSessionId === sessionId) {
        if (onKicked) onKicked(data);
      }
    });

    socket.on(SOCKET_EVENTS.MEMBER_MUTED, (data: MemberMutedBroadcast) => {
      if (data.targetSessionId === sessionId) {
        setIsMuted(data.isMuted);
      }
    });

    socket.on(SOCKET_EVENTS.ERROR, (err: { code: string; message: string }) => {
      if (onError) onError(err);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomSlug, sessionId, nickname, password]);

  // Actions
  const sendMessage = useCallback(
    (content: string, type: 'TEXT' | 'IMAGE' = 'TEXT', uploadIds?: string[], replyToId?: string) => {
      if (!socketRef.current || !sessionId) return;
      const clientTempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      const payload: SendMessagePayload = {
        roomSlug,
        sessionId,
        content,
        type,
        uploadIds,
        replyToId,
        clientTempId,
      };

      socketRef.current.emit(SOCKET_EVENTS.MESSAGE_SEND, payload);
      sounds.playSend();
    },
    [roomSlug, sessionId]
  );

  const startTyping = useCallback(() => {
    if (socketRef.current && sessionId) {
      socketRef.current.emit(SOCKET_EVENTS.TYPING_START, { roomSlug, sessionId });
    }
  }, [roomSlug, sessionId]);

  const stopTyping = useCallback(() => {
    if (socketRef.current && sessionId) {
      socketRef.current.emit(SOCKET_EVENTS.TYPING_STOP, { roomSlug, sessionId });
    }
  }, [roomSlug, sessionId]);

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (socketRef.current && sessionId) {
        socketRef.current.emit(SOCKET_EVENTS.REACTION_TOGGLE, { messageId, roomSlug, sessionId, emoji });
      }
    },
    [roomSlug, sessionId]
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (socketRef.current && sessionId) {
        socketRef.current.emit(SOCKET_EVENTS.MESSAGE_EDIT, { messageId, roomSlug, sessionId, content });
      }
    },
    [roomSlug, sessionId]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (socketRef.current && sessionId) {
        socketRef.current.emit(SOCKET_EVENTS.MESSAGE_DELETE, { messageId, roomSlug, sessionId });
      }
    },
    [roomSlug, sessionId]
  );

  const performModeration = useCallback(
    (targetSessionId: string, action: 'kick' | 'ban' | 'mute' | 'unmute', reason?: string) => {
      if (socketRef.current && sessionId) {
        socketRef.current.emit(SOCKET_EVENTS.MODERATION_ACTION, {
          roomSlug,
          ownerSessionId: sessionId,
          targetSessionId,
          action,
          reason,
        });
      }
    },
    [roomSlug, sessionId]
  );

  return {
    status,
    messages,
    setMessages,
    onlineMembers,
    onlineCount,
    typingUsers,
    isMuted,
    sendMessage,
    startTyping,
    stopTyping,
    toggleReaction,
    editMessage,
    deleteMessage,
    performModeration,
  };
}
