import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { config } from '../config.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    verifyAPIKey: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (fastify) => {
  await fastify.register(jwt, {
    secret: config.auth.jwtSecret,
    sign: { expiresIn: config.auth.jwtExpiry },
  });

  fastify.decorate('verifyJWT', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.unauthorized('Invalid or expired token');
    }
  });

  fastify.decorate('verifyAPIKey', async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || typeof apiKey !== 'string') {
      reply.unauthorized('Missing X-API-Key header');
      return;
    }
    // TODO: validate API key against QLever store via apikey.service
    // For now, reject all keys until the service is implemented
    reply.unauthorized('API key validation not yet implemented');
  });

  // Combined preHandler: no-op if auth disabled, else try JWT then API key
  fastify.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!config.auth.enabled) return;

    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      await fastify.verifyJWT(request, reply);
    } else {
      await fastify.verifyAPIKey(request, reply);
    }
  });
});
