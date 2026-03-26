import { v4 as uuidv4 } from 'uuid';
import type { FastifyInstance } from 'fastify';
import type { ShExMapCreate, ShExMapUpdate, ShExMapQuery, ShExMap, ShExFile } from '../models/shexmap.model.js';
import { sparqlSelect, sparqlUpdate } from './sparql.service.js';
import { validateShExMap } from './shex.service.js';
import { PREFIXES } from '../rdf/prefixes.js';

const RM  = PREFIXES.shexrmap;
const RU  = PREFIXES.shexruser;
const RF  = PREFIXES.shexrfile;
const SM  = PREFIXES.shexmap;

export async function listShExMaps(
  fastify: FastifyInstance,
  query: ShExMapQuery
): Promise<{ items: ShExMap[]; total: number }> {
  const offset = (query.page - 1) * query.limit;

  // Build filter clauses
  const filters: string[] = [];
  if (query.q) filters.push(`FILTER(CONTAINS(LCASE(?title), LCASE("${escapeStr(query.q)}")))`);
  if (query.tag) filters.push(`FILTER(EXISTS { ?id dcat:keyword "${escapeStr(query.tag)}" })`);
  if (query.author) filters.push(`FILTER(?authorId = <${RU}${escapeStr(query.author)}>)`);
  if (query.sourceSchema) filters.push(`FILTER(?sourceSchema = <${escapeStr(query.sourceSchema)}>)`);
  if (query.targetSchema) filters.push(`FILTER(?targetSchema = <${escapeStr(query.targetSchema)}>)`);

  const filterBlock = filters.join('\n  ');
  const orderBy = `ORDER BY ${query.order === 'desc' ? 'DESC' : 'ASC'}(?${query.sort === 'stars' ? 'stars' : query.sort})`;

  const sparql = `
    SELECT ?id ?title ?description ?sourceSchema ?targetSchema ?authorId ?authorName
           ?createdAt ?modifiedAt ?version ?stars
    WHERE {
      ?id a <${SM}ShExMap> ;
          dct:title ?title ;
          <${SM}sourceSchema> ?sourceSchema ;
          <${SM}targetSchema> ?targetSchema ;
          dct:creator ?authorId ;
          dct:created ?createdAt ;
          dct:modified ?modifiedAt ;
          schema:version ?version .
      OPTIONAL { ?id dct:description ?description }
      OPTIONAL { ?authorId schema:name ?authorName }
      OPTIONAL { ?id <${SM}stars> ?stars }
      ${filterBlock}
    }
    ${orderBy}
    LIMIT ${query.limit}
    OFFSET ${offset}
  `;

  const rows = await sparqlSelect(fastify, sparql);

  const items: ShExMap[] = rows.map((r) => ({
    id: extractLocalId(r['id']?.value ?? ''),
    title: r['title']?.value ?? '',
    description: r['description']?.value,
    content: '',   // content not fetched in list — use getShExMap for full content
    sourceSchemaUrl: r['sourceSchema']?.value ?? '',
    targetSchemaUrl: r['targetSchema']?.value ?? '',
    tags: [],         // fetched separately if needed
    sourceFiles: [],  // fetched in getShExMap
    targetFiles: [],  // fetched in getShExMap
    version: r['version']?.value ?? '1.0.0',
    authorId: extractLocalId(r['authorId']?.value ?? ''),
    authorName: r['authorName']?.value ?? 'Unknown',
    createdAt: r['createdAt']?.value ?? '',
    modifiedAt: r['modifiedAt']?.value ?? '',
    stars: parseInt(r['stars']?.value ?? '0', 10),
    currentVersionNumber: 1,
  }));

  return { items, total: items.length };
}

