import { config } from '../config.js';

const base = config.rdf.baseNamespace; // e.g. 'https://w3id.org/shexmap/'

export const PREFIXES = {
  shexmap:      `${base}ontology#`,
  shexr:        `${base}resource/`,
  shexrmap:     `${base}resource/map/`,
  shexrschema:  `${base}resource/schema/`,
  shexruser:    `${base}resource/user/`,
  shexrpair:    `${base}resource/pairing/`,
  shexrversion: `${base}resource/version/`,
  shex:        'http://www.w3.org/ns/shex#',
  dcat:    'http://www.w3.org/ns/dcat#',
  dct:     'http://purl.org/dc/terms/',
  prov:    'http://www.w3.org/ns/prov#',
  schema:  'https://schema.org/',
  xsd:     'http://www.w3.org/2001/XMLSchema#',
  rdf:     'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs:    'http://www.w3.org/2000/01/rdf-schema#',
} as const;

export type PrefixKey = keyof typeof PREFIXES;

/** Expand a prefixed name like "shexmap:ShExMap" to its full IRI */
export function expand(prefixed: string): string {
  const [prefix, local] = prefixed.split(':');
  const base = PREFIXES[prefix as PrefixKey];
  if (!base) throw new Error(`Unknown prefix: ${prefix}`);
  return `${base}${local}`;
}

/** Build a SPARQL PREFIX block from the shared prefix map */
export function sparqlPrefixes(): string {
  return Object.entries(PREFIXES)
    .map(([k, v]) => `PREFIX ${k}: <${v}>`)
    .join('\n');
}
