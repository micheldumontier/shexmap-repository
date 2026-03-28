import type { FastifyPluginAsync } from 'fastify';
import { validate } from '../../services/shexmap-validate.service.js';

const validateRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: {
      sourceShEx: string;
      sourceRdf: string;
      sourceNode: string;
      targetShEx?: string;
      targetNode?: string;
    };
  }>('/', async (request, reply) => {
    const { sourceShEx, sourceRdf, sourceNode, targetShEx, targetNode } = request.body ?? {};

    if (!sourceShEx || !sourceRdf || !sourceNode) {
      return reply.code(400).send({ error: 'sourceShEx, sourceRdf, and sourceNode are required' });
    }

    const result = await validate(sourceShEx, sourceRdf, sourceNode, targetShEx, targetNode);
    return reply.send(result);
  });
};

export default validateRoutes;
