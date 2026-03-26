import type { FastifyPluginAsync } from 'fastify';

const usersRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /users/:userId/dashboard
  fastify.get('/:userId/dashboard', {
    schema: { tags: ['users'], summary: 'Get user dashboard (contributions + starred)' },
    preHandler: [fastify.requireAuth],
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    // TODO: implement user dashboard via SPARQL queries
    return reply.notImplemented('User dashboard not yet implemented');
  });

  // GET /users/:userId/shexmaps — public: list contributions
  fastify.get('/:userId/shexmaps', {
    schema: { tags: ['users'], summary: "List a user's ShExMap contributions" },
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    // TODO: query via shexmap.service with author filter
    return reply.notImplemented('User contributions not yet implemented');
  });

};

export default usersRoutes;
