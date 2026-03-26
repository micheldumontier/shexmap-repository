import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const shexParser = _require('@shexjs/parser') as { construct: () => { parse: (s: string) => { shapes?: { id: string }[] } } };

export interface ShExParseResult {
  valid: boolean;
  shapeCount: number;
  shapes: { id: string; label?: string }[];
  error?: string;
}

/**
 * Parse and validate a ShEx schema string.
 * Returns shape declarations found in the schema.
 */
export function parseShEx(content: string): ShExParseResult {
  try {
    const parser = shexParser.construct();
    const schema = parser.parse(content);

    const shapes = (schema.shapes ?? []).map((shape: { id: string }) => ({
      id: shape.id,
      label: undefined,
    }));

    return { valid: true, shapeCount: shapes.length, shapes };
  } catch (err) {
    return {
      valid: false,
      shapeCount: 0,
      shapes: [],
      error: err instanceof Error ? err.message : 'Unknown parse error',
    };
  }
}

/**
 * Parse a ShExMap content string.
 * ShExMap uses a specific syntax — this is a placeholder for full ShExMap parsing.
 * Currently validates it as a ShEx schema; replace with a dedicated ShExMap parser when available.
 */
export function validateShExMap(content: string): { valid: boolean; error?: string } {
  // TODO: integrate a dedicated ShExMap parser when available in @shexjs/shexmap
  // For now, do basic structural validation
  if (!content.trim()) {
    return { valid: false, error: 'ShExMap content cannot be empty' };
  }
  return { valid: true };
}
