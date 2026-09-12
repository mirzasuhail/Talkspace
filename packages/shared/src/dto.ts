import { RoomExpiration, RoomVisibility } from './models';

export interface CreateRoomDTO {
  name: string;
  slug?: string;
  description?: string;
  visibility?: RoomVisibility;
  password?: string;
  expiration?: RoomExpiration;
}

export interface JoinRoomDTO {
  roomSlug: string;
  nickname: string;
  password?: string;
  sessionId?: string;
}

export interface CheckRoomResponse {
  exists: boolean;
  isExpired: boolean;
  isPasswordProtected: boolean;
  name?: string;
}

export interface RoomInfoResponse {
  room: {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    visibility: RoomVisibility;
    isPasswordProtected: boolean;
    expiresAt?: string | null;
    createdAt: string;
  };
  requiresPassword: boolean;
  isOwner: boolean;
  session: {
    id: string;
    nickname: string;
    avatarSeed: string;
  };
}

export interface UploadResponse {
  id: string;
  storageKey: string;
  thumbnailKey: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  url: string;
  thumbnailUrl: string;
}

export interface APIErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
