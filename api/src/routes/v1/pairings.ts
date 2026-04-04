import type { FastifyPluginAsync } from 'fastify';
import {
  ShExMapPairingCreateSchema,
  ShExMapPairingUpdateSchema,
  ShExMapPairingQuerySchema,
  ShExMapIdSchema,
} from '../../models/shexmap.model.js';
import {
  listShExMapPairings,
  getShExMapPairing,
  createShExMapPairing,
  updateShExMapPairing,
  deleteShExMapPairing,
} from '../../services/shexmap.service.js';
import { config } from '../../config.js';

const pairingsRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.get('/', {
    schema: { tags: ['pairings'], summary: 'List ShExMap Pairings' },
  }, async (request) => {
    const query = ShExMapPairingQuerySchema.parse(request.query);
    return listShExMapPairings(fastify, query);
  });

  fastify.get('/:id', {
    schema: { tags: ['pairings'], summary: 'Get a ShExMap Pairing by ID' },
  }, async (request, reply) => {
    const { id } = ShExMapIdSchema.parse(request.params);
    const pairing = await getShExMapPairing(fastify, id);
    if (!pairing) return reply.notFound(`ShExMapPairing ${id} not found`);
    return pairing;
  });

  fastify.post('/', {
    schema: { tags: ['pairings'], summary: 'Create a ShExMap Pairing' },
    preHandler: [fastify.requireAuth],
  }, async (request, reply) => {
    const data = ShExMapPairingCreateSchema.parse(request.body);
    const authorId = config.auth.enabled
      ? (request.user as { sub: string }).sub
      : 'anonymous';
    const pairing = await createShExMapPairing(fastify, data, authorId);
    return reply.code(201).send(pairing);
  });

  fastify.patch('/:id', {
    schema: { tags: ['pairings'], summary: 'Update a ShExMap Pairing' },
    preHandler: [fastify.requireAuth],
  }, async (request, reply) => {
    const { id } = ShExMapIdSchema.parse(request.params);
    const existing = await getShExMapPairing(fastify, id);
    if (!existing) return reply.notFound(`ShExMapPairing ${id} not found`);
    const data = ShExMapPairingUpdateSchema.parse(request.body);
    const updated = await updateShExMapPairing(fastify, id, data);
    return updated;
  });

  fastify.delete('/:id', {
    schema: { tags: ['pairings'], summary: 'Delete a ShExMap Pairing' },
    preHandler: [fastify.requireAuth],
  }, async (request, reply) => {
    const { id } = ShExMapIdSchema.parse(request.params);
    const existing = await getShExMapPairing(fastify, id);
    if (!existing) return reply.notFound(`ShExMapPairing ${id} not found`);
    await deleteShExMapPairing(fastify, id);
    return reply.code(204).send();
  });

};

export default pairingsRoutes;
