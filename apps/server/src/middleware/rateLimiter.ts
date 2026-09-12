import { FastifyRequest, FastifyReply } from 'fastify';
import { redisClient } from '../lib/redis';

export async function rateLimitMiddleware(
  req: FastifyRequest,
  reply: FastifyReply,
  maxRequests: number = 60,
  windowSeconds: number = 60
) {
  const ip = req.ip || '127.0.0.1';
  const key = `ratelimit:${ip}:${req.routerPath || req.url}`;

  const current = await redisClient.incr(key);
  if (current === 1) {
    await redisClient.expire(key, windowSeconds);
  }

  if (current > maxRequests) {
    reply.status(429).send({
      error: 'Too Many Requests',
      message: 'You are performing actions too quickly. Please wait a moment.',
      statusCode: 429,
    });
    return reply;
  }
}
