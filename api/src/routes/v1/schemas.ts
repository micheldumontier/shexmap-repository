import type { FastifyPluginAsync } from 'fastify';
import { sparqlSelect } from '../../services/sparql.service.js';
import { PREFIXES } from '../../rdf/prefixes.js';

const SM = PREFIXES.shexmap;
const DCT = PREFIXES.dct;

const schemasRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /schemas — list all known ShExSchemas with linked ShExMap IDs
  fastify.get('/', {
    schema: { tags: ['schemas'], summary: 'List all known ShExSchemas' },
  }, async () => {
    const sparql = `
      SELECT ?schema ?title ?description ?source ?mapId
      WHERE {
        ?schema a <${SM}ShExSchema> .
        OPTIONAL { ?schema <${DCT}title> ?title }
        OPTIONAL { ?schema <${DCT}description> ?description }
        OPTIONAL { ?schema <${DCT}source> ?source }
        OPTIONAL { ?mapId <${SM}hasSchema> ?schema }
      }
      ORDER BY ?title
    `;

    const rows = await sparqlSelect(fastify, sparql);

    // Group rows by schema IRI, collecting associated map IDs
    const bySchema = new Map<string, {
      id: string;
      url: string;
      title: string;
      description?: string;
      sourceUrl?: string;
      shexMapIds: string[];
    }>();

    for (const row of rows) {
      const url = row['schema']?.value ?? '';
      const id = url.split('/').pop() ?? url;
      if (!bySchema.has(url)) {
        bySchema.set(url, {
          id,
          url,
          title: row['title']?.value ?? id,
          description: row['description']?.value,
          sourceUrl: row['source']?.value,
          shexMapIds: [],
        });
      }
      const mapIri = row['mapId']?.value;
      if (mapIri) {
        const mapId = mapIri.split('/').pop() ?? mapIri;
        const entry = bySchema.get(url)!;
        if (!entry.shexMapIds.includes(mapId)) {
          entry.shexMapIds.push(mapId);
        }
      }
    }

    return [...bySchema.values()];
  });

};

export default schemasRoutes;
