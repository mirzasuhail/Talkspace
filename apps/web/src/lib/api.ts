import { CreateRoomDTO, RoomInfoResponse, UploadResponse, Message } from '@talksy/shared';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'API Request failed');
  }

  return data as T;
}

export async function apiCreateRoom(dto: CreateRoomDTO, ownerSessionId: string) {
  return fetchApi<{ room: { id: string; slug: string; name: string; visibility: string; isPasswordProtected: boolean; expiresAt: string | null } }>(
    '/rooms',
    {
      method: 'POST',
      body: JSON.stringify({ ...dto, ownerSessionId }),
    }
  );
}

export async function apiCheckRoomExists(slug: string) {
  return fetchApi<{ exists: boolean; isExpired: boolean; isPasswordProtected: boolean; name?: string }>(`/rooms/${encodeURIComponent(slug)}/check`);
}

export async function apiGetRoomInfo(slug: string, sessionId?: string) {
  const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  return fetchApi<RoomInfoResponse>(`/rooms/${slug}${q}`);
}

export async function apiVerifyRoomPassword(slug: string, password: string) {
  return fetchApi<{ success: boolean }>(`/rooms/${slug}/verify`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function apiGetOrCreateSession(sessionId?: string, nickname?: string) {
  return fetchApi<{ session: { id: string; nickname: string; avatarSeed: string } }>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ sessionId, nickname }),
  });
}

export async function apiUpdateNickname(sessionId: string, nickname: string) {
  return fetchApi<{ session: { id: string; nickname: string; avatarSeed: string } }>(`/sessions/${sessionId}/nickname`, {
    method: 'PATCH',
    body: JSON.stringify({ nickname }),
  });
}

export async function apiGetMessages(slug: string, sessionId?: string) {
  const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  return fetchApi<{ messages: Message[] }>(`/rooms/${slug}/messages${q}`);
}

export async function apiUploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Image upload failed');
  }

  return data as UploadResponse;
}

export async function apiReportMessage(messageId: string, roomSlug: string, reporterSessionId: string, reason: string) {
  return fetchApi<{ success: boolean; message: string }>(`/messages/${messageId}/report`, {
    method: 'POST',
    body: JSON.stringify({ roomSlug, reporterSessionId, reason }),
  });
}
