export type RoomVisibility = 'PUBLIC' | 'PRIVATE';
export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';
export type RoomExpiration = '1h' | '24h' | '7d' | 'never';

export interface UserSession {
  id: string;
  nickname: string;
  avatarSeed: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface Room {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  visibility: RoomVisibility;
  isPasswordProtected: boolean;
  ownerSessionId: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  onlineCount?: number;
}

export interface Upload {
  id: string;
  messageId?: string | null;
  storageKey: string;
  thumbnailKey: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  sessionIds: string[];
  userReacted: boolean;
}

export interface MessageReplyPreview {
  id: string;
  senderNickname: string;
  content: string;
  type: MessageType;
}

export interface Message {
  id: string;
  roomId: string;
  sessionId: string;
  senderNickname: string;
  senderAvatarSeed: string;
  type: MessageType;
  content: string;
  replyToId?: string | null;
  replyTo?: MessageReplyPreview | null;
  uploads?: Upload[];
  reactions?: ReactionSummary[];
  isEdited?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
  isSelf?: boolean;
}

export interface RoomMember {
  sessionId: string;
  nickname: string;
  avatarSeed: string;
  isOwner: boolean;
  isMuted: boolean;
  joinedAt: string;
}

export interface Ban {
  id: string;
  roomId: string;
  sessionIdHash: string;
  reason?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}
