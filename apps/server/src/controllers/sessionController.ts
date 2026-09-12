import { FastifyRequest, FastifyReply } from 'fastify';
import { SessionService } from '../services/sessionService';

export class SessionController {
  static async getOrCreateSession(req: FastifyRequest<{ Body: { sessionId?: string; nickname?: string } }>, reply: FastifyReply) {
    const { sessionId, nickname } = req.body || {};
    const session = await SessionService.getOrCreateSession(sessionId, nickname);

    return reply.send({
      session: {
        id: session.id,
        nickname: session.nickname,
        avatarSeed: session.avatarSeed,
        createdAt: session.createdAt.toISOString(),
      },
    });
  }

  static async updateNickname(req: FastifyRequest<{ Params: { id: string }; Body: { nickname: string } }>, reply: FastifyReply) {
    const { id } = req.params;
    const { nickname } = req.body;

    if (!nickname || !nickname.trim()) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Nickname is required.' });
    }

    const session = await SessionService.getOrCreateSession(id, nickname);
    return reply.send({ session });
  }
}
