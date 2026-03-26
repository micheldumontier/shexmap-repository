import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { FastifyPluginAsync } from 'fastify';
import { config } from '../../config.js';

const filesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { filename: string } }>('/:filename', async (request, reply) => {
    // Sanitise: strip any path traversal, keep only the basename
    const filename = basename(request.params.filename);
    if (!filename.endsWith('.shex') && !filename.endsWith('.shexj')) {
      return reply.code(400).send({ error: 'Only .shex and .shexj files are served here' });
    }

    const filePath = join(config.filesDir, filename);
    if (!existsSync(filePath)) {
      return reply.code(404).send({ error: 'File not found' });
    }

    const stat = statSync(filePath);
    reply
      .header('Content-Type', 'text/plain; charset=utf-8')
      .header('Content-Length', stat.size)
      .header('Cache-Control', 'public, max-age=3600');

    return reply.send(createReadStream(filePath));
  });
};

export default filesRoutes;
