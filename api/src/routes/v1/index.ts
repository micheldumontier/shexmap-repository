import type { FastifyPluginAsync } from 'fastify';
import healthRoute from './health.js';
import shexmapsRoutes from './shexmaps.js';
import coverageRoutes from './coverage.js';
import usersRoutes from './users.js';
import authRoutes from './auth.js';
import filesRoutes from './files.js';
import pairingsRoutes from './pairings.js';
import schemasRoutes from './schemas.js';
import validateRoutes from './validate.js';

const v1Routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoute);
  await fastify.register(shexmapsRoutes, { prefix: '/shexmaps' });
  await fastify.register(pairingsRoutes, { prefix: '/pairings' });
  await fastify.register(schemasRoutes, { prefix: '/schemas' });
  await fastify.register(coverageRoutes, { prefix: '/coverage' });
  await fastify.register(usersRoutes, { prefix: '/users' });
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(filesRoutes, { prefix: '/files' });
  await fastify.register(validateRoutes, { prefix: '/validate' });
};

export default v1Routes;
