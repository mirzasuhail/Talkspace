import { FastifyRequest, FastifyReply } from 'fastify';
import { RoomService } from '../services/roomService';
import { CreateRoomDTO } from '@talksy/shared';
import { rateLimitMiddleware } from '../middleware/rateLimiter';

export class RoomController {
  static async checkRoomExists(req: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    const { slug } = req.params;
    const info = await RoomService.checkRoomExists(slug);
    return reply.send(info);
  }

  static async createRoom(req: FastifyRequest<{ Body: CreateRoomDTO & { ownerSessionId?: string } }>, reply: FastifyReply) {
    await rateLimitMiddleware(req, reply, 20, 60);
    const { ownerSessionId, ...dto } = req.body;

    if (!ownerSessionId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Owner session ID is required.' });
    }

    try {
      const room = await RoomService.createRoom(dto, ownerSessionId);
      return reply.send({
        room: {
          id: room.id,
          slug: room.slug,
          name: room.name,
          description: room.description,
          visibility: room.visibility,
          isPasswordProtected: !!room.passwordHash,
          ownerSessionId: room.ownerSessionId,
          expiresAt: room.expiresAt ? room.expiresAt.toISOString() : null,
          createdAt: room.createdAt.toISOString(),
        },
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Server Error', message: err.message || 'Could not create room' });
    }
  }

  static async getRoomBySlug(req: FastifyRequest<{ Params: { slug: string }; Querystring: { sessionId?: string } }>, reply: FastifyReply) {
    const { slug } = req.params;
    const { sessionId } = req.query;

    const result = await RoomService.getRoomBySlug(slug);
    if (!result || !result.room) {
      return reply.status(404).send({ error: 'Not Found', message: 'That room does not exist.' });
    }

    if (result.isExpired) {
      return reply.status(410).send({ error: 'Gone', message: 'Looks like this room has expired.' });
    }

    const room = result.room;
    const isOwner = sessionId ? room.ownerSessionId === sessionId : false;

    return reply.send({
      room: {
        id: room.id,
        slug: room.slug,
        name: room.name,
        description: room.description,
        visibility: room.visibility,
        isPasswordProtected: !!room.passwordHash,
        expiresAt: room.expiresAt ? room.expiresAt.toISOString() : null,
        createdAt: room.createdAt.toISOString(),
      },
      requiresPassword: !!room.passwordHash,
      isOwner,
    });
  }

  static async verifyPassword(req: FastifyRequest<{ Params: { slug: string }; Body: { password: string } }>, reply: FastifyReply) {
    const { slug } = req.params;
    const { password } = req.body;

    const isValid = await RoomService.verifyPassword(slug, password || '');
    if (!isValid) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Incorrect room password.' });
    }

    return reply.send({ success: true });
  }
}
