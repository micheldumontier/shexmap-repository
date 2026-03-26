import type { FastifyPluginAsync } from 'fastify';
import { getCoverageOverview, getGapAnalysis } from '../../services/coverage.service.js';

const coverageRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.get('/', {
    schema: { tags: ['coverage'], summary: 'Coverage overview across all schemas' },
  }, async () => {
    return getCoverageOverview(fastify);
  });

  fastify.get('/gaps', {
    schema: { tags: ['coverage'], summary: 'Shapes with no ShExMap coverage (gap analysis)' },
  }, async (request) => {
    const { schema } = request.query as { schema?: string };
    return getGapAnalysis(fastify, schema);
  });

};

export default coverageRoutes;
