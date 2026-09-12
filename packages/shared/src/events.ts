import { Message, RoomMember } from './models.js';

export const SOCKET_EVENTS = {
  // Client -> Server
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  MESSAGE_SEND: 'message:send',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_DELETE: 'message:delete',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  REACTION_TOGGLE: 'reaction:toggle',
  MODERATION_ACTION: 'moderation:action',

  // Server -> Client
  ROOM_JOINED: 'room:joined',
  ROOM_EXPIRED: 'room:expired',
  ROOM_DESTROYED: 'room:destroyed',
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  TYPING_UPDATE: 'typing:update',
  PRESENCE_UPDATE: 'presence:update',
  REACTION_UPDATED: 'reaction:updated',
  MEMBER_KICKED: 'member:kicked',
  MEMBER_MUTED: 'member:muted',
  ERROR: 'error:event',
} as const;

export interface RoomJoinPayload {
  roomSlug: string;
  sessionId: string;
  nickname?: string;
  password?: string;
}

export interface SendMessagePayload {
  roomSlug: string;
  sessionId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE';
  uploadIds?: string[];
  replyToId?: string;
  clientTempId?: string;
}

export interface EditMessagePayload {
  messageId: string;
  roomSlug: string;
  sessionId: string;
  content: string;
}

export interface DeleteMessagePayload {
  messageId: string;
  roomSlug: string;
  sessionId: string;
}

export interface TypingPayload {
  roomSlug: string;
  sessionId: string;
}

export interface ReactionTogglePayload {
  messageId: string;
  roomSlug: string;
  sessionId: string;
  emoji: string;
}

export interface ModerationActionPayload {
  roomSlug: string;
  ownerSessionId: string;
  targetSessionId: string;
  action: 'kick' | 'ban' | 'mute' | 'unmute';
  reason?: string;
}

// Broadcast payloads from server to clients

export interface RoomJoinedBroadcast {
  roomSlug: string;
  member: RoomMember;
  onlineCount: number;
}

export interface MessageNewBroadcast {
  message: Message;
  clientTempId?: string;
}

export interface MessageUpdatedBroadcast {
  messageId: string;
  content: string;
  updatedAt: string;
}

export interface MessageDeletedBroadcast {
  messageId: string;
  deletedAt: string;
}

export interface TypingUpdateBroadcast {
  roomSlug: string;
  typingUsers: { sessionId: string; nickname: string }[];
}

export interface PresenceUpdateBroadcast {
  roomSlug: string;
  onlineCount: number;
  members: RoomMember[];
}

export interface ReactionUpdatedBroadcast {
  messageId: string;
  reactions: {
    emoji: string;
    count: number;
    sessionIds: string[];
  }[];
}

export interface MemberKickedBroadcast {
  targetSessionId: string;
  reason?: string;
  action: 'kick' | 'ban';
}

export interface MemberMutedBroadcast {
  targetSessionId: string;
  isMuted: boolean;
}

export interface SocketErrorPayload {
  code: string;
  message: string;
}
