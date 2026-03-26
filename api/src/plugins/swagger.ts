import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export default fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'ShExMap Repository API',
        description: 'REST API for storing, retrieving, and managing ShExMaps',
        version: '1.0.0',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        },
      },
      tags: [
        { name: 'shexmaps', description: 'ShExMap CRUD and search' },
        { name: 'coverage', description: 'Coverage metrics and gap analysis' },
        { name: 'users', description: 'User profiles and dashboards' },
        { name: 'auth', description: 'Authentication endpoints' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/api/v1/docs',
    uiConfig: { docExpansion: 'list' },
  });
});
