import { z } from 'zod';

export const ShExMapCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  content: z.string().min(1),          // raw ShExMap source text
  sourceSchemaUrl: z.string().url(),   // IRI of the source ShEx schema
  targetSchemaUrl: z.string().url(),   // IRI of the target ShEx schema
  tags: z.array(z.string().max(50)).max(20).default([]),
  license: z.string().url().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default('1.0.0'),
});

export const ShExMapUpdateSchema = ShExMapCreateSchema.partial().extend({
  title: z.string().min(1).max(200).optional(),
});

export const ShExMapQuerySchema = z.object({
  q: z.string().optional(),            // full-text search
  tag: z.string().optional(),
  author: z.string().optional(),       // user ID
  sourceSchema: z.string().optional(), // IRI filter
  targetSchema: z.string().optional(), // IRI filter
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['created', 'modified', 'title', 'stars']).default('modified'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const ShExMapIdSchema = z.object({
  id: z.string().min(1).max(256),
});

export type ShExMapCreate = z.infer<typeof ShExMapCreateSchema>;
export type ShExMapUpdate = z.infer<typeof ShExMapUpdateSchema>;
export type ShExMapQuery = z.infer<typeof ShExMapQuerySchema>;

export interface ShExFile {
  id: string;          // local IRI fragment, e.g. "bpfhir"
  title?: string;
  fileName: string;
  fileFormat: string;
  sourceUrl?: string;  // dct:source URL
}

export interface ShExMap {
  id: string;
  title: string;
  description?: string;
  content: string;
  sourceSchemaUrl: string;
  targetSchemaUrl: string;
  sourceFiles: ShExFile[];
  targetFiles: ShExFile[];
  tags: string[];
  license?: string;
  version: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  modifiedAt: string;
  stars: number;
  currentVersionNumber: number;
}
