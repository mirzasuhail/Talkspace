import { FastifyRequest, FastifyReply } from 'fastify';
import { MessageService } from '../services/messageService';
import { RoomService } from '../services/roomService';
import { ModerationService } from '../services/moderationService';

export class MessageController {
  static async getRoomMessages(req: FastifyRequest<{ Params: { slug: string }; Querystring: { sessionId?: string } }>, reply: FastifyReply) {
    const { slug } = req.params;
    const { sessionId } = req.query;

    const roomRes = await RoomService.getRoomBySlug(slug);
    if (!roomRes || !roomRes.room || roomRes.isExpired) {
      return reply.status(404).send({ error: 'Not Found', message: 'Room not found or expired.' });
    }

    const messages = await MessageService.getRoomMessages(roomRes.room.id, 100, sessionId);
    return reply.send({ messages });
  }

  static async reportMessage(req: FastifyRequest<{ Params: { messageId: string }; Body: { roomSlug: string; reporterSessionId: string; reason: string } }>, reply: FastifyReply) {
    const { messageId } = req.params;
    const { roomSlug, reporterSessionId, reason } = req.body;

    const roomRes = await RoomService.getRoomBySlug(roomSlug);
    if (!roomRes || !roomRes.room) {
      return reply.status(404).send({ error: 'Not Found', message: 'Room not found.' });
    }

    await ModerationService.reportMessage(roomRes.room.id, messageId, reporterSessionId, reason || 'Inappropriate content');
    return reply.send({ success: true, message: 'Report submitted. Thank you.' });
  }
}
