import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { sanitizeText } from '../middleware/sanitizer';

const ADJECTIVES = ['Silent', 'Cosmic', 'Electric', 'Velvet', 'Lunar', 'Neon', 'Starlight', 'Vivid', 'Pixel', 'Echo', 'Shadow', 'Aether'];
const NOUNS = ['Panda', 'Falcon', 'Voyager', 'Nomad', 'Phoenix', 'Nebula', 'Runner', 'Orbit', 'Pulse', 'Cipher', 'Vortex', 'Spark'];

export class SessionService {
  static generateRandomNickname(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${adj}${noun}${num}`;
  }

  static generateAvatarSeed(sessionId: string): string {
    return crypto.createHash('md5').update(sessionId).digest('hex').substring(0, 12);
  }

  static async getOrCreateSession(sessionId?: string, preferredNickname?: string) {
    if (sessionId) {
      const existing = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      if (existing) {
        let nickname = existing.nickname;
        if (preferredNickname && preferredNickname.trim()) {
          const sanitized = sanitizeText(preferredNickname).substring(0, 24);
          if (sanitized && sanitized !== existing.nickname) {
            nickname = sanitized;
          }
        }
        const updated = await prisma.session.update({
          where: { id: sessionId },
          data: {
            nickname,
            lastSeenAt: new Date(),
          },
        });
        return updated;
      }
    }

    // Create new session
    const nickname = preferredNickname ? sanitizeText(preferredNickname).substring(0, 24) : this.generateRandomNickname();
    const newSessionId = crypto.randomUUID();
    const avatarSeed = this.generateAvatarSeed(newSessionId);

    const created = await prisma.session.create({
      data: {
        id: newSessionId,
        nickname: nickname || this.generateRandomNickname(),
        avatarSeed,
      },
    });

    return created;
  }
}
