import type { FastifyPluginAsync } from 'fastify';
import { config } from '../../config.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /auth/status — check if auth is enabled and if user is logged in
  fastify.get('/status', {
    schema: { tags: ['auth'], summary: 'Auth system status' },
  }, async (request) => {
    if (!config.auth.enabled) {
      return { enabled: false, authenticated: false, user: null };
    }
    try {
      await request.jwtVerify();
      return { enabled: true, authenticated: true, user: request.user };
    } catch {
      return { enabled: true, authenticated: false, user: null };
    }
  });

  // OAuth login routes — only registered when auth is enabled
  if (config.auth.enabled) {
    fastify.get('/login', {
      schema: { tags: ['auth'], summary: 'Initiate OAuth login' },
    }, async (request, reply) => {
      const { provider } = request.query as { provider?: string };
      // TODO: redirect to provider-specific OAuth URL via @fastify/oauth2
      return reply.notImplemented(`OAuth login for provider "${provider}" not yet wired`);
    });

    fastify.get('/callback', {
      schema: { tags: ['auth'], summary: 'OAuth callback' },
    }, async (request, reply) => {
      // TODO: exchange code, upsert user in QLever, sign JWT, redirect SPA
      return reply.notImplemented('OAuth callback not yet implemented');
    });

    fastify.post('/logout', {
      schema: { tags: ['auth'], summary: 'Logout (invalidate session client-side)' },
      preHandler: [fastify.requireAuth],
    }, async (_, reply) => {
      // JWT is stateless — client drops the token; server just confirms
      return reply.send({ message: 'Logged out' });
    });
  }
};

export default authRoutes;
