import { useState, useEffect, useCallback } from 'react';
import { apiGetOrCreateSession, apiUpdateNickname } from '../lib/api';

const SESSION_STORAGE_KEY = 'talksy_session';

export interface LocalSession {
  id: string;
  nickname: string;
  avatarSeed: string;
}

export function useSession() {
  const [session, setSession] = useState<LocalSession | null>(() => {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(!session);

  const initSession = useCallback(async (preferredNickname?: string) => {
    setIsLoading(true);
    try {
      const existingId = session?.id;
      const res = await apiGetOrCreateSession(existingId, preferredNickname);
      const newSession = res.session;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      return newSession;
    } catch (err) {
      console.error('Failed to initialize session', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session?.id]);

  useEffect(() => {
    if (!session) {
      initSession();
    }
  }, [session, initSession]);

  const updateNickname = useCallback(async (nickname: string) => {
    if (!session) return;
    try {
      const res = await apiUpdateNickname(session.id, nickname);
      const updated = res.session;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      setSession(updated);
      return updated;
    } catch (err) {
      throw err;
    }
  }, [session]);

  return {
    session,
    isLoading,
    initSession,
    updateNickname,
  };
}
