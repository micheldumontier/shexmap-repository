import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  ShExMapCreateSchema,
  ShExMapUpdateSchema,
  ShExMapQuerySchema,
  ShExMapIdSchema,
} from '../../models/shexmap.model.js';
import {
  listShExMaps,
  getShExMap,
  createShExMap,
  deleteShExMap,
} from '../../services/shexmap.service.js';
import { config } from '../../config.js';

const shexmapsRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /shexmaps — list with filters
  fastify.get('/', {
    schema: { tags: ['shexmaps'], summary: 'List ShExMaps' },
  }, async (request) => {
    const query = ShExMapQuerySchema.parse(request.query);
    return listShExMaps(fastify, query);
  });

  // GET /shexmaps/:id — get one
  fastify.get('/:id', {
    schema: { tags: ['shexmaps'], summary: 'Get a ShExMap by ID' },
  }, async (request, reply) => {
    const { id } = ShExMapIdSchema.parse(request.params);
    const map = await getShExMap(fastify, id);
    if (!map) return reply.notFound(`ShExMap ${id} not found`);
    return map;
  });

  // POST /shexmaps — create
  fastify.post('/', {
    schema: { tags: ['shexmaps'], summary: 'Submit a new ShExMap' },
    preHandler: [fastify.requireAuth],
  }, async (request, reply) => {
    const data = ShExMapCreateSchema.parse(request.body);
    // When auth is disabled use a placeholder author; when enabled use JWT subject
    const authorId = config.auth.enabled
      ? (request.user as { sub: string }).sub
      : 'anonymous';
    const map = await createShExMap(fastify, data, authorId);
    return reply.code(201).send(map);
  });

  // DELETE /shexmaps/:id
  fastify.delete('/:id', {
    schema: { tags: ['shexmaps'], summary: 'Delete a ShExMap' },
    preHandler: [fastify.requireAuth],
  }, async (request, reply) => {
    const { id } = ShExMapIdSchema.parse(request.params);
    const existing = await getShExMap(fastify, id);
    if (!existing) return reply.notFound(`ShExMap ${id} not found`);
    await deleteShExMap(fastify, id);
    return reply.code(204).send();
  });

};

export default shexmapsRoutes;
