import type { FastifyInstance } from 'fastify';
import type { CoverageOverview, CoverageReport, ShapeGap } from '../models/coverage.model.js';
import { sparqlSelect } from './sparql.service.js';
import { PREFIXES } from '../rdf/prefixes.js';

const SM = PREFIXES.shexmap;

export async function getCoverageOverview(fastify: FastifyInstance): Promise<CoverageOverview> {
  const sparql = `
    SELECT ?schema ?schemaTitle (COUNT(DISTINCT ?shape) AS ?totalShapes)
           (COUNT(DISTINCT ?map) AS ?mappingCount)
    WHERE {
      ?schema a <${SM}ShExSchema> .
      OPTIONAL { ?schema dct:title ?schemaTitle }
      OPTIONAL { ?shape <${SM}belongsToSchema> ?schema }
      OPTIONAL {
        ?map a <${SM}ShExMap> ;
             <${SM}sourceSchema> ?schema .
      }
    }
    GROUP BY ?schema ?schemaTitle
    ORDER BY DESC(?mappingCount)
  `;

  const rows = await sparqlSelect(fastify, sparql);

  let totalShapes = 0;
  let totalMappedShapes = 0;

  const bySchema: CoverageReport[] = rows.map((r) => {
    const total = parseInt(r['totalShapes']?.value ?? '0', 10);
    const mapped = Math.min(parseInt(r['mappingCount']?.value ?? '0', 10), total);
    totalShapes += total;
    totalMappedShapes += mapped;

    return {
      schemaUrl: r['schema']?.value ?? '',
      schemaTitle: r['schemaTitle']?.value ?? r['schema']?.value ?? '',
      totalShapes: total,
      mappedShapes: mapped,
      coveragePercent: total > 0 ? Math.round((mapped / total) * 100) : 0,
      computedAt: new Date().toISOString(),
    };
  });

  // Fetch totals
  const totalsQuery = `
    SELECT (COUNT(DISTINCT ?schema) AS ?schemas) (COUNT(DISTINCT ?map) AS ?maps)
    WHERE {
      ?schema a <${SM}ShExSchema> .
      OPTIONAL { ?map a <${SM}ShExMap> }
    }
  `;
  const totalsRows = await sparqlSelect(fastify, totalsQuery);
  const totalSchemas = parseInt(totalsRows[0]?.['schemas']?.value ?? '0', 10);
  const totalShexMaps = parseInt(totalsRows[0]?.['maps']?.value ?? '0', 10);

  return {
    totalSchemas,
    totalShexMaps,
    totalShapes,
    totalMappedShapes,
    overallCoveragePercent: totalShapes > 0
      ? Math.round((totalMappedShapes / totalShapes) * 100)
      : 0,
    bySchema,
    computedAt: new Date().toISOString(),
  };
}

export async function getGapAnalysis(
  fastify: FastifyInstance,
  schemaUrl?: string
): Promise<ShapeGap[]> {
  const schemaFilter = schemaUrl
    ? `FILTER(?schema = <${schemaUrl}>)`
    : '';

  const sparql = `
    SELECT ?schema ?shape ?shapeLabel (COUNT(DISTINCT ?map) AS ?mappingCount)
    WHERE {
      ?shape <${SM}belongsToSchema> ?schema .
      OPTIONAL { ?shape rdfs:label ?shapeLabel }
      OPTIONAL {
        ?map a <${SM}ShExMap> ;
             <${SM}sourceSchema> ?schema .
      }
      ${schemaFilter}
    }
    GROUP BY ?schema ?shape ?shapeLabel
    HAVING (COUNT(DISTINCT ?map) = 0)
    ORDER BY ?schema ?shape
  `;

  const rows = await sparqlSelect(fastify, sparql);

  return rows.map((r) => ({
    schemaUrl: r['schema']?.value ?? '',
    shapeUrl: r['shape']?.value ?? '',
    shapeLabel: r['shapeLabel']?.value ?? r['shape']?.value ?? '',
    hasMappings: false,
    mappingCount: 0,
  }));
}