export async function getShExMap(
  fastify: FastifyInstance,
  id: string
): Promise<ShExMap | null> {
  const iri = `${RM}${id}`;

  const sparql = `
    SELECT ?title ?description ?content
           ?sourceSchema ?targetSchema
           ?authorId ?authorName ?createdAt ?modifiedAt ?version ?stars
           ?srcFile ?srcFileTitle ?srcFileName ?srcFileFormat ?srcFileSource
           ?tgtFile ?tgtFileTitle ?tgtFileName ?tgtFileFormat ?tgtFileSource
    WHERE {
      <${iri}> a <${SM}ShExMap> ;
          dct:title ?title ;
          <${SM}sourceSchema> ?sourceSchema ;
          <${SM}targetSchema> ?targetSchema ;
          dct:creator ?authorId ;
          dct:created ?createdAt ;
          dct:modified ?modifiedAt ;
          schema:version ?version .
      OPTIONAL { <${iri}> dct:description ?description }
      OPTIONAL { <${iri}> <${SM}mappingContent> ?content }
      OPTIONAL { ?authorId schema:name ?authorName }
      OPTIONAL { <${iri}> <${SM}stars> ?stars }
      OPTIONAL {
        <${iri}> <${SM}hasSourceFile> ?srcFile .
        OPTIONAL { ?srcFile dct:title ?srcFileTitle }
        OPTIONAL { ?srcFile <${SM}fileName> ?srcFileName }
        OPTIONAL { ?srcFile <${SM}fileFormat> ?srcFileFormat }
        OPTIONAL { ?srcFile dct:source ?srcFileSource }
      }
      OPTIONAL {
        <${iri}> <${SM}hasTargetFile> ?tgtFile .
        OPTIONAL { ?tgtFile dct:title ?tgtFileTitle }
        OPTIONAL { ?tgtFile <${SM}fileName> ?tgtFileName }
        OPTIONAL { ?tgtFile <${SM}fileFormat> ?tgtFileFormat }
        OPTIONAL { ?tgtFile dct:source ?tgtFileSource }
      }
    }
  `;

  const rows = await sparqlSelect(fastify, sparql);
  if (!rows.length) return null;

  const r = rows[0]!;
  const content = r['content']?.value ?? '';

  // Collect unique ShExFile resources (rows may repeat if multiple files)
  const srcFileMap = new Map<string, ShExFile>();
  const tgtFileMap = new Map<string, ShExFile>();
  for (const row of rows) {
    if (row['srcFile']?.value) {
      const fileIri = row['srcFile'].value;
      if (!srcFileMap.has(fileIri)) {
        srcFileMap.set(fileIri, {
          id: extractLocalId(fileIri),
          title: row['srcFileTitle']?.value,
          fileName: row['srcFileName']?.value ?? '',
          fileFormat: row['srcFileFormat']?.value ?? 'shexc',
          sourceUrl: row['srcFileSource']?.value,
        });
      }
    }
    if (row['tgtFile']?.value) {
      const fileIri = row['tgtFile'].value;
      if (!tgtFileMap.has(fileIri)) {
        tgtFileMap.set(fileIri, {
          id: extractLocalId(fileIri),
          title: row['tgtFileTitle']?.value,
          fileName: row['tgtFileName']?.value ?? '',
          fileFormat: row['tgtFileFormat']?.value ?? 'shexc',
          sourceUrl: row['tgtFileSource']?.value,
        });
      }
    }
  }

  return {
    id,
    title: r['title']?.value ?? '',
    description: r['description']?.value,
    content,
    sourceSchemaUrl: r['sourceSchema']?.value ?? '',
    targetSchemaUrl: r['targetSchema']?.value ?? '',
    sourceFiles: [...srcFileMap.values()],
    targetFiles: [...tgtFileMap.values()],
    tags: [],
    version: r['version']?.value ?? '1.0.0',
    authorId: extractLocalId(r['authorId']?.value ?? ''),
    authorName: r['authorName']?.value ?? 'Unknown',
    createdAt: r['createdAt']?.value ?? '',
    modifiedAt: r['modifiedAt']?.value ?? '',
    stars: parseInt(r['stars']?.value ?? '0', 10),
    currentVersionNumber: 1,
  };
}

export async function createShExMap(
  fastify: FastifyInstance,
  data: ShExMapCreate,
  authorId: string
): Promise<ShExMap> {
  const validation = validateShExMap(data.content);
  if (!validation.valid) {
    throw new Error(`Invalid ShExMap: ${validation.error}`);
  }

  const id = uuidv4();
  const iri = `${RM}${id}`;
  const now = new Date().toISOString();
  const authorIri = `${RU}${authorId}`;

  const tagTriples = data.tags
    .map((t) => `<${iri}> dcat:keyword "${escapeStr(t)}" .`)
    .join('\n  ');

  const update = `
    INSERT DATA {
      <${iri}> a <${SM}ShExMap> ;
        dct:identifier "${id}" ;
        dct:title "${escapeStr(data.title)}" ;
        ${data.description ? `dct:description "${escapeStr(data.description)}" ;` : ''}
        <${SM}mappingContent> """${data.content}""" ;
        <${SM}sourceSchema> <${data.sourceSchemaUrl}> ;
        <${SM}targetSchema> <${data.targetSchemaUrl}> ;
        ${data.license ? `dct:license <${data.license}> ;` : ''}
        schema:version "${data.version}" ;
        dct:creator <${authorIri}> ;
        dct:created "${now}"^^xsd:dateTime ;
        dct:modified "${now}"^^xsd:dateTime ;
        <${SM}stars> 0 .
      ${tagTriples}
    }
  `;

  await sparqlUpdate(fastify, update);

  return (await getShExMap(fastify, id)) ?? {
    id, ...data, authorId, authorName: '', tags: data.tags,
    sourceFiles: [], targetFiles: [],
    createdAt: now, modifiedAt: now, stars: 0, currentVersionNumber: 1,
  };
}

export async function deleteShExMap(
  fastify: FastifyInstance,
  id: string
): Promise<void> {
  const iri = `${RM}${id}`;
  await sparqlUpdate(fastify, `DELETE WHERE { <${iri}> ?p ?o }`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function extractLocalId(iri: string): string {
  const parts = iri.split('/');
  return parts[parts.length - 1] ?? iri;
}
