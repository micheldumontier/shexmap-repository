import { z } from 'zod';

// ─── Individual ShExMap ───────────────────────────────────────────────────────

export const ShExMapCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  content: z.string().optional(),         // inline ShExMap source text
  fileName: z.string().max(200).optional(),
  fileFormat: z.enum(['shexc', 'shexj']).default('shexc'),
  sourceUrl: z.string().url().optional(), // dct:source — URL to the .shex file
  schemaUrl: z.string().url().optional(), // IRI of the ShExSchema this annotates
  tags: z.array(z.string().max(50)).max(20).default([]),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default('1.0.0'),
});

export const ShExMapUpdateSchema = ShExMapCreateSchema.partial().extend({
  title: z.string().min(1).max(200).optional(),
});

export const ShExMapQuerySchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().optional(),
  schemaUrl: z.string().optional(),
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

export interface ShExMap {
  id: string;
  title: string;
  description?: string;
  content?: string;
  fileName?: string;
  fileFormat: string;
  sourceUrl?: string;
  schemaUrl?: string;
  tags: string[];
  version: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  modifiedAt: string;
  stars: number;
}

// ─── ShExMap Pairing ──────────────────────────────────────────────────────────

export const ShExMapPairingCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sourceMapId: z.string().min(1).max(256),
  targetMapId: z.string().min(1).max(256),
  tags: z.array(z.string().max(50)).max(20).default([]),
  license: z.string().url().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default('1.0.0'),
});

export const ShExMapPairingUpdateSchema = ShExMapPairingCreateSchema.partial().extend({
  title: z.string().min(1).max(200).optional(),
});

export const ShExMapPairingQuerySchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().optional(),
  sourceMapId: z.string().optional(),
  targetMapId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['created', 'modified', 'title', 'stars']).default('modified'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ShExMapPairingCreate = z.infer<typeof ShExMapPairingCreateSchema>;
export type ShExMapPairingUpdate = z.infer<typeof ShExMapPairingUpdateSchema>;
export type ShExMapPairingQuery = z.infer<typeof ShExMapPairingQuerySchema>;

export interface ShExMapPairing {
  id: string;
  title: string;
  description?: string;
  sourceMap: ShExMap;
  targetMap: ShExMap;
  tags: string[];
  license?: string;
  version: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  modifiedAt: string;
  stars: number;
}
