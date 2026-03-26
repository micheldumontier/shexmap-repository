import type { FastifyPluginAsync } from 'fastify';
import healthRoute from './health.js';
import shexmapsRoutes from './shexmaps.js';
import coverageRoutes from './coverage.js';
import usersRoutes from './users.js';
import authRoutes from './auth.js';
import filesRoutes from './files.js';

const v1Routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoute);
  await fastify.register(shexmapsRoutes, { prefix: '/shexmaps' });
  await fastify.register(coverageRoutes, { prefix: '/coverage' });
  await fastify.register(usersRoutes, { prefix: '/users' });
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(filesRoutes, { prefix: '/files' });
};

export default v1Routes;
